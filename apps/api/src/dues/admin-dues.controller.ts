import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DuesService } from './dues.service';
import { AdminDuesQueryDto } from './dto/admin-dues-query.dto';
import { AdminDuesProjectionQueryDto } from './dto/admin-dues-projection-query.dto';
import { AdminDuesProjectionResponseDto } from './dto/admin-dues-projection.dto';
import { AdminDuesListResponseDto } from './dto/admin-dues-response.dto';
import { AdminPaymentDto } from './dto/admin-payment.dto';
import { PaymentDto } from './dto/payment-response.dto';

@ApiTags('admin/dues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminDuesController {
  constructor(private readonly duesService: DuesService) {}

  @Get('dues')
  @Roles(Role.ADMIN, Role.TESORERIA)
  @ApiOkResponse({ type: AdminDuesListResponseDto })
  list(@Query() query: AdminDuesQueryDto) {
    return this.duesService.listAdminDues(query);
  }

  @Get('dues/projection')
  @Roles(Role.ADMIN, Role.TESORERIA, Role.GERENCIA)
  @ApiOkResponse({ type: AdminDuesProjectionResponseDto })
  projection(@Query() query: AdminDuesProjectionQueryDto) {
    return this.duesService.getAdminProjection(query.year);
  }

  @Post('payments')
  @Roles(Role.TESORERIA)
  @ApiOkResponse({ type: PaymentDto })
  createPayment(@Req() req: Request, @Body() dto: AdminPaymentDto) {
    const user = req.user as { userId: number };
    return this.duesService.createAdminPayment(user.userId, dto);
  }

  @Get('payments/:id')
  @Roles(Role.TESORERIA)
  @ApiOkResponse({ type: PaymentDto })
  getPayment(@Param('id', ParseIntPipe) id: number) {
    return this.duesService.getPaymentAdmin(id);
  }

  @Patch('payments/:id/validate')
  @Roles(Role.TESORERIA)
  @ApiOkResponse({ type: PaymentDto })
  validate(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as { userId: number };
    return this.duesService.validatePayment(user.userId, id);
  }
}
