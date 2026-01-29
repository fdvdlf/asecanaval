import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DevicesService } from './devices.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { DeviceTokenDto } from './dto/device-token.dto';

@ApiTags('devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ASOCIADO, Role.ADMIN)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register-token')
  @ApiOkResponse({ type: DeviceTokenDto })
  register(@Req() req: Request, @Body() dto: RegisterDeviceTokenDto) {
    const user = req.user as { userId: number };
    return this.devicesService.registerToken(user.userId, dto);
  }
}
