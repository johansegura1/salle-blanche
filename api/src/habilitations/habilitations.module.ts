import { Module } from '@nestjs/common';
import { HabilitationsController } from './habilitations.controller.js';
import { HabilitationsService } from './habilitations.service.js';

@Module({
  controllers: [HabilitationsController],
  providers: [HabilitationsService],
})
export class HabilitationsModule {}
