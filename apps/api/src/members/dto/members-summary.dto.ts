import { ApiProperty } from '@nestjs/swagger';

export class MembersSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  activos: number;

  @ApiProperty()
  morosos: number;

  @ApiProperty()
  inactivos: number;
}
