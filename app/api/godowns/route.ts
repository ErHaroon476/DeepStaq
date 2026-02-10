import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

interface SupabaseError {
  code?: string;
  message?: string;
}

export async function GET() {
  const user = await requireUser();

  const { data, error } = await supabaseServer
    .from("godowns")
    .select("*")
    .eq("user_id", user.uid)
    .order("created_at", { ascending: true });

  if (error) {
    // If the table doesn't exist yet (e.g. schema not applied), fail soft and return empty.
    const code = (error as SupabaseError)?.code;
    const message = (error as SupabaseError)?.message;
    console.error("[DeepStaq] Failed to load godowns", error);
    if (
      code === "42P01" ||
      message?.includes("Could not find the table 'public.godowns'")
    ) {
      return Response.json([]);
    }
    return new Response("Unable to load godowns.", { status: 500 });
  }

  return Response.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const body = await req.json();

  const { name, description } = body as {
    name?: string;
    description?: string | null;
  };

  if (!name) {
    return new Response("Name is required", { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("godowns")
    .insert({
      user_id: user.uid,
      name,
      description: description ?? null,
    })
    .select("*")
    .single();

  if (error) {
    const code = (error as SupabaseError)?.code;
    const message = (error as SupabaseError)?.message;
    console.error("[DeepStaq] Failed to create godown", error);
    if (
      code === "42P01" ||
      message?.includes("Could not find the table 'public.godowns'")
    ) {
      return new Response(
        "Database schema is not applied yet. Run supabase-schema.sql in Supabase SQL editor, then retry.",
        { status: 503 },
      );
    }
    return new Response(message || "Unable to create godown.", { status: 500 });
  }

  return Response.json(data, { status: 201 });
}

