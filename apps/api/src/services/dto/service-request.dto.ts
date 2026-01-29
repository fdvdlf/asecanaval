import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceRequestStatus } from '@prisma/client';

export class ServiceRequestDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  serviceId: number;

  @ApiProperty()
  serviceName: string;

  @ApiProperty({ enum: ServiceRequestStatus })
  status: ServiceRequestStatus;

  @ApiProperty()
  requested_at: Date;

  @ApiPropertyOptional({ nullable: true })
  scheduled_at?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  notes_member?: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes_admin?: string | null;
}

export class ServiceRequestsListResponseDto {
  @ApiProperty({ type: [ServiceRequestDto] })
  data: ServiceRequestDto[];
}

export class AdminServiceRequestDto extends ServiceRequestDto {
  @ApiProperty()
  memberId: number;

  @ApiProperty()
  dni: string;

  @ApiProperty()
  nombre: string;
}

export class AdminServiceRequestsListResponseDto {
  @ApiProperty({ type: [AdminServiceRequestDto] })
  data: AdminServiceRequestDto[];
}
