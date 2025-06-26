export interface User {
  id: string;
  person_id: string;
  company_id: string;
  role_id: string;
  username: string;
  password: string;
  email?: string;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithDetails extends User {
  person: {
    id: string;
    first_name: string;
    last_name: string;
    identification_type: {
      id: string;
      name: string;
      code: string;
    };
    identification_number: string;
  };
  company: {
    id: string;
    name: string;
  };
  role: {
    id: string;
    name: string;
    permissions: Record<string, any>;
  };
}

export interface UserFilters {
  search?: string;
  company_id?: string;
  role_id?: string;
  is_active?: boolean;
  created_from?: Date;
  created_to?: Date;
}

export interface UserResponse {
  id: string;
  personId: string;
  companyId: string;
  roleId: string;
  username: string;
  email?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  person?: {
    id: string;
    firstName: string;
    lastName: string;
    identificationType: {
      id: string;
      name: string;
      code: string;
    };
    identificationNumber: string;
  };
  company?: {
    id: string;
    name: string;
  };
  role?: {
    id: string;
    name: string;
    permissions: Record<string, any>;
  };
}

