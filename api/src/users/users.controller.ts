import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { PublicUser } from './user.js';
import { UsersService } from './users.service.js';

/** GET /users : la liste des personnes, pour que les gestionnaires gèrent leurs habilitations. */
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles('manager')
  findAll(): Promise<PublicUser[]> {
    return this.users.findAll();
  }
}
