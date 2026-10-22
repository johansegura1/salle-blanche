import { SetMetadata } from '@nestjs/common';
import type { Role } from '../users/user.js';

export const ROLES_KEY = 'roles';

/** @Roles(...) declares which roles may call a route. Read by RolesGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
