import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return new Response("productId is required", { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("stock_movements")
    .select("*")
    .eq("user_id", user.uid)
    .eq("product_id", productId)
    .order("movement_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();

  const {
    product_id,
    movement_date,
    type,
    quantity,
    note,
  } = body as {
    product_id?: string;
    movement_date?: string;
    type?: "IN" | "OUT";
    quantity?: number;
    note?: string | null;
  };

  if (!product_id || !movement_date || !type || !quantity || quantity <= 0) {
    return new Response("Invalid payload", { status: 400 });
  }

  // Ensure we never go negative as of this movement date.
  // Compute stock up to this date including opening stock.
  const { data: product, error: productError } = await supabaseServer
    .from("products")
    .select("id, user_id, opening_stock")
    .eq("id", product_id)
    .eq("user_id", user.uid)
    .single();

  if (productError || !product) {
    return new Response("Product not found", { status: 404 });
  }

  const { data: movements, error: movError } = await supabaseServer
    .from("stock_movements")
    .select("movement_date, type, quantity")
    .eq("product_id", product_id)
    .eq("user_id", user.uid)
    .order("movement_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (movError) {
    return new Response(movError.message, { status: 500 });
  }

  let balance = Number(product.opening_stock ?? 0);
  const targetDate = new Date(movement_date);

  for (const m of movements ?? []) {
    const d = new Date(m.movement_date);
    if (d > targetDate) break;
    balance += m.type === "IN" ? Number(m.quantity) : -Number(m.quantity);
  }

  const newBalance =
    type === "IN" ? balance + Number(quantity) : balance - Number(quantity);

  if (newBalance < 0) {
    return new Response("Operation would result in negative stock", {
      status: 400,
    });
  }

  const { data, error } = await supabaseServer
    .from("stock_movements")
    .insert({
      user_id: user.uid,
      product_id,
      movement_date,
      type,
      quantity,
      note: note ?? null,
      created_by: user.uid,
    })
    .select("*")
    .single();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}

