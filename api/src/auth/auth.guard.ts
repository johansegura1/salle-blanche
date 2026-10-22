import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '../users/user.js';

/** Ce que porte le token. `sub` est l'id de l'utilisateur : c'est la convention JWT. */
export interface JwtPayload {
  sub: string;
  username: string;
  name: string;
  role: Role;
}

/** La requête, une fois le guard passé : `user` vient du token. */
export interface AuthenticatedRequest {
  headers: { authorization?: string };
  user?: JwtPayload;
}

/**
 * S'exécute avant la route : lit le token Bearer, le vérifie, et range son
 * contenu dans `request.user`. Pas de token, ou un mauvais : 401.
 * (Le TP affichait le token avec console.log : retiré, un token dans les
 * logs, c'est une session volée pour quiconque lit les logs.)
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    try {
      request.user = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true;
  }
}

function extractBearerToken(header: string | undefined): string | undefined {
  const [scheme, token] = header?.split(' ') ?? [];
  return scheme === 'Bearer' ? token : undefined;
}
