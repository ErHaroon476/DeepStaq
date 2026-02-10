import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const body = await req.json();

  const { name, description } = body as {
    name?: string;
    description?: string | null;
  };

  if (!name || !name.trim()) {
    return new Response("Name is required", { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("godowns")
    .update({
      name: name.trim(),
      description: description ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.uid)
    .select("*")
    .single();

  if (error) {
    console.error("[DeepStaq] Failed to update godown", error);
    return new Response((error as SupabaseError)?.message || "Unable to update godown.", {
      status: 500,
    });
  }

  if (!data) {
    return new Response("Godown not found", { status: 404 });
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
    .from("godowns")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.uid);

  if (error) {
    console.error("[DeepStaq] Failed to delete godown", error);
    return new Response((error as SupabaseError)?.message || "Unable to delete godown.", {
      status: 500,
    });
  }

  if (!count) {
    return new Response("Godown not found", { status: 404 });
  }

  return new Response(null, { status: 204 });
}

