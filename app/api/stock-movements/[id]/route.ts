import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const body = await req.json();

  const {
    movement_date,
    type,
    quantity,
    note,
  } = body as {
    movement_date?: string;
    type?: "IN" | "OUT";
    quantity?: number;
    note?: string | null;
  };

  if (!movement_date || !type || !quantity || quantity <= 0) {
    return new Response("Invalid payload", { status: 400 });
  }

  // Get the movement to update
  const { data: existingMovement, error: fetchError } = await supabaseServer
    .from("stock_movements")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.uid)
    .single();

  if (fetchError || !existingMovement) {
    return new Response("Movement not found", { status: 404 });
  }

  // Check if update would cause negative stock
  const { data: product, error: productError } = await supabaseServer
    .from("products")
    .select("id, user_id, opening_stock")
    .eq("id", existingMovement.product_id)
    .eq("user_id", user.uid)
    .single();

  if (productError || !product) {
    return new Response("Product not found", { status: 404 });
  }

  // Calculate current stock balance up to movement date (excluding the movement being updated)
  const { data: movements, error: movError } = await supabaseServer
    .from("stock_movements")
    .select("movement_date, type, quantity")
    .eq("product_id", existingMovement.product_id)
    .eq("user_id", user.uid)
    .neq("id", id) // Exclude the movement being updated
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

  // Update the movement
  const { data, error } = await supabaseServer
    .from("stock_movements")
    .update({
      movement_date,
      type,
      quantity,
      note: note ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.uid)
    .select("*")
    .single();

  if (error) {
    console.error("[DeepStaq] Failed to update movement", error);
    return new Response(error.message || "Unable to update movement.", {
      status: 500,
    });
  }

  return Response.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;

  // Get the movement to delete
  const { data: existingMovement, error: fetchError } = await supabaseServer
    .from("stock_movements")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.uid)
    .single();

  if (fetchError || !existingMovement) {
    return new Response("Movement not found", { status: 404 });
  }

  // Check if deletion would cause negative stock
  const { data: product, error: productError } = await supabaseServer
    .from("products")
    .select("id, user_id, opening_stock")
    .eq("id", existingMovement.product_id)
    .eq("user_id", user.uid)
    .single();

  if (productError || !product) {
    return new Response("Product not found", { status: 404 });
  }

  // Calculate current stock balance up to movement date (excluding the movement being deleted)
  const { data: movements, error: movError } = await supabaseServer
    .from("stock_movements")
    .select("movement_date, type, quantity")
    .eq("product_id", existingMovement.product_id)
    .eq("user_id", user.uid)
    .neq("id", id) // Exclude the movement being deleted
    .order("movement_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (movError) {
    return new Response(movError.message, { status: 500 });
  }

  let balance = Number(product.opening_stock ?? 0);
  const targetDate = new Date(existingMovement.movement_date);

  for (const m of movements ?? []) {
    const d = new Date(m.movement_date);
    if (d > targetDate) break;
    balance += m.type === "IN" ? Number(m.quantity) : -Number(m.quantity);
  }

  // Calculate what the balance would be after removing this movement
  const newBalance = existingMovement.type === "IN" 
    ? balance - Number(existingMovement.quantity)
    : balance + Number(existingMovement.quantity);

  if (newBalance < 0) {
    return new Response("Deletion would result in negative stock", {
      status: 400,
    });
  }

  // Delete the movement
  const { error, count } = await supabaseServer
    .from("stock_movements")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.uid);

  if (error) {
    console.error("[DeepStaq] Failed to delete movement", error);
    return new Response(error.message || "Unable to delete movement.", {
      status: 500,
    });
  }

  if (!count) {
    return new Response("Movement not found", { status: 404 });
  }

  return new Response(null, { status: 204 });
}
