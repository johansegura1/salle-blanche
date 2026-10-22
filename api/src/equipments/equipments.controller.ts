import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, type JwtPayload } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ListEquipmentsQuery } from './dto/list-equipments.query.js';
import { EquipmentsService } from './equipments.service.js';

/**
 *   GET    /equipments?zone=                 la liste, avec le statut      (connecté)
 *   GET    /equipments/:id                   un équipement et ses maintenances (connecté)
 */
@Controller()
@UseGuards(AuthGuard)
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
}
