import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AdminPaymentDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  due_id: number;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty()
  @IsString()
  method: string;

  @ApiProperty()
  @IsString()
  reference: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  voucher_url?: string | null;
}
