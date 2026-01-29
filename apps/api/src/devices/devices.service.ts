import { Injectable } from '@nestjs/common';
import { DevicePlatform } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async registerToken(userId: number, dto: RegisterDeviceTokenDto) {
    const now = new Date();
    const existing = await this.prisma.deviceToken.findUnique({
      where: {
        platform_token: {
          platform: dto.platform,
          token: dto.token,
        },
      },
    });

    if (existing) {
      return this.prisma.deviceToken.update({
        where: { id: existing.id },
        data: {
          user_id: userId,
          last_seen_at: now,
        },
      });
    }

    return this.prisma.deviceToken.create({
      data: {
        user_id: userId,
        platform: dto.platform as DevicePlatform,
        token: dto.token,
        last_seen_at: now,
      },
    });
  }

  async listTokens() {
    const tokens = await this.prisma.deviceToken.findMany({
      orderBy: { last_seen_at: 'desc' },
      include: { user: true },
    });

    return {
      data: tokens.map((token) => ({
        id: token.id,
        user_id: token.user_id,
        user_dni: token.user.dni,
        role: token.user.role,
        platform: token.platform,
        token: token.token,
        created_at: token.created_at,
        last_seen_at: token.last_seen_at,
      })),
    };
  }
}
