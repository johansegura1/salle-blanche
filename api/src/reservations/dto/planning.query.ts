import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601 } from 'class-validator';

/** La fenêtre du planning : en général, une semaine. */
export class PlanningQuery {
  @ApiProperty({ example: '2026-10-26T00:00:00.000Z' })
  @IsISO8601({ strict: true })
  from!: string;

  @ApiProperty({ example: '2026-10-31T00:00:00.000Z' })
  @IsISO8601({ strict: true })
  to!: string;
}
