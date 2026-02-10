import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const godownId = searchParams.get("godownId");
  const range = searchParams.get("range") || "monthly";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!godownId) {
    return new Response("godownId is required", { status: 400 });
  }

  try {
    console.log("[DeepStaq] Starting analytics with godownId:", godownId, "range:", range);
    
    // Calculate date range
    let dateFilter = "";
    let endDate = "";
    const now = new Date();
    
    switch (range) {
      case "daily":
        dateFilter = now.toISOString().slice(0, 10);
        endDate = now.toISOString().slice(0, 10);
        break;
      case "weekly":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString().slice(0, 10);
        endDate = now.toISOString().slice(0, 10);
        break;
      case "monthly":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = monthAgo.toISOString().slice(0, 10);
        endDate = now.toISOString().slice(0, 10);
        break;
      case "yearly":
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFilter = yearAgo.toISOString().slice(0, 10);
        endDate = now.toISOString().slice(0, 10);
        break;
      case "custom":
        if (!from || !to) {
          return new Response("from and to dates are required for custom range", { status: 400 });
        }
        dateFilter = from;
        endDate = to;
        break;
    }

    console.log("[DeepStaq] Date range:", dateFilter, "to", endDate);

    // Get all products in this godown
    console.log("[DeepStaq] Fetching products...");
    const { data: products, error: productsError } = await supabaseServer
      .from("products")
      .select("id, opening_stock")
      .eq("godown_id", godownId)
      .eq("user_id", user.uid);

    if (productsError) {
      console.error("[DeepStaq] Products error:", productsError);
      throw productsError;
    }

    console.log("[DeepStaq] Found products:", products?.length || 0);

    // Get product IDs
    const productIds = products?.map(p => p.id) || [];
    console.log("[DeepStaq] Product IDs:", productIds);

    // Get all movements for these products (not just filtered range)
    console.log("[DeepStaq] Fetching all movements for stock calculation...");
    const { data: allMovements, error: allMovementsError } = await supabaseServer
      .from("stock_movements")
      .select("movement_date, type, quantity")
      .eq("user_id", user.uid)
      .in("product_id", productIds)
      .order("movement_date", { ascending: true });

    if (allMovementsError) {
      console.error("[DeepStaq] All movements error:", allMovementsError);
      throw allMovementsError;
    }

    console.log("[DeepStaq] Found all movements:", allMovements?.length || 0);

    // Calculate current stock from all movements
    const totalOpeningStockAll = products?.reduce((sum, p) => sum + (Number(p.opening_stock) || 0), 0) || 0;

    // Get movements within the date range
    console.log("[DeepStaq] Fetching movements in range...");
    const movementsQuery = supabaseServer
      .from("stock_movements")
      .select("movement_date, type, quantity")
      .eq("user_id", user.uid)
      .in("product_id", productIds)
      .gte("movement_date", dateFilter)
      .lte("movement_date", endDate);

    const { data: movements, error: movementsError } = await movementsQuery.order("movement_date", { ascending: true });

    if (movementsError) {
      console.error("[DeepStaq] Movements error:", movementsError);
      throw movementsError;
    }

    console.log("[DeepStaq] Found movements in range:", movements?.length || 0);

    // Calculate filtered IN/OUT totals
    const totalStockIn = movements?.filter(m => m.type === "IN").reduce((sum, m) => sum + Number(m.quantity), 0) || 0;
    const totalStockOut = movements?.filter(m => m.type === "OUT").reduce((sum, m) => sum + Number(m.quantity), 0) || 0;

    console.log("[DeepStaq] Stock IN:", totalStockIn, "Stock OUT:", totalStockOut);

    // Calculate opening stock at the start of the filter period
    const movementsBeforePeriod = allMovements?.filter(m => m.movement_date < dateFilter) || [];
    const stockInBeforePeriod = movementsBeforePeriod.filter(m => m.type === "IN").reduce((sum, m) => sum + Number(m.quantity), 0);
    const stockOutBeforePeriod = movementsBeforePeriod.filter(m => m.type === "OUT").reduce((sum, m) => sum + Number(m.quantity), 0);
    const periodOpeningStock = totalOpeningStockAll + stockInBeforePeriod - stockOutBeforePeriod;

    // Calculate current stock at the end of the period
    const periodCurrentStock = periodOpeningStock + totalStockIn - totalStockOut;

    // Only show meaningful data if there are movements in the period
    const hasActivityInPeriod = movements && movements.length > 0;
    const hasAnyStockBefore = periodOpeningStock > 0 || movementsBeforePeriod.length > 0;

    // If no activity in period and no stock before, return zeros
    if (!hasActivityInPeriod && !hasAnyStockBefore) {
      const result = {
        total_opening_stock: 0,
        total_current_stock: 0,
        total_stock_in: 0,
        total_stock_out: 0,
        series: [],
      };
      console.log("[DeepStaq] No activity in period, returning zeros:", result);
      return Response.json(result);
    }

    // If no activity in period but had stock before, show the stock levels
    if (!hasActivityInPeriod && hasAnyStockBefore) {
      const result = {
        total_opening_stock: periodOpeningStock,
        total_current_stock: periodOpeningStock, // No change if no activity
        total_stock_in: 0,
        total_stock_out: 0,
        series: [], // No graph data if no activity
      };
      console.log("[DeepStaq] No activity in period but had stock before:", result);
      return Response.json(result);
    }

    // Group movements by date for the graph
    const movementsByDate = movements?.reduce((acc, movement) => {
      const date = movement.movement_date;
      if (!acc[date]) {
        acc[date] = { stock_in: 0, stock_out: 0 };
      }
      if (movement.type === "IN") {
        acc[date].stock_in += Number(movement.quantity);
      } else {
        acc[date].stock_out += Number(movement.quantity);
      }
      return acc;
    }, {} as Record<string, { stock_in: number; stock_out: number }>) || {};

    // Convert to series format
    const series = Object.entries(movementsByDate).map(([date, data]) => ({
      date,
      stock_in: data.stock_in,
      stock_out: data.stock_out,
    }));

    const result = {
      total_opening_stock: periodOpeningStock,
      total_current_stock: periodCurrentStock,
      total_stock_in: totalStockIn,
      total_stock_out: totalStockOut,
      series,
    };

    console.log("[DeepStaq] Analytics result:", result);

    return Response.json(result);
  } catch (error) {
    console.error("[DeepStaq] Failed to fetch stock analytics", error);
    console.error("[DeepStaq] Error details:", JSON.stringify(error, null, 2));
    
    let errorMessage = "Failed to fetch analytics";
    let errorDetails = "Unknown error";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || "No stack trace";
    } else if (typeof error === 'object') {
      errorDetails = JSON.stringify(error, null, 2);
    } else {
      errorDetails = String(error);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage, details: errorDetails }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
