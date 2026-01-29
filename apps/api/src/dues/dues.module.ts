import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { AdminDuesController } from './admin-dues.controller';
import { DuesService } from './dues.service';
import { MeDuesController } from './me-dues.controller';

@Module({
  controllers: [MeDuesController, AdminDuesController],
  providers: [DuesService, RolesGuard],
})
export class DuesModule {}
