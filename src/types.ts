export interface User {
  id: number;
  name: string;
  email: string;
  store_name?: string;
  currency_symbol?: string;
  staff_id?: number;
  staff_name?: string;
  staff_role?: string;
  permissions?: string[];
  subscription_tier?: string;
  subscription_expiry?: string;
}

export interface Product {
  id: number;
  user_id: number;
  name: string;
  price: number;
  cost_price: number;
  stock_qty: number;
  expiry_date?: string;
  barcode?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: number;
  user_id: number;
  items: string; // JSON string
  total_amount: number;
  profit: number;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action_type: string;
  description: string;
  staff_name?: string;
  details?: string;
  timestamp: string;
}

export interface Staff {
  id: number;
  user_id: number;
  name: string;
  role: string;
  permissions: string;
  login_id?: string;
}
