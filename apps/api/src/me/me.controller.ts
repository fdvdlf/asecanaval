import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MemberDto } from '../members/dto/member-response.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { MeService } from './me.service';

@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ASOCIADO)
@Controller()
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('me')
  @ApiOkResponse({ type: MemberDto })
  getProfile(@Req() req: Request) {
    const user = req.user as { dni: string };
    return this.meService.getProfile(user.dni);
  }

  @Patch('me/contact')
  @ApiOkResponse({ type: MemberDto })
  updateContact(@Req() req: Request, @Body() dto: UpdateContactDto) {
    const user = req.user as { dni: string };
    return this.meService.updateContact(user.dni, dto);
  }
}
