import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AdminDuesProjectionQueryDto {
  @ApiPropertyOptional({ description: 'Año de proyección', default: new Date().getFullYear() })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;
}
