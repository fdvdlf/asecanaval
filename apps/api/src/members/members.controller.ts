import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberDto, MembersListResponseDto } from './dto/member-response.dto';
import { MembersQueryDto } from './dto/members-query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersSummaryDto } from './dto/members-summary.dto';
import { MembersService } from './members.service';

@ApiTags('admin/members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOkResponse({ type: MembersListResponseDto })
  list(@Query() query: MembersQueryDto) {
    return this.membersService.list(query);
  }

  @Get('export')
  @ApiOkResponse({ description: 'CSV export' })
  async export(@Query() query: MembersQueryDto, @Res({ passthrough: true }) res: Response) {
    const csv = await this.membersService.exportCsv(query);
    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="padron_${timestamp}.csv"`);
    return csv;
  }

  @Get('summary')
  @ApiOkResponse({ type: MembersSummaryDto })
  summary() {
    return this.membersService.getSummary();
  }

  @Get(':id')
  @ApiOkResponse({ type: MemberDto })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.getById(id);
  }

  @Post()
  @ApiOkResponse({ type: MemberDto })
  create(@Body() dto: CreateMemberDto) {
    return this.membersService.create(dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: MemberDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMemberDto) {
    return this.membersService.update(id, dto);
  }
}
