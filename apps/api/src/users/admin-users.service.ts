import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminUsersQueryDto) {
    const search = query.search?.trim();
    let memberDnis: string[] = [];

    if (search) {
      const members = await this.prisma.member.findMany({
        where: {
          OR: [
            { dni: { contains: search, mode: 'insensitive' } },
            { cip: { contains: search, mode: 'insensitive' } },
            { nombres: { contains: search, mode: 'insensitive' } },
            { apellidos: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { dni: true },
      });
      memberDnis = members.map((member) => member.dni);
    }

    const where: Prisma.UserWhereInput = {};
    if (query.role) {
      where.role = query.role;
    }
    if (search) {
      const or: Prisma.UserWhereInput[] = [
        { dni: { contains: search, mode: 'insensitive' } },
      ];
      if (memberDnis.length > 0) {
        or.push({ dni: { in: memberDnis } });
      }
      where.OR = or;
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const memberMap = new Map(
      (
        await this.prisma.member.findMany({
          where: { dni: { in: users.map((user) => user.dni) } },
        })
      ).map((member) => [member.dni, member]),
    );

    return {
      data: users.map((user) => {
        const member = memberMap.get(user.dni);
        return {
          id: user.id,
          dni: user.dni,
          role: user.role,
          nombres: member?.nombres ?? '',
          apellidos: member?.apellidos ?? '',
          email: member?.email ?? null,
        };
      }),
    };
  }

  async updateRole(id: number, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role as Role },
    });

    const member = await this.prisma.member.findUnique({
      where: { dni: updated.dni },
    });

    return {
      id: updated.id,
      dni: updated.dni,
      role: updated.role,
      nombres: member?.nombres ?? '',
      apellidos: member?.apellidos ?? '',
      email: member?.email ?? null,
    };
  }

  async create(dto: CreateAdminUserDto) {
    const member = await this.prisma.member.findUnique({ where: { dni: dto.dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const passwordHash = await bcrypt.hash(dto.dni, 10);
    const user = await this.prisma.user.upsert({
      where: { dni: dto.dni },
      update: { role: dto.role as Role },
      create: {
        dni: dto.dni,
        passwordHash,
        role: dto.role as Role,
      },
    });

    return {
      id: user.id,
      dni: user.dni,
      role: user.role,
      nombres: member.nombres,
      apellidos: member.apellidos,
      email: member.email ?? null,
    };
  }
}
