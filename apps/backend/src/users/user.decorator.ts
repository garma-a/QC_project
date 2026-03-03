import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from 'src/auth/auth.types';

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser;
    return data ? user?.[data] : user;
  },
);
