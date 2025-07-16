import { Request } from 'express';

interface User {
  companyId: string;
  // Add other user properties if needed
}

declare module 'express' {
  interface Request {
    user?: User;
  }
}

