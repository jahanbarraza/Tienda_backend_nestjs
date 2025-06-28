export interface Subcategory {
  id: string;
  company_id: string;
  category_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

