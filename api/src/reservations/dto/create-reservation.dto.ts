import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Pas de userId ici : la réservation est toujours au nom de l'utilisateur du token. */
export class CreateReservationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  equipmentId!: string;

  @ApiProperty({ example: '2026-10-26T07:00:00.000Z' })
  @IsISO8601({ strict: true })
  start!: string;

  @ApiProperty({ example: '2026-10-26T09:00:00.000Z' })
  @IsISO8601({ strict: true })
  end!: string;

  @ApiPropertyOptional({ example: "Pour l'entreprise Microsens" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
