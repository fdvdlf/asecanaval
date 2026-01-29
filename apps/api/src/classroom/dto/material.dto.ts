import { ApiProperty } from '@nestjs/swagger';

export class MaterialDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  file_url: string;

  @ApiProperty()
  type: string;
}

export class MaterialsListResponseDto {
  @ApiProperty({ type: [MaterialDto] })
  data: MaterialDto[];
}
