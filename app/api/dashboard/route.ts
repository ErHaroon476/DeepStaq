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
  let alerts: Array<{
    product_id: string;
    godown_id: string;
    name: string;
    current_stock: number;
    alert_type: "EMPTY" | "LOW" | "OK";
  }> = [];

  try {
    const { data: stockRows, error: stockError } = await supabaseServer
      .from("product_current_stock")
      .select("product_id, godown_id, name, current_stock")
      .eq("user_id", user.uid);

    if (stockError) {
      console.error("[DeepStaq] Failed to load product current stock", stockError);
    } else {
      alerts =
        stockRows?.map((r: any) => {
          const current = Number(r.current_stock ?? 0);
          const alert_type = current <= 0 ? "EMPTY" : current < 3 ? "LOW" : "OK";
          return {
            product_id: r.product_id,
            godown_id: r.godown_id,
            name: r.name,
            current_stock: current,
            alert_type,
          };
        }) ?? [];

      alertsCount = alerts.filter((a) => a.alert_type !== "OK").length;
      alerts.sort((a, b) => {
        const rank = (t: string) => (t === "EMPTY" ? 0 : t === "LOW" ? 1 : 2);
        return rank(a.alert_type) - rank(b.alert_type);
      });
    }
  } catch (err) {
    console.error("[DeepStaq] Error while loading dashboard product stock", err);
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
    alerts,
    series: Object.values(seriesMap).sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  });
}

