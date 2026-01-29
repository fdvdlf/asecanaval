import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CLASSROOM_MIME_TYPES, ensureUploadsDir, getMaxUploadBytes } from '../uploads/upload.utils';
import { ClassroomService } from './classroom.service';
import { AdminCourseDetailDto, AdminCourseListResponseDto } from './dto/admin-course.dto';
import { AdminClassroomSummaryDto } from './dto/admin-classroom-summary.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateEnrollmentDto, EnrollmentListResponseDto } from './dto/enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@ApiTags('admin/classroom')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.GERENCIA)
@Controller('admin/classroom')
export class AdminClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Get('courses')
  @ApiOkResponse({ type: AdminCourseListResponseDto })
  listCourses() {
    return this.classroomService.listAdminCourses();
  }

  @Get('summary')
  @ApiOkResponse({ type: AdminClassroomSummaryDto })
  summary() {
    return this.classroomService.getSummary();
  }

  @Get('courses/:id')
  @ApiOkResponse({ type: AdminCourseDetailDto })
  getCourse(@Param('id', ParseIntPipe) id: number) {
    return this.classroomService.getAdminCourse(id);
  }

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.classroomService.createCourse(dto);
  }

  @Patch('courses/:id')
  updateCourse(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) {
    return this.classroomService.updateCourse(id, dto);
  }

  @Post('courses/:id/modules')
  createModule(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateModuleDto) {
    return this.classroomService.createModule(id, dto);
  }

  @Patch('modules/:id')
  updateModule(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateModuleDto) {
    return this.classroomService.updateModule(id, dto);
  }

  @Post('modules/:id/materials')
  createMaterial(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateMaterialDto) {
    return this.classroomService.createMaterial(id, dto);
  }

  @Patch('materials/:id')
  updateMaterial(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMaterialDto) {
    return this.classroomService.updateMaterial(id, dto);
  }

  @Get('courses/:id/enrollments')
  @ApiOkResponse({ type: EnrollmentListResponseDto })
  listEnrollments(@Param('id', ParseIntPipe) id: number) {
    return this.classroomService.listEnrollments(id);
  }

  @Post('courses/:id/enrollments')
  addEnrollment(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateEnrollmentDto) {
    return this.classroomService.addEnrollment(id, dto.dni);
  }

  @Patch('enrollments/:id')
  updateEnrollment(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEnrollmentDto) {
    return this.classroomService.updateEnrollmentStatus(id, dto.status);
  }

  @Post('modules/:id/materials/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        type: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, ensureUploadsDir());
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `classroom-${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!CLASSROOM_MIME_TYPES.has(file.mimetype)) {
          return cb(new BadRequestException('Tipo de archivo no permitido'), false);
        }
        return cb(null, true);
      },
      limits: { fileSize: getMaxUploadBytes() },
    }),
  )
  uploadMaterial(
    @Req() _req: Request,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; type?: string },
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const title = body?.title?.trim() || file.originalname;
    const type = body?.type?.trim() || deriveMaterialType(file.mimetype);
    const url = `/uploads/${file.filename}`;
    return this.classroomService.createMaterial(id, { title, file_url: url, type });
  }
}

function deriveMaterialType(mime: string) {
  if (mime === 'application/pdf') return 'PDF';
  if (mime.startsWith('video/')) return 'VIDEO';
  if (mime.startsWith('image/')) return 'IMAGEN';
  if (mime.includes('presentation')) return 'PPT';
  if (mime.includes('word')) return 'DOC';
  return 'ARCHIVO';
}
