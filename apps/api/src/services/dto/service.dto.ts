import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional({ nullable: true })
  requirements?: string | null;

  @ApiPropertyOptional({ nullable: true })
  schedule?: string | null;

  @ApiPropertyOptional({ nullable: true })
  phones?: string | null;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;
}

export class ServicesListResponseDto {
  @ApiProperty({ type: [ServiceDto] })
  data: ServiceDto[];
}
