import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET is not set: cp .env.example .env');

/**
 * Signe et vérifie les tokens avec le secret du `.env`.
 * `global: true` rend JwtService injectable partout : AuthGuard marche dans
 * tous les modules. Un token vit 8 h : une journée de salle blanche.
 */
@Module({
  imports: [UsersModule, JwtModule.register({ global: true, secret, signOptions: { expiresIn: '8h' } })],
  controllers: [AuthController],
  providers: [AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard],
})
export class AuthModule {}
