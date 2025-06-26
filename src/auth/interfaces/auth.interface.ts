export interface JwtPayload {
  sub: string; // user id
  username: string;
  email: string;
  companyId: string;
  roleId: string;
  roleName: string;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    person: {
      firstName: string;
      lastName: string;
    };
    company: {
      id: string;
      name: string;
    };
    role: {
      id: string;
      name: string;
      permissions: any;
    };
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  company_id: string;
  role_id: string;
  person_id: string;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithDetails extends User {
  person: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    identification_number: string;
  };
  company: {
    id: string;
    name: string;
  };
  role: {
    id: string;
    name: string;
    permissions: any;
  };
}

