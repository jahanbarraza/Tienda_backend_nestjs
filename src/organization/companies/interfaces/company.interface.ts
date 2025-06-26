export interface Company {
  id: string;
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyWithStats extends Company {
  stores_count: number;
  users_count: number;
}

export interface CompanyFilters {
  search?: string;
  is_active?: boolean;
  created_from?: Date;
  created_to?: Date;
}

export interface CompanyResponse {
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  storesCount?: number;
  usersCount?: number;
}

