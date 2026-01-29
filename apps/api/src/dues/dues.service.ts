import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DueStatus, MemberStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminDuesQueryDto } from './dto/admin-dues-query.dto';
import { AdminPaymentDto } from './dto/admin-payment.dto';
import { CreateMePaymentDto } from './dto/me-payment.dto';
import { MeDuesQueryDto } from './dto/me-dues-query.dto';

@Injectable()
export class DuesService {
  constructor(private readonly prisma: PrismaService) {}

  async listMemberDues(dni: string, query: MeDuesQueryDto) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const year = query.year ?? new Date().getFullYear();
    const dues = await this.prisma.due.findMany({
      where: { member_id: member.id, year },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    return { data: dues };
  }

  async getMemberSummary(dni: string) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueCount = await this.prisma.due.count({
      where: {
        member_id: member.id,
        status: DueStatus.PENDING,
        due_date: { lt: today },
      },
    });

    const pendingCount = await this.prisma.due.count({
      where: { member_id: member.id, status: DueStatus.PENDING },
    });

    const lastPayment = await this.prisma.payment.findFirst({
      where: { due: { member_id: member.id } },
      orderBy: { paid_at: 'desc' },
      select: { paid_at: true },
    });

    const now = new Date();
    const nextDueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      status: overdueCount > 0 ? 'MOROSO' : 'AL_DIA',
      nextDueDate,
      pendingCount,
      lastPaymentAt: lastPayment?.paid_at ?? null,
    };
  }

  async createMemberPayment(dni: string, userId: number, dto: CreateMePaymentDto) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const due = await this.prisma.due.findUnique({ where: { id: dto.due_id } });
    if (!due || due.member_id !== member.id) {
      throw new ForbiddenException('Cuota no valida');
    }

    if (due.status !== DueStatus.PENDING) {
      throw new BadRequestException('La cuota no esta pendiente');
    }

    return this.prisma.payment.create({
      data: {
        due_id: due.id,
        amount: dto.amount,
        paid_at: new Date(),
        method: dto.method,
        reference: dto.reference,
        voucher_url: dto.voucher_url ?? null,
        created_by_user_id: userId,
      },
    });
  }

  async attachVoucher(dni: string, userId: number, paymentId: number, file: { url: string; mime: string; size: number }) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { due: true },
    });

    if (!payment || payment.due.member_id !== member.id) {
      throw new ForbiddenException('Pago no valido');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { voucher_url: file.url },
    });

    await this.prisma.attachment.create({
      data: {
        url: file.url,
        mime: file.mime,
        size: file.size,
        created_by_user_id: userId,
        payment_id: paymentId,
      },
    });

    return updated;
  }

  async listAdminDues(query: AdminDuesQueryDto) {
    const [yearStr, monthStr] = query.month.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);

    const dues = await this.prisma.due.findMany({
      where: {
        year,
        month,
        status: query.status,
        member: query.promocion ? { promocion: query.promocion } : undefined,
      },
      include: { member: true },
      orderBy: [{ member: { apellidos: 'asc' } }, { member: { nombres: 'asc' } }],
    });

    const data = dues.map((due) => ({
      id: due.id,
      member_id: due.member_id,
      dni: due.member.dni,
      cip: due.member.cip,
      nombre: `${due.member.nombres} ${due.member.apellidos}`.trim(),
      promocion: due.member.promocion,
      grado: due.member.grado,
      especialidad: due.member.especialidad,
      amount: due.amount,
      status: due.status,
      due_date: due.due_date,
    }));

    return { data, total: data.length };
  }

  async createAdminPayment(userId: number, dto: AdminPaymentDto) {
    const due = await this.prisma.due.findUnique({ where: { id: dto.due_id } });
    if (!due) {
      throw new NotFoundException('Cuota no encontrada');
    }

    const paidAt = new Date();
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          due_id: due.id,
          amount: dto.amount,
          paid_at: paidAt,
          method: dto.method,
          reference: dto.reference,
          voucher_url: dto.voucher_url ?? null,
          created_by_user_id: userId,
          validated_by_user_id: userId,
          validated_at: paidAt,
        },
      });

      await tx.due.update({
        where: { id: due.id },
        data: { status: DueStatus.PAID },
      });

      return payment;
    });
  }

  async validatePayment(userId: number, paymentId: number) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    const validatedAt = new Date();
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: {
          validated_by_user_id: userId,
          validated_at: validatedAt,
        },
      });

      await tx.due.update({
        where: { id: payment.due_id },
        data: { status: DueStatus.PAID },
      });

      return updated;
    });
  }

  async getPaymentAdmin(paymentId: number) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }
    return payment;
  }

  async getAdminProjection(year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const monthlyContribution = 30;
    const payingMembersCount = await this.prisma.member.count({
      where: {
        estado: { in: [MemberStatus.Activo, MemberStatus.Moroso] },
      },
    });
    const grouped = await this.prisma.due.groupBy({
      by: ['month', 'status'],
      where: { year: targetYear },
      _sum: { amount: true },
    });

    const months = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      expected: payingMembersCount * monthlyContribution,
      paid: 0,
      pending: 0,
      waived: 0,
      pendingFromDues: 0,
    }));

    let totalExpected = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalWaived = 0;

    grouped.forEach((row) => {
      const amount = row._sum.amount ?? 0;
      const entry = months[row.month - 1];
      if (!entry) {
        return;
      }

      if (row.status === DueStatus.PAID) {
        entry.paid += amount;
      } else if (row.status === DueStatus.PENDING) {
        entry.pendingFromDues += amount;
      } else if (row.status === DueStatus.WAIVED) {
        entry.waived += amount;
      }
    });

    months.forEach((entry) => {
      const expected = entry.expected;
      const pendingFallback = Math.max(expected - entry.paid - entry.waived, 0);
      entry.pending = entry.pendingFromDues > 0 ? entry.pendingFromDues : pendingFallback;
      totalExpected += expected;
      totalPaid += entry.paid;
      totalPending += entry.pending;
      totalWaived += entry.waived;
    });

    return {
      year: targetYear,
      months: months.map(({ pendingFromDues, ...rest }) => rest),
      totals: {
        expected: totalExpected,
        paid: totalPaid,
        pending: totalPending,
        waived: totalWaived,
      },
    };
  }
}
