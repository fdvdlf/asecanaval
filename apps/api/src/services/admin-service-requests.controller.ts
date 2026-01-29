import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminServiceRequestsQueryDto } from './dto/admin-service-requests-query.dto';
import { AdminServiceRequestsSummaryDto } from './dto/admin-service-requests-summary.dto';
import { AdminServiceRequestsListResponseDto, ServiceRequestDto } from './dto/service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { ServiceRequestsService } from './service-requests.service';

@ApiTags('admin/service-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.GERENCIA, Role.SERVICIOS)
@Controller('admin/service-requests')
export class AdminServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Get()
  @ApiOkResponse({ type: AdminServiceRequestsListResponseDto })
  list(@Query() query: AdminServiceRequestsQueryDto) {
    return this.serviceRequestsService.listAdminRequests(query);
  }

  @Get('summary')
  @ApiOkResponse({ type: AdminServiceRequestsSummaryDto })
  summary() {
    return this.serviceRequestsService.getSummary();
  }

  @Patch(':id/status')
  @ApiOkResponse({ type: ServiceRequestDto })
  updateStatus(@Req() req: Request, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceRequestStatusDto) {
    const user = req.user as { userId: number };
    return this.serviceRequestsService.updateStatus(user.userId, id, dto);
  }
}
