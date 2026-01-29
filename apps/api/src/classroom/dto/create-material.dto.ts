import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  file_url: string;

  @ApiProperty({ description: 'Ej: PDF, VIDEO, LINK' })
  @IsString()
  type: string;
}
