import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { ClassroomService } from './classroom.service';
import { AdminClassroomController } from './admin-classroom.controller';
import { CoursesController } from './courses.controller';
import { MeCoursesController } from './me-courses.controller';
import { ModulesController } from './modules.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MeCoursesController, CoursesController, ModulesController, AdminClassroomController],
  providers: [ClassroomService, RolesGuard],
})
export class ClassroomModule {}
