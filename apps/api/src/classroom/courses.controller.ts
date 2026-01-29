import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ClassroomService } from './classroom.service';
import { CourseDetailDto } from './dto/course.dto';

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ASOCIADO)
@Controller('courses')
export class CoursesController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Get(':id')
  @ApiOkResponse({ type: CourseDetailDto })
  get(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as { dni: string };
    return this.classroomService.getCourseDetails(user.dni, id);
  }
}
