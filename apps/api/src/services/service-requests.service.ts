import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { AdminServiceRequestsQueryDto } from './dto/admin-service-requests-query.dto';

@Injectable()
export class ServiceRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(dni: string, userId: number, dto: CreateServiceRequestDto) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Fecha programada invalida');
    }

    const now = new Date();
    const request = await this.prisma.serviceRequest.create({
      data: {
        member_id: member.id,
        service_id: service.id,
        notes_member: dto.notes ?? null,
        scheduled_at: scheduledAt,
        created_by_user_id: userId,
        status_updated_by_user_id: userId,
        status_updated_at: now,
      },
      include: { service: true },
    });

    return {
      id: request.id,
      serviceId: request.service_id,
      serviceName: request.service.name,
      status: request.status,
      requested_at: request.requested_at,
      scheduled_at: request.scheduled_at,
      notes_member: request.notes_member,
      notes_admin: request.notes_admin,
    };
  }

  async listMemberRequests(dni: string) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const requests = await this.prisma.serviceRequest.findMany({
      where: { member_id: member.id },
      orderBy: { requested_at: 'desc' },
      include: { service: true },
    });

    return {
      data: requests.map((request) => ({
        id: request.id,
        serviceId: request.service_id,
        serviceName: request.service.name,
        status: request.status,
        requested_at: request.requested_at,
        scheduled_at: request.scheduled_at,
        notes_member: request.notes_member,
        notes_admin: request.notes_admin,
      })),
    };
  }

  async listAdminRequests(query: AdminServiceRequestsQueryDto) {
    const take = query.limit ?? undefined;
    const requests = await this.prisma.serviceRequest.findMany({
      where: {
        status: query.status,
        service_id: query.serviceId,
      },
      orderBy: { requested_at: 'desc' },
      include: { service: true, member: true },
      take,
    });

    return {
      data: requests.map((request) => ({
        id: request.id,
        serviceId: request.service_id,
        serviceName: request.service.name,
        status: request.status,
        requested_at: request.requested_at,
        scheduled_at: request.scheduled_at,
        notes_member: request.notes_member,
        notes_admin: request.notes_admin,
        memberId: request.member_id,
        dni: request.member.dni,
        nombre: `${request.member.nombres} ${request.member.apellidos}`.trim(),
      })),
    };
  }

  async getSummary() {
    const [total, grouped] = await Promise.all([
      this.prisma.serviceRequest.count(),
      this.prisma.serviceRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const counts = new Map(grouped.map((row) => [row.status, row._count._all]));

    return {
      total,
      pending: counts.get('RECIBIDO') ?? 0,
    };
  }

  async updateStatus(userId: number, id: number, dto: UpdateServiceRequestStatusDto) {
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Fecha programada invalida');
    }

    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: { service: true },
    });
    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id },
      data: {
        status: dto.status,
        notes_admin: dto.notesAdmin ?? null,
        scheduled_at: scheduledAt ?? request.scheduled_at,
        status_updated_by_user_id: userId,
        status_updated_at: new Date(),
      },
      include: { service: true },
    });

    return {
      id: updated.id,
      serviceId: updated.service_id,
      serviceName: updated.service.name,
      status: updated.status,
      requested_at: updated.requested_at,
      scheduled_at: updated.scheduled_at,
      notes_member: updated.notes_member,
      notes_admin: updated.notes_admin,
    };
  }

  async addAttachment(dni: string, userId: number, requestId: number, file: { url: string; mime: string; size: number }) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const request = await this.prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request || request.member_id !== member.id) {
      throw new ForbiddenException('Solicitud no valida');
    }

    const attachment = await this.prisma.attachment.create({
      data: {
        url: file.url,
        mime: file.mime,
        size: file.size,
        created_by_user_id: userId,
        service_request_id: requestId,
      },
    });

    return attachment;
  }
}
