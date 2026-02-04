import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const godownId = searchParams.get("godownId");

  let query = supabaseServer
    .from("products")
    .select("*, companies(name), unit_types(name)")
    .eq("user_id", user.uid);

  if (godownId) {
    query = query.eq("godown_id", godownId);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();

  const {
    godown_id,
    company_id,
    name,
    sku,
    unit_type_id,
    opening_stock,
    min_stock_threshold,
    cost_price,
    selling_price,
  } = body as {
    godown_id?: string;
    company_id?: string;
    name?: string;
    sku?: string | null;
    unit_type_id?: string;
    opening_stock?: number;
    min_stock_threshold?: number;
    cost_price?: number | null;
    selling_price?: number | null;
  };

  if (!godown_id || !company_id || !name || !unit_type_id) {
    return new Response("Missing required fields", { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("products")
    .insert({
      user_id: user.uid,
      godown_id,
      company_id,
      name,
      sku: sku ?? null,
      unit_type_id,
      opening_stock: opening_stock ?? 0,
      min_stock_threshold: min_stock_threshold ?? 0,
      cost_price: cost_price ?? null,
      selling_price: selling_price ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}

