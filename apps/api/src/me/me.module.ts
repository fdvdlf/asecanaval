import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  controllers: [MeController],
  providers: [MeService, RolesGuard],
})
export class MeModule {}
