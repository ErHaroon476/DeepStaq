import { NextRequest } from "next/server";
import { requireUser } from "@/lib/authServer";
import { supabaseServer } from "@/lib/supabaseServer";

type InvoiceType = "IN" | "OUT";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;

  const { data: invoice, error: invoiceError } = await supabaseServer
    .from("stock_invoices")
    .select("id, invoice_date, type, deleted_at")
    .eq("id", id)
    .eq("user_id", user.uid)
    .not("deleted_at", "is", null)
    .single();

  if (invoiceError || !invoice) {
    return new Response(invoiceError?.message || "Deleted invoice not found", {
      status: 404,
    });
  }

  const { data: lines, error: linesError } = await supabaseServer
    .from("stock_invoice_lines")
    .select("product_id, quantity, note")
    .eq("user_id", user.uid)
    .eq("invoice_id", id);

  if (linesError) {
    return new Response(linesError.message, { status: 500 });
  }

  if (!lines || lines.length === 0) {
    return new Response("Invoice lines are missing and cannot be restored", {
      status: 400,
    });
  }

  const productIds = Array.from(new Set(lines.map((line) => line.product_id)));

  const { data: products, error: productError } = await supabaseServer
    .from("products")
    .select("id, opening_stock")
    .eq("user_id", user.uid)
    .is("deleted_at", null)
    .in("id", productIds);

  if (productError) {
    return new Response(productError.message, { status: 500 });
  }

  if (!products || products.length !== productIds.length) {
    return new Response(
      "Cannot restore invoice because one or more products are deleted/missing",
      { status: 400 },
    );
  }

  // Validate OUT restore won't create negative stock.
  if ((invoice.type as InvoiceType) === "OUT") {
    const qtyByProduct = new Map<string, number>();
    for (const line of lines) {
      qtyByProduct.set(
        line.product_id,
        (qtyByProduct.get(line.product_id) ?? 0) + Number(line.quantity),
      );
    }

    const { data: movements, error: movementsError } = await supabaseServer
      .from("stock_movements")
      .select("product_id, movement_date, type, quantity, created_at")
      .eq("user_id", user.uid)
      .in("product_id", productIds)
      .order("movement_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (movementsError) {
      return new Response(movementsError.message, { status: 500 });
    }

    const targetDate = new Date(invoice.invoice_date);
    for (const product of products) {
      let balance = Number(product.opening_stock ?? 0);
      for (const movement of movements ?? []) {
        if (movement.product_id !== product.id) continue;
        if (new Date(movement.movement_date) > targetDate) break;
        balance +=
          movement.type === "IN"
            ? Number(movement.quantity)
            : -Number(movement.quantity);
      }

      const required = qtyByProduct.get(product.id) ?? 0;
      if (balance - required < 0) {
        return new Response(
          "Restore would result in negative stock. Add stock first, then restore.",
          { status: 400 },
        );
      }
    }
  }

  const movementPayload = lines.map((line) => ({
    user_id: user.uid,
    product_id: line.product_id,
    movement_date: invoice.invoice_date,
    type: invoice.type as InvoiceType,
    quantity: Number(line.quantity),
    note: line.note ?? null,
    created_by: user.uid,
    stock_invoice_id: id,
  }));

  const { error: movementInsertError } = await supabaseServer
    .from("stock_movements")
    .insert(movementPayload);

  if (movementInsertError) {
    return new Response(movementInsertError.message, { status: 500 });
  }

  const { error: restoreError } = await supabaseServer
    .from("stock_invoices")
    .update({
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
      updated_by: user.uid,
    })
    .eq("id", id)
    .eq("user_id", user.uid)
    .not("deleted_at", "is", null);

  if (restoreError) {
    return new Response(restoreError.message, { status: 500 });
  }

  return Response.json({ ok: true });
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
    .not("deleted_at", "is", null)
    .single();

  if (existingError || !existing) {
    return new Response("Deleted invoice not found", { status: 404 });
  }

  const { error } = await supabaseServer
    .from("stock_invoices")
    .delete()
    .eq("id", id)
    .eq("user_id", user.uid)
    .not("deleted_at", "is", null);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
