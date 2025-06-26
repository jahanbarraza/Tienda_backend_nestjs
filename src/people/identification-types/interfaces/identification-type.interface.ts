export interface IdentificationType {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IdentificationTypeWithStats extends IdentificationType {
  persons_count: number;
}

export interface IdentificationTypeFilters {
  search?: string;
  is_active?: boolean;
  created_from?: Date;
  created_to?: Date;
}

export interface IdentificationTypeResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  personsCount?: number;
}

