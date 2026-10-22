import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, JwtPayload } from './auth.guard.js';

/** @CurrentUser() : l'utilisateur que l'AuthGuard a rangé dans la requête. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): JwtPayload => {
  const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
  if (!user) throw new Error('@CurrentUser() needs AuthGuard on the route');
  return user;
});
