import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

type InvoiceType = "IN" | "OUT";

type UpdateInvoiceBody = {
  invoice_date?: string;
  type?: InvoiceType;
  note?: string | null;
  lines?: Array<{ product_id?: string; quantity?: number; note?: string | null }>;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;

  const { data: invoice, error: invError } = await supabaseServer
    .from("stock_invoices")
    .select("id, godown_id, invoice_no, invoice_seq, invoice_date, type, note, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", user.uid)
    .is("deleted_at", null)
    .single();

  if (invError || !invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  const { data: lines, error: linesError } = await supabaseServer
    .from("stock_invoice_lines")
    .select("id, product_id, quantity, note")
    .eq("invoice_id", id)
    .eq("user_id", user.uid)
    .order("created_at", { ascending: true });

  if (linesError) {
    return new Response(linesError.message, { status: 500 });
  }

  return Response.json({ ...invoice, lines: lines ?? [] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const body = (await req.json()) as UpdateInvoiceBody;

  const { data: existing, error: existingError } = await supabaseServer
    .from("stock_invoices")
    .select("id, godown_id, invoice_date, type")
    .eq("id", id)
    .eq("user_id", user.uid)
    .is("deleted_at", null)
    .single();

  if (existingError || !existing) {
    return new Response("Invoice not found", { status: 404 });
  }

  const invoice_date = body.invoice_date ?? existing.invoice_date;
  const type = (body.type ?? existing.type) as InvoiceType;
  const rawLines = body.lines ?? [];

  const normalizedLines = rawLines
    .map((l) => ({
      product_id: l.product_id,
      quantity: typeof l.quantity === "number" ? l.quantity : Number(l.quantity),
      note: l.note ?? null,
    }))
    .filter((l) => l.product_id && l.quantity && l.quantity > 0);

  if (normalizedLines.length === 0) {
    return new Response("At least 1 line is required", { status: 400 });
  }

  const { data: existingLines, error: existingLinesError } = await supabaseServer
    .from("stock_invoice_lines")
    .select("product_id, quantity")
    .eq("user_id", user.uid)
    .eq("invoice_id", id);

  if (existingLinesError) {
    return new Response(existingLinesError.message, { status: 500 });
  }

  const productIds = Array.from(
    new Set([
      ...normalizedLines.map((l) => l.product_id!),
      ...(existingLines ?? []).map((l) => l.product_id),
    ]),
  );

  // Validate stock only as-of the invoice date after reversing this invoice.
  // This matches "reverse invoice first then apply" behavior.
  if (type === "OUT" && productIds.length > 0) {
    const byProduct = new Map<string, number>();
    for (const l of normalizedLines) {
      byProduct.set(l.product_id!, (byProduct.get(l.product_id!) ?? 0) + Number(l.quantity));
    }

    const outProductIds = Array.from(byProduct.keys());

    const { data: products, error: prodError } = await supabaseServer
      .from("products")
      .select("id, opening_stock")
      .eq("user_id", user.uid)
      .is("deleted_at", null)
      .in("id", outProductIds);

    if (prodError) {
      return new Response(prodError.message, { status: 500 });
    }

    if (!products || products.length !== outProductIds.length) {
      return new Response("One or more products not found", { status: 404 });
    }

    const { data: movements, error: movError } = await supabaseServer
      .from("stock_movements")
      .select("product_id, movement_date, type, quantity, created_at")
      .eq("user_id", user.uid)
      .in("product_id", outProductIds)
      .neq("stock_invoice_id", id)
      .order("movement_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (movError) {
      return new Response(movError.message, { status: 500 });
    }

    const targetDate = new Date(invoice_date);

    for (const p of products) {
      let balance = Number(p.opening_stock ?? 0);
      for (const m of movements ?? []) {
        if (m.product_id !== p.id) continue;
        const d = new Date(m.movement_date);
        if (d > targetDate) break;
        balance += m.type === "IN" ? Number(m.quantity) : -Number(m.quantity);
      }

      const outQty = byProduct.get(p.id) ?? 0;
      if (balance - outQty < 0) {
        return new Response("Operation would result in negative stock", { status: 400 });
      }
    }
  }

  // Reverse old effects.
  const { error: deleteMovError } = await supabaseServer
    .from("stock_movements")
    .delete()
    .eq("user_id", user.uid)
    .eq("stock_invoice_id", id);

  if (deleteMovError) {
    return new Response(deleteMovError.message, { status: 500 });
  }

  const { data: updatedHeader, error: updateHeaderError } = await supabaseServer
    .from("stock_invoices")
    .update({
      invoice_date,
      type,
      note: body.note ?? null,
      updated_at: new Date().toISOString(),
      updated_by: user.uid,
    })
    .eq("id", id)
    .eq("user_id", user.uid)
    .select("*")
    .single();

  if (updateHeaderError || !updatedHeader) {
    return new Response(updateHeaderError?.message || "Unable to update invoice", {
      status: 500,
    });
  }

  const { error: deleteLinesError } = await supabaseServer
    .from("stock_invoice_lines")
    .delete()
    .eq("user_id", user.uid)
    .eq("invoice_id", id);

  if (deleteLinesError) {
    return new Response(deleteLinesError.message, { status: 500 });
  }

  const linesPayload = normalizedLines.map((l) => ({
    user_id: user.uid,
    invoice_id: id,
    product_id: l.product_id,
    quantity: l.quantity,
    note: l.note ?? null,
  }));

  const { data: createdLines, error: insertLinesError } = await supabaseServer
    .from("stock_invoice_lines")
    .insert(linesPayload)
    .select("*");

  if (insertLinesError) {
    return new Response(insertLinesError.message, { status: 500 });
  }

  const movementsPayload = normalizedLines.map((l) => ({
    user_id: user.uid,
    product_id: l.product_id,
    movement_date: invoice_date,
    type,
    quantity: l.quantity,
    note: l.note ?? null,
    created_by: user.uid,
    stock_invoice_id: id,
  }));

  const { data: createdMovements, error: insertMovError } = await supabaseServer
    .from("stock_movements")
    .insert(movementsPayload)
    .select("*");

  if (insertMovError) {
    return new Response(insertMovError.message, { status: 500 });
  }

  return Response.json({
    ...updatedHeader,
    lines: createdLines ?? [],
    movements: createdMovements ?? [],
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;

  const { data: existing, error: existingError } = await supabaseServer
    .from("stock_invoices")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.uid)
    .is("deleted_at", null)
    .single();

  if (existingError || !existing) {
    return new Response("Invoice not found", { status: 404 });
  }

  // Delete movements first so stock is reverted.
  const { error: deleteMovError } = await supabaseServer
    .from("stock_movements")
    .delete()
    .eq("user_id", user.uid)
    .eq("stock_invoice_id", id);

  if (deleteMovError) {
    return new Response(deleteMovError.message, { status: 500 });
  }

  // Soft-delete invoice so it can be recovered from recycle bin later.
  const { error: deleteInvError } = await supabaseServer
    .from("stock_invoices")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.uid,
    })
    .eq("user_id", user.uid)
    .eq("id", id)
    .is("deleted_at", null);

  if (deleteInvError) {
    return new Response(deleteInvError.message, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
