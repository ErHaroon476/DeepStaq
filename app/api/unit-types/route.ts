import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const godownId = searchParams.get("godownId");

  if (!godownId) {
    return new Response("godownId is required", { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("unit_types")
    .select("*")
    .eq("user_id", user.uid)
    .eq("godown_id", godownId);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();

  const { godown_id, name, has_open_pieces } = body as {
    godown_id?: string;
    name?: string;
    has_open_pieces?: boolean;
  };

  if (!godown_id || !name) {
    return new Response("Missing fields", { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("unit_types")
    .insert({
      user_id: user.uid,
      godown_id,
      name,
      has_open_pieces: has_open_pieces ?? false,
    })
    .select("*")
    .single();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}

