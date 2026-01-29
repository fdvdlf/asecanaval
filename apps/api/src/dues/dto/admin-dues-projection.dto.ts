import { ApiProperty } from '@nestjs/swagger';

export class AdminDuesProjectionMonthDto {
  @ApiProperty()
  month: number;

  @ApiProperty()
  expected: number;

  @ApiProperty()
  paid: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  waived: number;
}

export class AdminDuesProjectionTotalsDto {
  @ApiProperty()
  expected: number;

  @ApiProperty()
  paid: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  waived: number;
}

export class AdminDuesProjectionResponseDto {
  @ApiProperty()
  year: number;

  @ApiProperty({ type: [AdminDuesProjectionMonthDto] })
  months: AdminDuesProjectionMonthDto[];

  @ApiProperty({ type: AdminDuesProjectionTotalsDto })
  totals: AdminDuesProjectionTotalsDto;
}
