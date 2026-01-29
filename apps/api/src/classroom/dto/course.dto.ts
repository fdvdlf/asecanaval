import { ApiProperty } from '@nestjs/swagger';
import { ModuleDto } from './module.dto';

export class CourseSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  instructor: string;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  image_url: string;

  @ApiProperty()
  progress: number;
}

export class CourseSummaryListResponseDto {
  @ApiProperty({ type: [CourseSummaryDto] })
  data: CourseSummaryDto[];
}

export class CourseDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  instructor: string;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  image_url: string;

  @ApiProperty({ type: [ModuleDto] })
  modules: ModuleDto[];
}

export class CourseCatalogDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  instructor: string;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  image_url: string;

  @ApiProperty()
  module_count: number;

  @ApiProperty()
  enrolled: boolean;

  @ApiProperty({ nullable: true })
  enrollment_status?: string | null;
}

export class CourseCatalogListResponseDto {
  @ApiProperty({ type: [CourseCatalogDto] })
  data: CourseCatalogDto[];
}

export class CourseEnrollmentResponseDto {
  @ApiProperty()
  course_id: number;

  @ApiProperty()
  enrolled: boolean;

  @ApiProperty()
  status: string;
}
