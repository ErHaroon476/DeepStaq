import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";
import dayjs from "dayjs";


export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const godownId = searchParams.get("godownId");

  if (!from || !to) {
    return new Response("from/to required", { status: 400 });
  }

  const start = dayjs(from).startOf("day");
  const end = dayjs(to).endOf("day");

  // Get products for the godown
  let productsQuery = supabaseServer
    .from("products")
    .select("id, name, opening_stock");

  if (godownId) {
    productsQuery = productsQuery.eq("godown_id", godownId);
  }

  const { data: products } = await productsQuery.eq("user_id", user.uid);

  if (!products || products.length === 0) {
    return Response.json({ rows: [] });
  }

  // Get all stock movements up to the end date
  let movementsQuery = supabaseServer
    .from("stock_movements")
    .select("movement_date, type, quantity, product_id")
    .eq("user_id", user.uid)
    .lte("movement_date", end.toISOString());

  if (godownId) {
    movementsQuery = movementsQuery.in("product_id", products.map(p => p.id));
  }

  const { data: movements } = await movementsQuery;

  // Calculate opening and closing stock for each product
  const closingStockRows = products
    .map(product => {
      const productMovements = movements?.filter(m => m.product_id === product.id) || [];
      
      // Calculate opening stock (as of start date)
      const movementsBeforeStart = productMovements.filter(m => 
        dayjs(m.movement_date).isBefore(start)
      );
      
      const openingStockIn = movementsBeforeStart
        .filter(m => m.type === "IN")
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const openingStockOut = movementsBeforeStart
        .filter(m => m.type === "OUT")
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const openingStock = Number(product.opening_stock) + openingStockIn - openingStockOut;
      
      // Calculate closing stock (as of end date)
      const stockIn = productMovements
        .filter(m => m.type === "IN")
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const stockOut = productMovements
        .filter(m => m.type === "OUT")
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      
      const closingStock = Number(product.opening_stock) + stockIn - stockOut;

      return {
        productName: product.name,
        openingStock: openingStock,
        closingStock: closingStock,
        hasActivity: productMovements.length > 0
      };
    })
    // Only include products that had movements within the date range
    .filter(product => product.hasActivity);

  return Response.json({
    type: "closing-stock",
    from: start.toISOString(),
    to: end.toISOString(),
    rows: closingStockRows,
  });
}
