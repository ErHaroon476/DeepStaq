import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

type InvoiceType = "IN" | "OUT";

type CreateInvoiceBody = {
  godown_id?: string;
  invoice_date?: string;
  type?: InvoiceType;
  note?: string | null;
  lines?: Array<{ product_id?: string; quantity?: number; note?: string | null }>;
};

function padInvoiceSeq(seq: number) {
  return String(seq).padStart(6, "0");
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const godownId = searchParams.get("godownId");
  const type = searchParams.get("type") as InvoiceType | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!godownId) {
    return new Response("godownId is required", { status: 400 });
  }

  let query = supabaseServer
    .from("stock_invoices")
    .select("id, invoice_no, invoice_seq, invoice_date, type, note, created_at, updated_at")
    .eq("user_id", user.uid)
    .eq("godown_id", godownId)
    .is("deleted_at", null);

  if (type === "IN" || type === "OUT") {
    query = query.eq("type", type);
  }

  if (from) query = query.gte("invoice_date", from);
  if (to) query = query.lte("invoice_date", to);

  const { data, error } = await query.order("invoice_date", { ascending: false }).order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = (await req.json()) as CreateInvoiceBody;

  const godown_id = body.godown_id;
  const invoice_date = body.invoice_date;
  const type = body.type;
  const note = body.note ?? null;
  const lines = body.lines ?? [];

  if (!godown_id || !invoice_date || (type !== "IN" && type !== "OUT")) {
    return new Response("Invalid payload", { status: 400 });
  }

  const normalizedLines = lines
    .map((l) => ({
      product_id: l.product_id,
      quantity: typeof l.quantity === "number" ? l.quantity : Number(l.quantity),
      note: l.note ?? null,
    }))
    .filter((l) => l.product_id && l.quantity && l.quantity > 0);

  if (normalizedLines.length === 0) {
    return new Response("At least 1 line is required", { status: 400 });
  }

  // Compute next sequence number per godown + type.
  const { data: maxSeqRow, error: maxSeqError } = await supabaseServer
    .from("stock_invoices")
    .select("invoice_seq")
    .eq("user_id", user.uid)
    .eq("godown_id", godown_id)
    .eq("type", type)
    .order("invoice_seq", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxSeqError) {
    return new Response(maxSeqError.message, { status: 500 });
  }

  const nextSeq = (maxSeqRow?.invoice_seq ?? 0) + 1;
  const invoice_no = `${type}-${padInvoiceSeq(nextSeq)}`;

  // Validate stock for OUT (aggregate by product).
  if (type === "OUT") {
    const byProduct = new Map<string, number>();
    for (const l of normalizedLines) {
      byProduct.set(l.product_id!, (byProduct.get(l.product_id!) ?? 0) + Number(l.quantity));
    }

    const productIds = Array.from(byProduct.keys());

    const { data: products, error: prodError } = await supabaseServer
      .from("products")
      .select("id, user_id, opening_stock")
      .eq("user_id", user.uid)
      .is("deleted_at", null)
      .in("id", productIds);

    if (prodError) {
      return new Response(prodError.message, { status: 500 });
    }

    if (!products || products.length !== productIds.length) {
      return new Response("One or more products not found", { status: 404 });
    }

    const { data: movements, error: movError } = await supabaseServer
      .from("stock_movements")
      .select("product_id, movement_date, type, quantity")
      .eq("user_id", user.uid)
      .in("product_id", productIds)
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

  // Create invoice header.
  const { data: header, error: headerError } = await supabaseServer
    .from("stock_invoices")
    .insert({
      user_id: user.uid,
      godown_id,
      invoice_seq: nextSeq,
      invoice_no,
      invoice_date,
      type,
      note,
      created_by: user.uid,
    })
    .select("*")
    .single();

  if (headerError || !header) {
    return new Response(headerError?.message || "Unable to create invoice", { status: 500 });
  }

  // Create invoice lines.
  const linesPayload = normalizedLines.map((l) => ({
    user_id: user.uid,
    invoice_id: header.id,
    product_id: l.product_id,
    quantity: l.quantity,
    note: l.note,
  }));

  const { data: createdLines, error: linesError } = await supabaseServer
    .from("stock_invoice_lines")
    .insert(linesPayload)
    .select("*");

  if (linesError) {
    return new Response(linesError.message, { status: 500 });
  }

  // Create stock movements (so existing reports/analytics keep working).
  const movementsPayload = normalizedLines.map((l) => ({
    user_id: user.uid,
    product_id: l.product_id,
    movement_date: invoice_date,
    type,
    quantity: l.quantity,
    note: l.note ?? note,
    created_by: user.uid,
    stock_invoice_id: header.id,
  }));

  const { data: createdMovements, error: movInsertError } = await supabaseServer
    .from("stock_movements")
    .insert(movementsPayload)
    .select("*");

  if (movInsertError) {
    return new Response(movInsertError.message, { status: 500 });
  }

  return Response.json(
    {
      ...header,
      lines: createdLines ?? [],
      movements: createdMovements ?? [],
    },
    { status: 201 },
  );
}
