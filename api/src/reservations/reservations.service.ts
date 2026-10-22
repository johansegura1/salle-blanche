import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.guard.js';
import { DomainError } from '../common/domain-error.js';
import type { Equipment, Reservation, User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ReservationStatus, ReservationView } from './reservation.js';
import { checkSlot } from './slot-rules.js';

type ReservationRow = Reservation & { equipment: Equipment; user: User };
const WITH_RELATIONS = { equipment: true, user: true } as const;
const MAX_WINDOW_MS = 31 * 24 * 60 * 60 * 1000;

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Le planning d'un équipement : les réservations actives qui touchent la fenêtre [from, to[. */
  async planning(equipmentId: string, from: Date, to: Date): Promise<ReservationView[]> {
    if (!(to > from)) throw new DomainError('invalid', '`to` doit être après `from`.');
    if (to.getTime() - from.getTime() > MAX_WINDOW_MS) throw new DomainError('invalid', 'Fenêtre de 31 jours au plus.');

    const equipment = await this.prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) throw new DomainError('not-found', 'Équipement introuvable.');

    const rows = await this.prisma.reservation.findMany({
      where: { equipmentId, status: 'ACTIVE', start: { lt: to }, end: { gt: from } },
      include: WITH_RELATIONS,
      orderBy: { start: 'asc' },
    });
    return rows.map(toView);
  }

  /** Toutes mes réservations, annulées comprises : c'est là que je vois qu'une maintenance a annulé la mienne. */
  async mine(user: JwtPayload): Promise<ReservationView[]> {
    const rows = await this.prisma.reservation.findMany({
      where: { userId: user.sub },
      include: WITH_RELATIONS,
      orderBy: { start: 'desc' },
    });
    return rows.map(toView);
  }

  /**
   * Réserver. D'abord ce qui ne coûte rien (la forme du créneau), puis ce qui
   * interroge la base. La vérification et la création sont dans la même
   * transaction : deux clics au même instant sur le même créneau ne passent
   * pas tous les deux, le premier qui réserve a le créneau.
   */
  async create(
    input: { equipmentId: string; start: Date; end: Date; note?: string },
    user: JwtPayload,
  ): Promise<ReservationView> {
    const problem = checkSlot(input.start, input.end);
    if (problem) throw new DomainError('invalid', problem);

    return this.prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({ where: { id: input.equipmentId } });
      if (!equipment) throw new DomainError('not-found', 'Équipement introuvable.');

      // Un gestionnaire réserve aussi pour les entreprises, qui n'ont pas de compte :
      // il n'a pas besoin d'habilitation (c'est lui qui les donne).
      if (user.role !== 'manager') {
        const habilitation = await tx.habilitation.findUnique({
          where: { userId_equipmentId: { userId: user.sub, equipmentId: equipment.id } },
        });
        if (!habilitation) {
          throw new DomainError('forbidden', `Vous n'êtes pas habilité sur ${equipment.code}. Demandez une formation à Claire ou Bruno.`);
        }
      }

      const maintenance = await tx.maintenance.findFirst({
        where: { equipmentId: equipment.id, start: { lt: input.end }, end: { gt: input.start } },
      });
      if (maintenance) throw new DomainError('conflict', `${equipment.code} est en maintenance sur ce créneau.`);

      const clash = await tx.reservation.findFirst({
        where: { equipmentId: equipment.id, status: 'ACTIVE', start: { lt: input.end }, end: { gt: input.start } },
      });
      if (clash) throw new DomainError('conflict', 'Ce créneau est déjà réservé.');

      const row = await tx.reservation.create({
        data: { equipmentId: equipment.id, userId: user.sub, start: input.start, end: input.end, note: input.note },
        include: WITH_RELATIONS,
      });
      return toView(row);
    });
  }

  /** Libérer un créneau : son auteur, ou un gestionnaire. On annule, on ne supprime pas. */
  async cancel(id: string, user: JwtPayload): Promise<ReservationView> {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new DomainError('not-found', 'Réservation introuvable.');

    const isOwner = reservation.userId === user.sub;
    if (!isOwner && user.role !== 'manager') {
      throw new DomainError('forbidden', "Vous ne pouvez annuler que vos propres réservations.");
    }
    if (reservation.status === 'CANCELLED') throw new DomainError('conflict', 'Cette réservation est déjà annulée.');
    if (reservation.end <= new Date()) throw new DomainError('conflict', 'Cette réservation est terminée.');

    const row = await this.prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED', cancelReason: isOwner ? 'Annulée par son auteur' : `Annulée par ${user.name}` },
      include: WITH_RELATIONS,
    });
    return toView(row);
  }
}

function toView(row: ReservationRow): ReservationView {
  return {
    id: row.id,
    equipment: { id: row.equipment.id, code: row.equipment.code, name: row.equipment.name },
    user: { id: row.user.id, name: row.user.name },
    start: row.start,
    end: row.end,
    status: row.status as ReservationStatus,
    note: row.note ?? undefined,
    cancelReason: row.cancelReason ?? undefined,
  };
}
