import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";
import dayjs from "dayjs";

interface StockMovement {
  movement_date: string;
  type: "IN" | "OUT";
  quantity: number;
  product_id?: string;
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const type =
    (searchParams.get("type") as
      | "daily"
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

  console.log("[DEBUG] Report parameters:", { 
    type, 
    from: start.toISOString(), 
    to: end.toISOString(), 
    godownId,
    userId: user.uid 
  });

  // Get all products for the report
  let productsQuery = supabaseServer
    .from("products")
    .select("id, name, opening_stock, godown_id");

  if (godownId) {
    productsQuery = productsQuery.eq("godown_id", godownId);
  }

  const { data: products, error: productsError } = await productsQuery.eq("user_id", user.uid);

  if (productsError) {
    console.error("[DEBUG] Products query error:", productsError);
    return new Response(productsError.message, { status: 500 });
  }

  if (!products || products.length === 0) {
    console.log("[DEBUG] No products found for user:", user.uid);
    return new Response("No products found", { status: 404 });
  }

  console.log("[DEBUG] Found products:", products.length);

  // Get all movements within date range
  let movementsInRangeQuery = supabaseServer
    .from("stock_movements")
    .select("movement_date, type, quantity, product_id")
    .eq("user_id", user.uid)
    .gte("movement_date", start.format("YYYY-MM-DD"))
    .lte("movement_date", end.format("YYYY-MM-DD"));

  if (godownId) {
    movementsInRangeQuery = movementsInRangeQuery.in("product_id", products.map(p => p.id));
  }

  const { data: movementsInRange, error: movementsInRangeError } = await movementsInRangeQuery;

  if (movementsInRangeError) {
    console.error("[DEBUG] Movements in range error:", movementsInRangeError);
    return new Response(movementsInRangeError.message, { status: 500 });
  }

  console.log("[DEBUG] Movements in range:", movementsInRange?.length || 0);

  // Get all movements before start date for opening stock calculation
  let allMovementsBeforeStartQuery = supabaseServer
    .from("stock_movements")
    .select("movement_date, type, quantity, product_id")
    .eq("user_id", user.uid)
    .lt("movement_date", start.format("YYYY-MM-DD"));

  if (godownId) {
    allMovementsBeforeStartQuery = allMovementsBeforeStartQuery.in("product_id", products.map(p => p.id));
  }

  const { data: allMovementsBeforeStart, error: movementsBeforeError } = await allMovementsBeforeStartQuery;

  if (movementsBeforeError) {
    console.error("[DEBUG] Movements before start error:", movementsBeforeError);
    return new Response(movementsBeforeError.message, { status: 500 });
  }

  console.log("[DEBUG] Movements before start:", allMovementsBeforeStart?.length || 0);

  // Calculate summary for each product, but only include those with movements in the date range
  const summaryRows = products
    .map(product => {
      // Calculate opening stock (as of start date)
      const movementsBeforeStart = allMovementsBeforeStart?.filter((m: StockMovement) => 
        m.product_id === product.id
      ) || [];
      
      const openingStockIn = movementsBeforeStart
        .filter((m: StockMovement) => m.type === "IN")
        .reduce((sum: number, m: StockMovement) => sum + Number(m.quantity), 0);
      
      const openingStockOut = movementsBeforeStart
        .filter((m: StockMovement) => m.type === "OUT")
        .reduce((sum: number, m: StockMovement) => sum + Number(m.quantity), 0);
      
      const openingStock = Number(product.opening_stock) + openingStockIn - openingStockOut;
      
      // Calculate IN and OUT within date range
      const movementsInRangeForProduct = movementsInRange?.filter((m: StockMovement) => 
        m.product_id === product.id
      ) || [];
      
      const stockIn = movementsInRangeForProduct
        .filter((m: StockMovement) => m.type === "IN")
        .reduce((sum: number, m: StockMovement) => sum + Number(m.quantity), 0);
      
      const stockOut = movementsInRangeForProduct
        .filter((m: StockMovement) => m.type === "OUT")
        .reduce((sum: number, m: StockMovement) => sum + Number(m.quantity), 0);
      
      // Calculate closing stock (as of end date)
      const closingStock = openingStock + stockIn - stockOut;

      // Debug logging for each product
      console.log(`[DEBUG] Product: ${product.name}`, {
        openingStock: product.opening_stock,
        movementsBeforeStart: movementsBeforeStart.length,
        openingStockIn,
        openingStockOut,
        calculatedOpeningStock: openingStock,
        movementsInRange: movementsInRangeForProduct.length,
        stockIn,
        stockOut,
        closingStock
      });

      return {
        key: product.name,
        opening: openingStock,
        in: stockIn,
        out: stockOut,
        closing: closingStock,
        hasMovementsInRange: movementsInRangeForProduct.length > 0
      };
    })
    .filter(product => product.hasMovementsInRange || product.in > 0 || product.out > 0)
    .map(({ hasMovementsInRange, ...product }) => product);

  const result = {
    type,
    from: start.toISOString(),
    to: end.toISOString(),
    rows: summaryRows,
  };

  console.log("[DEBUG] Final report result:", result);

  return Response.json(result);
}
