import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, type JwtPayload } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { PlanningQuery } from './dto/planning.query.js';
import { ReservationsService } from './reservations.service.js';

/**
 *   GET    /equipments/:id/reservations?from=&to=   le planning d'un équipement
 *   GET    /reservations/mine                       mes réservations
 *   POST   /reservations                            réserver
 *   DELETE /reservations/:id                        annuler (son auteur ou un gestionnaire)
 * Tout demande d'être connecté.
 */
@Controller()
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get('equipments/:id/reservations')
  planning(@Param('id') id: string, @Query() query: PlanningQuery) {
    return this.reservations.planning(id, new Date(query.from), new Date(query.to));
  }

  @Get('reservations/mine')
  mine(@CurrentUser() user: JwtPayload) {
    return this.reservations.mine(user);
  }

  @Post('reservations')
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: JwtPayload) {
    return this.reservations.create(
      { equipmentId: dto.equipmentId, start: new Date(dto.start), end: new Date(dto.end), note: dto.note },
      user,
    );
  }

  @Delete('reservations/:id')
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.reservations.cancel(id, user);
  }
}
