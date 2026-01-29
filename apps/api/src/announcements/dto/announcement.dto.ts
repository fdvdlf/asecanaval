import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnnouncementSegmentType } from '@prisma/client';

export class AnnouncementDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty({ enum: AnnouncementSegmentType })
  segment_type: AnnouncementSegmentType;

  @ApiPropertyOptional({ nullable: true })
  segment_value?: string | null;

  @ApiProperty()
  created_at: Date;
}

export class AnnouncementsListResponseDto {
  @ApiProperty({ type: [AnnouncementDto] })
  data: AnnouncementDto[];
}
