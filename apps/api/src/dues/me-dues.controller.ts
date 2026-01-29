import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DuesService } from './dues.service';
import { MeDuesQueryDto } from './dto/me-dues-query.dto';
import { MeDuesListResponseDto, MeDuesSummaryDto } from './dto/me-dues-response.dto';
import { CreateMePaymentDto } from './dto/me-payment.dto';
import { PaymentDto } from './dto/payment-response.dto';
import { ALLOWED_MIME_TYPES, ensureUploadsDir, getMaxUploadBytes } from '../uploads/upload.utils';

@ApiTags('me/dues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ASOCIADO)
@Controller('me')
export class MeDuesController {
  constructor(private readonly duesService: DuesService) {}

  @Get('dues')
  @ApiOkResponse({ type: MeDuesListResponseDto })
  list(@Req() req: Request, @Query() query: MeDuesQueryDto) {
    const user = req.user as { dni: string };
    return this.duesService.listMemberDues(user.dni, query);
  }

  @Get('dues/summary')
  @ApiOkResponse({ type: MeDuesSummaryDto })
  summary(@Req() req: Request) {
    const user = req.user as { dni: string };
    return this.duesService.getMemberSummary(user.dni);
  }

  @Post('payments')
  @ApiOkResponse({ type: PaymentDto })
  createPayment(@Req() req: Request, @Body() dto: CreateMePaymentDto) {
    const user = req.user as { dni: string; userId: number };
    return this.duesService.createMemberPayment(user.dni, user.userId, dto);
  }

  @Post('payments/:paymentId/voucher')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: PaymentDto })
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
  uploadVoucher(
    @Req() req: Request,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }
    const user = req.user as { dni: string; userId: number };
    const url = `/uploads/${file.filename}`;
    return this.duesService.attachVoucher(user.dni, user.userId, paymentId, {
      url,
      mime: file.mimetype,
      size: file.size,
    });
  }
}
