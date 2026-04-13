import { NextRequest } from "next/server";
import { requireUser } from "@/lib/authServer";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;

  const { data, error } = await supabaseServer
    .from("products")
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq("id", id)
    .eq("user_id", user.uid)
    .not("deleted_at", "is", null)
    .select("id")
    .single();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  if (!data) {
    return new Response("Deleted product not found", { status: 404 });
  }

  return Response.json({ ok: true });
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
    .eq("user_id", user.uid)
    .not("deleted_at", "is", null);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  if (!count) {
    return new Response("Deleted product not found", { status: 404 });
  }

  return new Response(null, { status: 204 });
}
