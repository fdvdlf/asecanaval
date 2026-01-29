import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(dni: string) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Ficha no encontrada');
    }
    return member;
  }

  async updateContact(dni: string, dto: UpdateContactDto) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Ficha no encontrada');
    }
    return this.prisma.member.update({ where: { id: member.id }, data: dto });
  }
}
