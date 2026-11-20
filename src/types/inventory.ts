export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type MovementType = 'in' | 'out' | 'adjustment' | 'transfer' | 'return';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';
export type PurchaseOrderStatus = 'draft' | 'pending' | 'ordered' | 'received' | 'cancelled';
export type SupplierStatus = 'active' | 'inactive' | 'preferred';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  lead_time_days: number;
  rating: number;
  status: SupplierStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  cost_price: number; // in INR (₹)
  selling_price: number; // in INR (₹)
  current_stock: number;
  min_reorder_level: number;
  max_stock_level: number;
  reorder_quantity: number;
  location: string;
  status: StockStatus;
  supplier_id?: string;
  supplier?: Supplier;
  tags?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product?: Product;
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost?: number;
  reference_number?: string;
  reason?: string;
  performed_by: string;
  batch_number?: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier?: Supplier;
  status: PurchaseOrderStatus;
  total_amount: number;
  items: PurchaseOrderItem[];
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReorderAlert {
  id: string;
  product_id: string;
  product?: Product;
  alert_type: 'low_stock' | 'out_of_stock' | 'surplus' | 'anomaly' | 'reorder_point';
  severity: AlertSeverity;
  current_stock: number;
  threshold: number;
  suggested_quantity: number;
  ai_prediction?: string;
  status: AlertStatus;
  created_at: string;
  resolved_at?: string;
}

export interface AIForecast {
  id: string;
  product_id: string;
  product?: Product;
  predicted_demand_30d: number;
  stockout_risk_percentage: number;
  recommended_reorder_date?: string;
  confidence_score: number;
  forecast_reasoning?: string;
  seasonal_factor?: string;
  updated_at: string;
}

export interface DashboardStats {
  totalInventoryValue: number;
  totalSKUs: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  criticalAlertsCount: number;
  activePurchaseOrders: number;
  monthlyTurnoverRate: number;
}

export interface SupabaseHealthStatus {
  isConfigured: boolean;
  isConnected: boolean;
  mode: 'live_supabase' | 'fallback_mock';
  message: string;
  url?: string;
  databaseStats?: {
    productsCount: number;
    suppliersCount: number;
    alertsCount: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    source: 'supabase' | 'mock_fallback';
    timestamp: string;
  };
}
