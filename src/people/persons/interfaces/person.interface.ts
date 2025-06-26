export interface Person {
  id: string;
  identification_type_id: string;
  identification_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  birth_date?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PersonWithDetails extends Person {
  identification_type: {
    id: string;
    name: string;
    code: string;
  };
  users_count: number;
}

export interface PersonFilters {
  search?: string;
  identification_type_id?: string;
  is_active?: boolean;
  created_from?: Date;
  created_to?: Date;
}

export interface PersonResponse {
  id: string;
  identificationTypeId: string;
  identificationNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  birthDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  identificationType?: {
    id: string;
    name: string;
    code: string;
  };
  usersCount?: number;
}

