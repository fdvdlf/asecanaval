import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { dni: dto.dni } });
    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const mustChangePassword = await bcrypt.compare(user.dni, user.passwordHash);
    const tokens = await this.issueTokens(user.id, user.dni, user.role);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      mustChangePassword,
      user: { id: user.id, dni: user.dni, role: user.role },
    };
  }

  async refresh(dto: RefreshDto) {
    let payload: { sub: number; dni: string; role: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalido');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('Acceso denegado');
    }

    const match = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!match) {
      throw new ForbiddenException('Acceso denegado');
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, dni: user.dni, role: user.role },
      { secret: this.getAccessSecret(), expiresIn: ACCESS_EXPIRES_IN },
    );

    return { accessToken };
  }

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { success: true };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isDefaultPassword = await bcrypt.compare(user.dni, user.passwordHash);
    if (!isDefaultPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Clave actual requerida');
      }
      const currentOk = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!currentOk) {
        throw new UnauthorizedException('Clave actual invalida');
      }
    } else if (dto.currentPassword) {
      const currentOk = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!currentOk) {
        throw new UnauthorizedException('Clave actual invalida');
      }
    }

    if (dto.newPassword === user.dni) {
      throw new BadRequestException('La nueva clave debe ser distinta al DNI');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  }

  private async issueTokens(userId: number, dni: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, dni, role },
        { secret: this.getAccessSecret(), expiresIn: ACCESS_EXPIRES_IN },
      ),
      this.jwtService.signAsync(
        { sub: userId, dni, role },
        { secret: this.getRefreshSecret(), expiresIn: REFRESH_EXPIRES_IN },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private getAccessSecret() {
    return process.env.JWT_ACCESS_SECRET || 'change-me-access';
  }

  private getRefreshSecret() {
    return process.env.JWT_REFRESH_SECRET || 'change-me-refresh';
  }
}
