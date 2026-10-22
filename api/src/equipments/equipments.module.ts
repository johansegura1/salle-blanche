import { Module } from '@nestjs/common';
import { EquipmentsController } from './equipments.controller.js';
import { EquipmentsService } from './equipments.service.js';

@Module({
  controllers: [EquipmentsController],
  providers: [EquipmentsService],
})
export class EquipmentsModule {}
