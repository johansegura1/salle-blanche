import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMaintenanceDto {
  @ApiProperty({ example: '2026-10-26T07:00:00.000Z' })
  @IsISO8601({ strict: true })
  start!: string;

  @ApiProperty({ example: '2026-10-28T19:00:00.000Z' })
  @IsISO8601({ strict: true })
  end!: string;

  @ApiProperty({ example: 'Changement de la pompe à vide' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reason!: string;
}
