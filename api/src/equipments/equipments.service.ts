import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.guard.js';
import { DomainError } from '../common/domain-error.js';
import type { Equipment, Maintenance } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { EquipmentDetail, EquipmentView, MaintenanceView, Zone } from './equipment.js';

type EquipmentRow = Equipment & { maintenances: Maintenance[]; habilitations: { id: string }[] };

@Injectable()
export class EquipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Une seule requête, avec les maintenances et l'habilitation de l'utilisateur : pas de N+1. */
  async findAll(user: JwtPayload, zone?: Zone): Promise<EquipmentView[]> {
    const now = new Date();
    const rows = await this.prisma.equipment.findMany({
      where: zone ? { zone } : {},
      include: this.includeFor(user, now),
      orderBy: { code: 'asc' },
    });
    return rows.map((row) => this.toView(row, now));
  }

  async findOne(id: string, user: JwtPayload): Promise<EquipmentDetail> {
    const now = new Date();
    const row = await this.prisma.equipment.findUnique({ where: { id }, include: this.includeFor(user, now) });
    if (!row) throw new DomainError('not-found', 'Équipement introuvable.');
    return { ...this.toView(row, now), maintenances: row.maintenances.map(toMaintenanceView) };
  }

  /**
   * Met un équipement en maintenance sur une période. Les réservations
   * actives qui la chevauchent passent à « annulée », avec la raison : leurs
   * auteurs le voient sans attendre de mail. Les deux écritures sont dans une
   * transaction : tout ou rien.
   */
  async createMaintenance(
    equipmentId: string,
    input: { start: Date; end: Date; reason: string },
    manager: JwtPayload,
  ): Promise<{ maintenance: MaintenanceView; cancelledReservations: number }> {
    if (!(input.end > input.start)) throw new DomainError('invalid', 'La fin doit être après le début.');

    return this.prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({ where: { id: equipmentId } });
      if (!equipment) throw new DomainError('not-found', 'Équipement introuvable.');

      const maintenance = await tx.maintenance.create({
        data: { equipmentId, start: input.start, end: input.end, reason: input.reason, createdBy: manager.username },
      });
      const cancelled = await tx.reservation.updateMany({
        where: { equipmentId, status: 'ACTIVE', start: { lt: input.end }, end: { gt: input.start } },
        data: { status: 'CANCELLED', cancelReason: `Maintenance : ${input.reason}` },
      });
      return { maintenance: toMaintenanceView(maintenance), cancelledReservations: cancelled.count };
    });
  }

  /** Termine une maintenance (ou la retire si elle était une erreur). Les réservations annulées le restent. */
  async deleteMaintenance(id: string): Promise<void> {
    const deleted = await this.prisma.maintenance.deleteMany({ where: { id } });
    if (deleted.count === 0) throw new DomainError('not-found', 'Maintenance introuvable.');
  }

  private includeFor(user: JwtPayload, now: Date) {
    return {
      maintenances: { where: { end: { gt: now } }, orderBy: { start: 'asc' as const } },
      habilitations: { where: { userId: user.sub }, select: { id: true } },
    };
  }

  private toView(row: EquipmentRow, now: Date): EquipmentView {
    const inMaintenance = row.maintenances.some((m) => m.start <= now && now < m.end);
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      zone: row.zone as Zone,
      status: inMaintenance ? 'MAINTENANCE' : 'AVAILABLE',
      habilitated: row.habilitations.length > 0,
    };
  }
}

function toMaintenanceView(m: Maintenance): MaintenanceView {
  return { id: m.id, start: m.start, end: m.end, reason: m.reason, createdBy: m.createdBy };
}
