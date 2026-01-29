import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementDto, AnnouncementsListResponseDto } from './dto/announcement.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@ApiTags('admin/announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.GERENCIA)
@Controller('admin/announcements')
export class AdminAnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @ApiOkResponse({ type: AnnouncementDto })
  create(@Req() req: Request, @Body() dto: CreateAnnouncementDto) {
    const user = req.user as { userId: number };
    return this.announcementsService.create(user.userId, dto);
  }

  @Get()
  @ApiOkResponse({ type: AnnouncementsListResponseDto })
  list() {
    return this.announcementsService.listAdmin();
  }
}
