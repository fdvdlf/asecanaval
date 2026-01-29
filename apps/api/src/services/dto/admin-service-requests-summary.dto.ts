import { ApiProperty } from '@nestjs/swagger';

export class AdminServiceRequestsSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  pending: number;
}
