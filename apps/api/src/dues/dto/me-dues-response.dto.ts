import { ApiProperty } from '@nestjs/swagger';
import { DueStatus } from '@prisma/client';

export class MeDueDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  year: number;

  @ApiProperty()
  month: number;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: DueStatus })
  status: DueStatus;

  @ApiProperty()
  due_date: Date;
}

export class MeDuesListResponseDto {
  @ApiProperty({ type: [MeDueDto] })
  data: MeDueDto[];
}

export class MeDuesSummaryDto {
  @ApiProperty({ enum: ['AL_DIA', 'MOROSO'] })
  status: 'AL_DIA' | 'MOROSO';

  @ApiProperty()
  nextDueDate: Date;

  @ApiProperty()
  pendingCount: number;

  @ApiProperty({ nullable: true })
  lastPaymentAt: Date | null;
}
