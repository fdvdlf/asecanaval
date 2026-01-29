import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ALLOWED_MIME_TYPES, ensureUploadsDir, getMaxUploadBytes } from '../uploads/upload.utils';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { AttachmentDto } from './dto/attachment.dto';
import { ServiceRequestsListResponseDto, ServiceRequestDto } from './dto/service-request.dto';
import { ServiceRequestsService } from './service-requests.service';

@ApiTags('service-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ASOCIADO)
@Controller()
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post('service-requests')
  @ApiOkResponse({ type: ServiceRequestDto })
  create(@Req() req: Request, @Body() dto: CreateServiceRequestDto) {
    const user = req.user as { dni: string; userId: number };
    return this.serviceRequestsService.createRequest(user.dni, user.userId, dto);
  }

  @Get('me/service-requests')
  @ApiOkResponse({ type: ServiceRequestsListResponseDto })
  listMine(@Req() req: Request) {
    const user = req.user as { dni: string };
    return this.serviceRequestsService.listMemberRequests(user.dni);
  }

  @Post('me/service-requests/:id/attachments')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: AttachmentDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, ensureUploadsDir());
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          return cb(new BadRequestException('Tipo de archivo no permitido'), false);
        }
        return cb(null, true);
      },
      limits: { fileSize: getMaxUploadBytes() },
    }),
  )
  uploadAttachment(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    const user = req.user as { dni: string; userId: number };
    const url = `/uploads/${file.filename}`;
    return this.serviceRequestsService.addAttachment(user.dni, user.userId, id, {
      url,
      mime: file.mimetype,
      size: file.size,
    });
  }
}
