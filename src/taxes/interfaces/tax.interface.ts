export interface Tax {
  id: string;
  company_id: string;
  name: string;
  rate: number; // Tasa de impuesto (ej. 0.19 para 19%)
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

