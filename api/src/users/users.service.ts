import { Injectable } from '@nestjs/common';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PublicUser, Role } from './user.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pour la connexion : avec le hash, à ne jamais renvoyer au client. */
  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.prisma.user.findMany({ orderBy: { name: 'asc' } });
    return users.map(toPublicUser);
  }
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, username: user.username, name: user.name, role: user.role as Role };
}
