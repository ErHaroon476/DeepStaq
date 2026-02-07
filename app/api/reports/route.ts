import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const type =
    (searchParams.get("type") as
      | "monthly"
      | "yearly") ?? "monthly";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const godownId = searchParams.get("godownId");

  if (!from || !to) {
    return new Response("from/to required", { status: 400 });
  }

  const start = dayjs(from).startOf("day");
  const end = dayjs(to).endOf("day");

  let query = supabaseServer
    .from("stock_movements")
    .select("movement_date, type, quantity, products!inner(godown_id)")
    .eq("user_id", user.uid)
    .gte("movement_date", start.toISOString())
    .lte("movement_date", end.toISOString());

  if (godownId) {
    query = query.eq("products.godown_id", godownId);
  }

  const { data: movements, error } = await query;

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  // Grouping by day/week/month/year as specified.
  type BucketKey = string;

  const bucketFn = (d: dayjs.Dayjs): BucketKey => {
    switch (type) {
      case "monthly":
        return d.format("YYYY-MM");
      case "yearly":
        return `${d.year()}`;
      default:
        return d.format("YYYY-MM-DD");
    }
  };

  const buckets: Record<
    BucketKey,
    {
      key: string;
      opening: number;
      in: number;
      out: number;
      closing: number;
    }
  > = {};

  // Simple per-period calculation (for more precise opening per day, additional queries can refine this).
  for (const m of movements ?? []) {
    const d = dayjs(m.movement_date);
    const key = bucketFn(d);
    if (!buckets[key]) {
      buckets[key] = {
        key,
        opening: 0,
        in: 0,
        out: 0,
        closing: 0,
      };
    }
    if (m.type === "IN") {
      buckets[key].in += Number(m.quantity);
    } else {
      buckets[key].out += Number(m.quantity);
    }
  }

  // For now we approximate opening as 0 and closing = opening + in - out for each bucket.
  Object.values(buckets).forEach((b) => {
    b.closing = b.opening + b.in - b.out;
  });

  return Response.json({
    type,
    from: start.toISOString(),
    to: end.toISOString(),
    rows: Object.values(buckets).sort((a, b) => a.key.localeCompare(b.key)),
  });
}

