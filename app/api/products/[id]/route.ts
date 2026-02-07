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
    name,
    sku,
    company_id,
    unit_type_id,
    opening_stock,
    cost_price,
    selling_price,
  } = body as {
    name?: string;
    sku?: string | null;
    company_id?: string;
    unit_type_id?: string;
    opening_stock?: number;
    cost_price?: number | null;
    selling_price?: number | null;
  };

  if (!name || !name.trim()) {
    return new Response("Name is required", { status: 400 });
  }
  if (!company_id || !unit_type_id) {
    return new Response("Missing required fields", { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("products")
    .update({
      name: name.trim(),
      sku: sku ?? null,
      company_id,
      unit_type_id,
      opening_stock: opening_stock ?? 0,
      min_stock_threshold: 0,
      cost_price: cost_price ?? null,
      selling_price: selling_price ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.uid)
    .select("*")
    .single();

  if (error) {
    console.error("[DeepStaq] Failed to update product", error);
    return new Response((error as any)?.message || "Unable to update product.", {
      status: 500,
    });
  }

  if (!data) {
    return new Response("Product not found", { status: 404 });
  }

  return Response.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;

  const { error, count } = await supabaseServer
    .from("products")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.uid);

  if (error) {
    console.error("[DeepStaq] Failed to delete product", error);
    return new Response((error as any)?.message || "Unable to delete product.", {
      status: 500,
    });
  }

  if (!count) {
    return new Response("Product not found", { status: 404 });
  }

  return new Response(null, { status: 204 });
}
