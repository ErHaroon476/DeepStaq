import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "[DeepStaq] Supabase service role env vars are missing. Server-side DB operations will not work until they are set."
  );
}

export const supabaseServer = createClient(
  supabaseUrl ?? "",
  serviceRoleKey ?? "",
  {
    auth: {
      persistSession: false,
    },
  },
);

