import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AnnouncementSegmentType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateAnnouncementDto) {
    const segmentType = dto.segmentType;
    const segmentValue = dto.segmentValue?.trim() || null;

    if (segmentType !== AnnouncementSegmentType.ALL && !segmentValue) {
      throw new BadRequestException('segmentValue es requerido');
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        title: dto.title.trim(),
        body: dto.body.trim(),
        segment_type: segmentType,
        segment_value: segmentType === AnnouncementSegmentType.ALL ? null : segmentValue,
        created_by_user_id: userId,
      },
    });

    return {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      segment_type: announcement.segment_type,
      segment_value: announcement.segment_value,
      created_at: announcement.created_at,
    };
  }

  async listAdmin() {
    const announcements = await this.prisma.announcement.findMany({
      orderBy: { created_at: 'desc' },
    });

    return {
      data: announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        segment_type: announcement.segment_type,
        segment_value: announcement.segment_value,
        created_at: announcement.created_at,
      })),
    };
  }

  async listMember(dni: string) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const conditions: Prisma.AnnouncementWhereInput[] = [
      { segment_type: AnnouncementSegmentType.ALL },
      { segment_type: AnnouncementSegmentType.PROMOCION, segment_value: member.promocion },
      { segment_type: AnnouncementSegmentType.ESTADO, segment_value: member.estado },
    ];

    if (member.distrito) {
      conditions.push({ segment_type: AnnouncementSegmentType.REGION, segment_value: member.distrito });
    }

    const announcements = await this.prisma.announcement.findMany({
      where: { OR: conditions },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        segment_type: announcement.segment_type,
        segment_value: announcement.segment_value,
        created_at: announcement.created_at,
      })),
    };
  }
}
