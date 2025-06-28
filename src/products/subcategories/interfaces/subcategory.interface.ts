export interface Subcategory {
  id: number;
  category_id: number;
  company_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

