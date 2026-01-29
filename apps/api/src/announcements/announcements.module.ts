import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAnnouncementsController } from './admin-announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { MeAnnouncementsController } from './me-announcements.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminAnnouncementsController, MeAnnouncementsController],
  providers: [AnnouncementsService, RolesGuard],
})
export class AnnouncementsModule {}
