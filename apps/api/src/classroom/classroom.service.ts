import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ClassroomService {
  constructor(private readonly prisma: PrismaService) {}

  async listMemberCourses(dni: string) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { member_id: member.id, status: EnrollmentStatus.APPROVED },
      include: {
        course: {
          include: { modules: { select: { id: true } } },
        },
      },
    });

    const results = await Promise.all(
      enrollments.map(async (enrollment) => {
        const moduleIds = enrollment.course.modules.map((module) => module.id);
        const total = moduleIds.length;
        const completed = total
          ? await this.prisma.moduleProgress.count({
              where: {
                member_id: member.id,
                module_id: { in: moduleIds },
                completed_at: { not: null },
              },
            })
          : 0;
        const progress = total ? Math.round((completed / total) * 100) : 0;
        return {
          id: enrollment.course.id,
          title: enrollment.course.title,
          instructor: enrollment.course.instructor,
          duration: enrollment.course.duration,
          image_url: enrollment.course.image_url,
          progress,
        };
      }),
    );

    return { data: results };
  }

  async listCatalogCourses(dni: string) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const [courses, enrollments] = await Promise.all([
      this.prisma.course.findMany({
        orderBy: { created_at: 'desc' },
        include: { _count: { select: { modules: true } } },
      }),
      this.prisma.enrollment.findMany({
        where: { member_id: member.id },
        select: { course_id: true, status: true },
      }),
    ]);

    const enrollmentMap = new Map(enrollments.map((enrollment) => [enrollment.course_id, enrollment.status]));

    return {
      data: courses.map((course) => ({
        id: course.id,
        title: course.title,
        instructor: course.instructor,
        duration: course.duration,
        image_url: course.image_url,
        module_count: course._count.modules,
        enrolled: enrollmentMap.get(course.id) === EnrollmentStatus.APPROVED,
        enrollment_status: enrollmentMap.get(course.id) || null,
      })),
    };
  }

  async getCourseDetails(dni: string, courseId: number) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        member_id: member.id,
        course_id: courseId,
        status: EnrollmentStatus.APPROVED,
      },
    });
    if (!enrollment) {
      throw new ForbiddenException('No esta matriculado en el curso');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: { orderBy: { order: 'asc' } } },
    });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return {
      id: course.id,
      title: course.title,
      instructor: course.instructor,
      duration: course.duration,
      image_url: course.image_url,
      modules: course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        duration: module.duration,
        description: module.description,
        order: module.order,
      })),
    };
  }

  async completeModule(dni: string, moduleId: number) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });
    if (!module) {
      throw new NotFoundException('Modulo no encontrado');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        member_id: member.id,
        course_id: module.course_id,
        status: EnrollmentStatus.APPROVED,
      },
    });
    if (!enrollment) {
      throw new ForbiddenException('No esta matriculado en el curso');
    }

    const now = new Date();
    const progress = await this.prisma.moduleProgress.upsert({
      where: {
        member_id_module_id: {
          member_id: member.id,
          module_id: moduleId,
        },
      },
      update: { completed_at: now },
      create: {
        member_id: member.id,
        module_id: moduleId,
        completed_at: now,
      },
    });

    return {
      id: progress.id,
      module_id: progress.module_id,
      completed_at: progress.completed_at,
    };
  }

  async requestEnrollment(dni: string, courseId: number) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: {
        member_id_course_id: {
          member_id: member.id,
          course_id: courseId,
        },
      },
    });

    if (existing?.status === EnrollmentStatus.APPROVED) {
      return { course_id: courseId, enrolled: true, status: EnrollmentStatus.APPROVED };
    }

    if (existing?.status === EnrollmentStatus.PENDING) {
      return { course_id: courseId, enrolled: false, status: EnrollmentStatus.PENDING };
    }

    if (existing?.status === EnrollmentStatus.REJECTED) {
      await this.prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: EnrollmentStatus.PENDING },
      });
      return { course_id: courseId, enrolled: false, status: EnrollmentStatus.PENDING };
    }

    await this.prisma.enrollment.create({
      data: {
        member_id: member.id,
        course_id: courseId,
        status: EnrollmentStatus.PENDING,
      },
    });

    return { course_id: courseId, enrolled: false, status: EnrollmentStatus.PENDING };
  }

  async listMaterials(dni: string, moduleId: number) {
    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });
    if (!module) {
      throw new NotFoundException('Modulo no encontrado');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        member_id: member.id,
        course_id: module.course_id,
        status: EnrollmentStatus.APPROVED,
      },
    });
    if (!enrollment) {
      throw new ForbiddenException('No esta matriculado en el curso');
    }

    const materials = await this.prisma.material.findMany({
      where: { module_id: moduleId },
    });

    return {
      data: materials.map((material) => ({
        id: material.id,
        title: material.title,
        file_url: material.file_url,
        type: material.type,
      })),
    };
  }

  async listAdminCourses() {
    const courses = await this.prisma.course.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { modules: true } },
      },
    });

    return {
      data: courses.map((course) => ({
        id: course.id,
        title: course.title,
        instructor: course.instructor,
        duration: course.duration,
        image_url: course.image_url,
        module_count: course._count.modules,
      })),
    };
  }

  async getSummary() {
    const [courses, enrollments] = await Promise.all([
      this.prisma.course.count(),
      this.prisma.enrollment.count({ where: { status: EnrollmentStatus.APPROVED } }),
    ]);

    return {
      courses,
      enrollments,
    };
  }

  async getAdminCourse(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { materials: true },
        },
      },
    });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return {
      id: course.id,
      title: course.title,
      instructor: course.instructor,
      duration: course.duration,
      image_url: course.image_url,
      modules: course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        duration: module.duration,
        description: module.description,
        order: module.order,
        materials: module.materials.map((material) => ({
          id: material.id,
          title: material.title,
          file_url: material.file_url,
          type: material.type,
        })),
      })),
    };
  }

  async createCourse(dto: CreateCourseDto) {
    return this.prisma.course.create({ data: dto });
  }

  async updateCourse(id: number, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async createModule(courseId: number, dto: CreateModuleDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    let order = dto.order;
    if (!order) {
      const aggregate = await this.prisma.module.aggregate({
        where: { course_id: courseId },
        _max: { order: true },
      });
      order = (aggregate._max.order ?? 0) + 1;
    }

    return this.prisma.module.create({
      data: {
        course_id: courseId,
        title: dto.title,
        duration: dto.duration,
        description: dto.description,
        order,
      },
    });
  }

  async updateModule(id: number, dto: UpdateModuleDto) {
    const module = await this.prisma.module.findUnique({ where: { id } });
    if (!module) {
      throw new NotFoundException('Modulo no encontrado');
    }
    return this.prisma.module.update({ where: { id }, data: dto });
  }

  async createMaterial(moduleId: number, dto: CreateMaterialDto) {
    const module = await this.prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) {
      throw new NotFoundException('Modulo no encontrado');
    }
    return this.prisma.material.create({
      data: {
        module_id: moduleId,
        title: dto.title,
        file_url: dto.file_url,
        type: dto.type,
      },
    });
  }

  async updateMaterial(id: number, dto: UpdateMaterialDto) {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material) {
      throw new NotFoundException('Material no encontrado');
    }
    return this.prisma.material.update({ where: { id }, data: dto });
  }

  async listEnrollments(courseId: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_id: courseId },
      include: { member: true },
      orderBy: { enrolled_at: 'desc' },
    });

    return {
      data: enrollments.map((enrollment) => ({
        id: enrollment.id,
        dni: enrollment.member.dni,
        nombres: enrollment.member.nombres,
        apellidos: enrollment.member.apellidos,
        grado: enrollment.member.grado,
        promocion: enrollment.member.promocion,
        status: enrollment.status,
        enrolled_at: enrollment.enrolled_at,
      })),
    };
  }

  async addEnrollment(courseId: number, dni: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    const member = await this.prisma.member.findUnique({ where: { dni } });
    if (!member) {
      throw new NotFoundException('Socio no encontrado');
    }

    const enrollment = await this.prisma.enrollment.upsert({
      where: {
        member_id_course_id: {
          member_id: member.id,
          course_id: courseId,
        },
      },
      update: { status: EnrollmentStatus.APPROVED },
      create: {
        member_id: member.id,
        course_id: courseId,
        status: EnrollmentStatus.APPROVED,
      },
    });

    return {
      id: enrollment.id,
      dni: member.dni,
      nombres: member.nombres,
      apellidos: member.apellidos,
      grado: member.grado,
      promocion: member.promocion,
      status: EnrollmentStatus.APPROVED,
      enrolled_at: enrollment.enrolled_at,
    };
  }

  async updateEnrollmentStatus(enrollmentId: number, status: EnrollmentStatus) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) {
      throw new NotFoundException('Matricula no encontrada');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
    });
  }
}
