export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, any>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RoleWithStats extends Role {
  users_count: number;
}

export interface RoleFilters {
  search?: string;
  is_active?: boolean;
  created_from?: Date;
  created_to?: Date;
}

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  usersCount?: number;
}

