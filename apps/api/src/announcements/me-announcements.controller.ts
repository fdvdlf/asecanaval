import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsListResponseDto } from './dto/announcement.dto';

@ApiTags('me/announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ASOCIADO)
@Controller('me/announcements')
export class MeAnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOkResponse({ type: AnnouncementsListResponseDto })
  list(@Req() req: Request) {
    const user = req.user as { dni: string };
    return this.announcementsService.listMember(user.dni);
  }
}
