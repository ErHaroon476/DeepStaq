import { NextRequest } from "next/server";
import { requireUser } from "@/lib/authServer";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(_req: NextRequest) {
  const user = await requireUser();

  const [productsRes, invoicesRes] = await Promise.all([
    supabaseServer
      .from("products")
      .select("id, name, sku, deleted_at, godown_id, companies(name), unit_types(name)")
      .eq("user_id", user.uid)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabaseServer
      .from("stock_invoices")
      .select("id, invoice_no, type, invoice_date, note, deleted_at, godown_id")
      .eq("user_id", user.uid)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ]);

  if (productsRes.error) {
    return new Response(productsRes.error.message, { status: 500 });
  }

  if (invoicesRes.error) {
    return new Response(invoicesRes.error.message, { status: 500 });
  }

  return Response.json({
    products: productsRes.data ?? [],
    invoices: invoicesRes.data ?? [],
  });
}
