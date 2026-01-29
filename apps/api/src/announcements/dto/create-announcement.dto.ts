import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnnouncementSegmentType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ enum: AnnouncementSegmentType })
  @IsEnum(AnnouncementSegmentType)
  segmentType: AnnouncementSegmentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  segmentValue?: string;
}
