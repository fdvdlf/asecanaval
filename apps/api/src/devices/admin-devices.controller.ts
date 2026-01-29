import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DevicesService } from './devices.service';
import { DeviceTokensListResponseDto } from './dto/device-token.dto';

@ApiTags('admin/device-tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/device-tokens')
export class AdminDevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOkResponse({ type: DeviceTokensListResponseDto })
  list() {
    return this.devicesService.listTokens();
  }
}
