import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listServices() {
    const services = await this.prisma.service.findMany({ orderBy: { name: 'asc' } });
    return { data: services };
  }

  async ensureServiceExists(serviceId: number) {
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return service;
  }
}
