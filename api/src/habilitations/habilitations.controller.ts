import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, type JwtPayload } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateHabilitationDto } from './dto/create-habilitation.dto.js';
import { ListHabilitationsQuery } from './dto/list-habilitations.query.js';
import { HabilitationsService } from './habilitations.service.js';

/**
 *   GET    /habilitations?userId=   les habilitations d'une personne
 *   POST   /habilitations           accorder   { userId, equipmentId }
 *   DELETE /habilitations/:id       retirer
 * Réservé aux gestionnaires : ce sont eux qui forment.
 */
@Controller('habilitations')
@UseGuards(AuthGuard, RolesGuard)
@Roles('manager')
@ApiBearerAuth()
export class HabilitationsController {
  constructor(private readonly habilitations: HabilitationsService) {}

  @Get()
  findForUser(@Query() query: ListHabilitationsQuery) {
    return this.habilitations.findForUser(query.userId);
  }

  @Post()
  grant(@Body() dto: CreateHabilitationDto, @CurrentUser() manager: JwtPayload) {
    return this.habilitations.grant(dto.userId, dto.equipmentId, manager);
  }

  @Delete(':id')
  @HttpCode(204)
  revoke(@Param('id') id: string): Promise<void> {
    return this.habilitations.revoke(id);
  }
}
