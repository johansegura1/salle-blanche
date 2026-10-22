import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { ZONES, type Zone } from '../equipment.js';

export class ListEquipmentsQuery {
  @ApiPropertyOptional({ enum: ZONES })
  @IsOptional()
  @IsIn(ZONES)
  zone?: Zone;
}
