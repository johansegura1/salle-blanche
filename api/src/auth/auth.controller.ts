import { Body, Controller, Get, HttpCode, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Role } from '../users/user.js';
import { UsersService } from '../users/users.service.js';
import { AuthGuard, type JwtPayload } from './auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';
import { AccessTokenDto } from './dto/access-token.dto.js';
import { JwtPayloadDto } from './dto/jwt-payload.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { verifyPassword } from './password.js';

/**
 *   POST /auth/login   { username, password }  →  { access_token }, ou 401
 *   GET  /auth/whoami  avec un token Bearer      →  le contenu du token, ou 401
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: AccessTokenDto })
  @ApiUnauthorizedResponse({ description: 'Wrong username or password' })
  async login(@Body() dto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.users.findByUsername(dto.username);
    // Le même message pour un identifiant inconnu et un mauvais mot de passe :
    // on ne dit pas à un attaquant quels comptes existent.
    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Wrong username or password');
    }

    const payload: JwtPayload = { sub: user.id, username: user.username, name: user.name, role: user.role as Role };
    return { access_token: await this.jwt.signAsync(payload) };
  }

  @Get('whoami')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: JwtPayloadDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  whoami(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }
}
