import { ApiProperty } from '@nestjs/swagger';

export class AdminMaterialDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  file_url: string;

  @ApiProperty()
  type: string;
}

export class AdminModuleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ type: [AdminMaterialDto] })
  materials: AdminMaterialDto[];
}

export class AdminCourseDto {
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
}

export class AdminCourseListResponseDto {
  @ApiProperty({ type: [AdminCourseDto] })
  data: AdminCourseDto[];
}

export class AdminCourseDetailDto {
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

  @ApiProperty({ type: [AdminModuleDto] })
  modules: AdminModuleDto[];
}
