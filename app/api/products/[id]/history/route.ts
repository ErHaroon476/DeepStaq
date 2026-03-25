import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id: productId } = await params;

  if (!productId) {
    return new Response("Product id is required", { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("stock_movements")
    .select(
      "id, movement_date, type, quantity, note, created_at, stock_invoice_id, stock_invoices(invoice_no, invoice_date, type)",
    )
    .eq("user_id", user.uid)
    .eq("product_id", productId)
    .order("movement_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data ?? []);
}
