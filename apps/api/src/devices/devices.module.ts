import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminDevicesController } from './admin-devices.controller';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  imports: [PrismaModule],
  controllers: [DevicesController, AdminDevicesController],
  providers: [DevicesService, RolesGuard],
})
export class DevicesModule {}
