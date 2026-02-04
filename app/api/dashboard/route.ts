import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";
import dayjs from "dayjs";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "monthly";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let startDate: string;
  let endDate: string;

  const today = dayjs();

  switch (range) {
    case "daily":
      startDate = today.startOf("day").toISOString();
      endDate = today.endOf("day").toISOString();
      break;
    case "weekly":
      startDate = today.startOf("week").toISOString();
      endDate = today.endOf("week").toISOString();
      break;
    case "yearly":
      startDate = today.startOf("year").toISOString();
      endDate = today.endOf("year").toISOString();
      break;
    case "custom":
      if (!from || !to) {
        return new Response("from/to required for custom range", {
          status: 400,
        });
      }
      startDate = dayjs(from).startOf("day").toISOString();
      endDate = dayjs(to).endOf("day").toISOString();
      break;
    case "monthly":
    default:
      startDate = today.startOf("month").toISOString();
      endDate = today.endOf("month").toISOString();
  }

  const [{ count: godownsCount }, { count: productsCount }] = await Promise.all(
    [
      supabaseServer
        .from("godowns")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.uid),
      supabaseServer
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.uid),
    ],
  );

  const { data: stockMovements, error: movementsError } =
    await supabaseServer
      .from("stock_movements")
      .select("type, quantity, movement_date, product_id, user_id")
      .eq("user_id", user.uid)
      .gte("movement_date", startDate)
      .lte("movement_date", endDate);

  if (movementsError) {
    console.error("[DeepStaq] Failed to load stock movements", movementsError);
  }

  let totalIn = 0;
  let totalOut = 0;
  let totalStockValue = 0;

  const seriesMap: Record<string, { date: string; in: number; out: number }> =
    {};

  // Build a cost map so we can approximate stock value without fragile joins.
  let costMap: Record<string, number> = {};
  try {
    const { data: productsForCost, error: productsError } = await supabaseServer
      .from("products")
      .select("id, cost_price")
      .eq("user_id", user.uid);
    if (productsError) {
      console.error("[DeepStaq] Failed to load products for cost", productsError);
    } else {
      costMap =
        productsForCost?.reduce((acc: Record<string, number>, p: any) => {
          if (p.cost_price != null) {
            acc[p.id] = Number(p.cost_price);
          }
          return acc;
        }, {}) ?? {};
    }
  } catch (err) {
    console.error("[DeepStaq] Error while building product cost map", err);
  }

  stockMovements?.forEach((m: any) => {
    const key = dayjs(m.movement_date).format("YYYY-MM-DD");
    if (!seriesMap[key]) {
      seriesMap[key] = { date: key, in: 0, out: 0 };
    }
    const qty = Number(m.quantity);
    const cost = costMap[m.product_id] ?? 0;

    if (m.type === "IN") {
      totalIn += qty;
      seriesMap[key].in += qty;
      totalStockValue += qty * cost;
    } else {
      totalOut += qty;
      seriesMap[key].out += qty;
      totalStockValue -= qty * cost;
    }
  });

  let alertsCount = 0;
  try {
    const { data: alerts, error: alertsError } = await supabaseServer
      .rpc("current_stock_alerts", { p_user_id: user.uid })
      .select();

    if (alertsError) {
      console.error("[DeepStaq] Failed to load stock alerts", alertsError);
    } else {
      alertsCount = alerts?.length ?? 0;
    }
  } catch (err) {
    console.error("[DeepStaq] current_stock_alerts RPC missing or failed", err);
  }

  return Response.json({
    kpis: {
      godowns: godownsCount ?? 0,
      products: productsCount ?? 0,
      stockIn: totalIn,
      stockOut: totalOut,
      stockValue: totalStockValue,
      alerts: alertsCount,
    },
    series: Object.values(seriesMap).sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  });
}

