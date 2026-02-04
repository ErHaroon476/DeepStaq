export type Godown = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type UnitType = {
  id: string;
  godown_id: string;
  name: string;
  has_open_pieces: boolean;
};

export type Company = {
  id: string;
  godown_id: string;
  name: string;
};

export type Product = {
  id: string;
  godown_id: string;
  company_id: string;
  name: string;
  sku: string | null;
  unit_type_id: string;
  opening_stock: number;
  min_stock_threshold: number;
  cost_price: number | null;
  selling_price: number | null;
};

export type StockMovementType = "IN" | "OUT";

export type StockMovement = {
  id: string;
  product_id: string;
  movement_date: string; // ISO date
  type: StockMovementType;
  quantity: number;
  note: string | null;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  corrected_movement_id: string | null;
};

