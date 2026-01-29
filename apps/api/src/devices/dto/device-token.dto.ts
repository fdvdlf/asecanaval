import { ApiProperty } from '@nestjs/swagger';
import { DevicePlatform, Role } from '@prisma/client';

export class DeviceTokenDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  user_id: number;

  @ApiProperty()
  user_dni: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ enum: DevicePlatform })
  platform: DevicePlatform;

  @ApiProperty()
  token: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  last_seen_at: Date;
}

export class DeviceTokensListResponseDto {
  @ApiProperty({ type: [DeviceTokenDto] })
  data: DeviceTokenDto[];
}
