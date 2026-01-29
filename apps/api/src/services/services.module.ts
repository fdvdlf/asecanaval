import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { AdminServiceRequestsController } from './admin-service-requests.controller';
import { ServiceRequestsController } from './service-requests.controller';
import { ServicesController } from './services.controller';
import { ServiceRequestsService } from './service-requests.service';
import { ServicesService } from './services.service';

@Module({
  controllers: [ServicesController, ServiceRequestsController, AdminServiceRequestsController],
  providers: [ServicesService, ServiceRequestsService, RolesGuard],
})
export class ServicesModule {}
