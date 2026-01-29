import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { MembersQueryDto } from './dto/members-query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: MembersQueryDto) {
    const andFilters: Prisma.MemberWhereInput[] = [];

    if (query.nombre) {
      andFilters.push({
        OR: [
          { nombres: { contains: query.nombre, mode: 'insensitive' } },
          { apellidos: { contains: query.nombre, mode: 'insensitive' } },
        ],
      });
    }

    if (query.identidad) {
      andFilters.push({
        OR: [
          { dni: { contains: query.identidad } },
          { cip: { contains: query.identidad } },
        ],
      });
    }

    if (query.promo) {
      andFilters.push({ promocion: { contains: query.promo } });
    }

    if (query.estado) {
      andFilters.push({ estado: query.estado });
    }

    if (query.distrito) {
      andFilters.push({ distrito: { contains: query.distrito, mode: 'insensitive' } });
    }

    if (query.grado) {
      andFilters.push({ grado: { contains: query.grado, mode: 'insensitive' } });
    }

    if (query.situacion) {
      andFilters.push({ situacion: { contains: query.situacion, mode: 'insensitive' } });
    }

    if (query.especialidad) {
      andFilters.push({ especialidad: { contains: query.especialidad, mode: 'insensitive' } });
    }

    if (query.search) {
      andFilters.push({
        OR: [
          { nombres: { contains: query.search, mode: 'insensitive' } },
          { apellidos: { contains: query.search, mode: 'insensitive' } },
          { dni: { contains: query.search } },
          { cip: { contains: query.search } },
          { promocion: { contains: query.search } },
        ],
      });
    }

    return andFilters.length ? { AND: andFilters } : {};
  }

  async list(query: MembersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhere(query);

    const [total, members] = await Promise.all([
      this.prisma.member.count({ where }),
      this.prisma.member.findMany({
        where,
        orderBy: { apellidos: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    const data = members.map((member) => ({
      id: member.id,
      dni: member.dni,
      cip: member.cip,
      nombre: `${member.nombres} ${member.apellidos}`.trim(),
      grado: member.grado,
      promo: member.promocion,
      estado: member.estado,
      especialidad: member.especialidad,
      email: member.email ?? null,
    }));

    return {
      data,
      page,
      limit,
      total,
    };
  }

  async getById(id: number) {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }
    return member;
  }

  async create(dto: CreateMemberDto) {
    const passwordHash = await bcrypt.hash(dto.dni, 10);
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.create({ data: dto });
      await tx.user.upsert({
        where: { dni: dto.dni },
        update: {},
        create: {
          dni: dto.dni,
          passwordHash,
          role: Role.ASOCIADO,
        },
      });
      return member;
    });
  }

  async update(id: number, dto: UpdateMemberDto) {
    const exists = await this.prisma.member.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Socio no encontrado');
    }
    return this.prisma.member.update({ where: { id }, data: dto });
  }

  async exportCsv(query: MembersQueryDto) {
    const where = this.buildWhere(query);
    const members = await this.prisma.member.findMany({
      where,
      orderBy: { apellidos: 'asc' },
    });

    const header = [
      'DNI',
      'CIP',
      'NOMBRES',
      'APELLIDOS',
      'PROMOCION',
      'GRADO',
      'ESPECIALIDAD',
      'SITUACION',
      'FORMA_APORTE',
      'EMAIL',
      'CELULAR',
      'TELEFONO_CASA',
      'DIRECCION',
      'DISTRITO',
      'ESTADO',
    ];

    const escapeCsv = (value) => {
      if (value === null || value === undefined) {
        return '';
      }
      const text = String(value);
      if (/[\";\n\r]/.test(text)) {
        return `"${text.replace(/\"/g, '""')}"`;
      }
      return text;
    };

    const lines = [header.join(';')];
    for (const member of members) {
      const row = [
        member.dni,
        member.cip,
        member.nombres,
        member.apellidos,
        member.promocion,
        member.grado,
        member.especialidad,
        member.situacion,
        member.forma_aporte,
        member.email,
        member.celular,
        member.telefono_casa,
        member.direccion,
        member.distrito,
        member.estado,
      ];
      lines.push(row.map(escapeCsv).join(';'));
    }

    return lines.join('\n');
  }

  async getSummary() {
    const [total, grouped] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.groupBy({
        by: ['estado'],
        _count: { _all: true },
      }),
    ]);

    const counts = new Map(grouped.map((row) => [row.estado, row._count._all]));

    return {
      total,
      activos: counts.get('Activo') ?? 0,
      morosos: counts.get('Moroso') ?? 0,
      inactivos: counts.get('Inactivo') ?? 0,
    };
  }
}
