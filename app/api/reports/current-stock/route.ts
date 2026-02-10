import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireUser } from "@/lib/authServer";


export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const godownId = searchParams.get("godownId");

  // Get products for godown
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

  // Get all stock movements for current stock calculation
  let movementsQuery = supabaseServer
    .from("stock_movements")
    .select("movement_date, type, quantity, product_id")
    .eq("user_id", user.uid);

  if (godownId) {
    movementsQuery = movementsQuery.in("product_id", products.map(p => p.id));
  }

  const { data: movements } = await movementsQuery;

  // Calculate current stock for each product
  const currentStockRows = products.map(product => {
    const productMovements = movements?.filter(m => m.product_id === product.id) || [];
    
    const stockIn = productMovements
      .filter(m => m.type === "IN")
      .reduce((sum, m) => sum + Number(m.quantity), 0);
    
    const stockOut = productMovements
      .filter(m => m.type === "OUT")
      .reduce((sum, m) => sum + Number(m.quantity), 0);
    
    const currentStock = Number(product.opening_stock) + stockIn - stockOut;

    return {
      productName: product.name,
      currentStock: currentStock
    };
  });

  return Response.json({
    type: "current-stock",
    rows: currentStockRows,
  });
}
