import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserWithDetails } from '../../auth/interfaces/auth.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserWithDetails => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

