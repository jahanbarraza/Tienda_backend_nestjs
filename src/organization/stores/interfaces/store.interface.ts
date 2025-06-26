export interface Store {
  id: string;
  company_id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface StoreWithCompany extends Store {
  company: {
    id: string;
    name: string;
  };
}

export interface StoreWithStats extends StoreWithCompany {
  users_count: number;
  sales_count: number;
}

export interface StoreFilters {
  search?: string;
  company_id?: string;
  is_active?: boolean;
  created_from?: Date;
  created_to?: Date;
}

export interface StoreResponse {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  company?: {
    id: string;
    name: string;
  };
  usersCount?: number;
  salesCount?: number;
}

