import { Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ClassroomService } from './classroom.service';
import { CourseCatalogListResponseDto, CourseEnrollmentResponseDto, CourseSummaryListResponseDto } from './dto/course.dto';
import { ModuleProgressDto } from './dto/module.dto';

@ApiTags('me/courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ASOCIADO)
@Controller('me')
export class MeCoursesController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Get('courses')
  @ApiOkResponse({ type: CourseSummaryListResponseDto })
  list(@Req() req: Request) {
    const user = req.user as { dni: string };
    return this.classroomService.listMemberCourses(user.dni);
  }

  @Get('courses/catalog')
  @ApiOkResponse({ type: CourseCatalogListResponseDto })
  listCatalog(@Req() req: Request) {
    const user = req.user as { dni: string };
    return this.classroomService.listCatalogCourses(user.dni);
  }

  @Post('courses/:id/enroll')
  @ApiOkResponse({ type: CourseEnrollmentResponseDto })
  requestEnrollment(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as { dni: string };
    return this.classroomService.requestEnrollment(user.dni, id);
  }

  @Post('modules/:id/complete')
  @ApiOkResponse({ type: ModuleProgressDto })
  complete(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as { dni: string };
    return this.classroomService.completeModule(user.dni, id);
  }
}
