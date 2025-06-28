export interface Product {
  id: string;
  company_id: string;
  category_id: string;
  subcategory_id?: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  cost?: number;
  stock?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  
  // Joined fields from related tables
  category_name?: string;
  subcategory_name?: string;
}

