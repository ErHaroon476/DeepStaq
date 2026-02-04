import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const godownId = searchParams.get("godownId");

  let query = supabaseServer
    .from("companies")
    .select("*")
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

  const { godown_id, name } = body as {
    godown_id?: string;
    name?: string;
  };

  if (!godown_id || !name) {
    return new Response("Missing fields", { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("companies")
    .insert({
      user_id: user.uid,
      godown_id,
      name,
    })
    .select("*")
    .single();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}

