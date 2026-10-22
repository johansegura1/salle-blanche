import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.guard.js';
import { DomainError } from '../common/domain-error.js';
import type { Equipment, Habilitation } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface HabilitationView {
  id: string;
  userId: string;
  equipment: { id: string; code: string; name: string };
  grantedBy: string;
  grantedAt: Date;
}

/**
 * Après sa formation (une demi-journée avec Claire ou Bruno), une personne
 * reçoit l'habilitation sur un équipement. C'est ce que vérifie chaque
 * réservation.
 */
@Injectable()
export class HabilitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: string): Promise<HabilitationView[]> {
    const rows = await this.prisma.habilitation.findMany({
      where: { userId },
      include: { equipment: true },
      orderBy: { equipment: { code: 'asc' } },
    });
    return rows.map(toView);
  }

  async grant(userId: string, equipmentId: string, manager: JwtPayload): Promise<HabilitationView> {
    const [user, equipment] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.equipment.findUnique({ where: { id: equipmentId } }),
    ]);
    if (!user) throw new DomainError('not-found', 'Utilisateur introuvable.');
    if (!equipment) throw new DomainError('not-found', 'Équipement introuvable.');

    const existing = await this.prisma.habilitation.findUnique({
      where: { userId_equipmentId: { userId, equipmentId } },
    });
    if (existing) throw new DomainError('conflict', `${user.name} est déjà habilité(e) sur ${equipment.code}.`);

    const row = await this.prisma.habilitation.create({
      data: { userId, equipmentId, grantedBy: manager.username },
      include: { equipment: true },
    });
    return toView(row);
  }

  /** Retirer une habilitation n'annule pas les réservations déjà faites : Claire décide au cas par cas. */
  async revoke(id: string): Promise<void> {
    const deleted = await this.prisma.habilitation.deleteMany({ where: { id } });
    if (deleted.count === 0) throw new DomainError('not-found', 'Habilitation introuvable.');
  }
}

function toView(row: Habilitation & { equipment: Equipment }): HabilitationView {
  return {
    id: row.id,
    userId: row.userId,
    equipment: { id: row.equipment.id, code: row.equipment.code, name: row.equipment.name },
    grantedBy: row.grantedBy,
    grantedAt: row.grantedAt,
  };
}
