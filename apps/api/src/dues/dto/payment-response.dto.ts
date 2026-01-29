import { ApiProperty } from '@nestjs/swagger';

export class PaymentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  due_id: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  paid_at: Date;

  @ApiProperty()
  method: string;

  @ApiProperty()
  reference: string;

  @ApiProperty({ nullable: true })
  voucher_url?: string | null;

  @ApiProperty()
  created_by_user_id: number;

  @ApiProperty({ nullable: true })
  validated_by_user_id?: number | null;

  @ApiProperty({ nullable: true })
  validated_at?: Date | null;
}
