import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, type JwtPayload } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { ListEquipmentsQuery } from './dto/list-equipments.query.js';
import { EquipmentsService } from './equipments.service.js';

/**
 *   GET    /equipments?zone=                 la liste, avec le statut      (connecté)
 *   GET    /equipments/:id                   un équipement et ses maintenances (connecté)
 *   POST   /equipments/:id/maintenances      mettre en maintenance         (gestionnaire)
 *   DELETE /maintenances/:id                 retirer une maintenance       (gestionnaire)
 */
@Controller()
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class EquipmentsController {
  constructor(private readonly equipments: EquipmentsService) {}

  @Get('equipments')
  findAll(@Query() query: ListEquipmentsQuery, @CurrentUser() user: JwtPayload) {
    return this.equipments.findAll(user, query.zone);
  }

  @Get('equipments/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.equipments.findOne(id, user);
  }

  @Post('equipments/:id/maintenances')
  @Roles('manager')
  createMaintenance(@Param('id') id: string, @Body() dto: CreateMaintenanceDto, @CurrentUser() user: JwtPayload) {
    return this.equipments.createMaintenance(
      id,
      { start: new Date(dto.start), end: new Date(dto.end), reason: dto.reason },
      user,
    );
  }

  @Delete('maintenances/:id')
  @Roles('manager')
  @HttpCode(204)
  deleteMaintenance(@Param('id') id: string): Promise<void> {
    return this.equipments.deleteMaintenance(id);
  }
}
