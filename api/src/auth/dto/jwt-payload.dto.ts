import { ApiProperty } from '@nestjs/swagger';
import type { Role } from '../../users/user.js';
import type { JwtPayload } from '../auth.guard.js';

/** Ce que porte le token, tel que GET /auth/whoami le renvoie. */
export class JwtPayloadDto implements JwtPayload {
  @ApiProperty({ description: 'User id' })
  sub!: string;

  @ApiProperty({ example: 'claire' })
  username!: string;

  @ApiProperty({ example: 'Claire Martin' })
  name!: string;

  @ApiProperty({ enum: ['manager', 'user'], example: 'manager' })
  role!: Role;
}
