import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ClassroomService } from './classroom.service';
import { MaterialsListResponseDto } from './dto/material.dto';

@ApiTags('modules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ASOCIADO)
@Controller('modules')
export class ModulesController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Get(':id/materials')
  @ApiOkResponse({ type: MaterialsListResponseDto })
  listMaterials(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const user = req.user as { dni: string };
    return this.classroomService.listMaterials(user.dni, id);
  }
}
