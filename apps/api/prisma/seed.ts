import { AnnouncementSegmentType, DueStatus, MemberStatus, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const demoPassword = await bcrypt.hash('demo123', 10);

  await prisma.user.upsert({
    where: { dni: 'admin' },
    update: {
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
    create: {
      dni: 'admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { dni: '12345678' },
    update: {
      passwordHash: demoPassword,
      role: Role.ASOCIADO,
    },
    create: {
      dni: '12345678',
      passwordHash: demoPassword,
      role: Role.ASOCIADO,
    },
  });

  const members = [
    {
      dni: '12345678',
      cip: '129485',
      nombres: 'Roberto',
      apellidos: 'Gomez de la Torre',
      promocion: '1995',
      grado: 'Capitan de Corbeta',
      especialidad: 'Ingenieria',
      situacion: 'Retiro',
      forma_aporte: 'Descuento Planilla',
      email: 'roberto.gomez@email.com',
      celular: '998877665',
      telefono_casa: '456-7890',
      direccion: 'Av. La Marina 2505, San Miguel',
      distrito: 'Lima',
      estado: MemberStatus.Activo,
      foto_url: null,
    },
    {
      dni: '87654321',
      cip: '887766',
      nombres: 'Luis',
      apellidos: 'Alarcon',
      promocion: '1998',
      grado: 'Teniente 1ro',
      especialidad: 'Cubierta',
      situacion: 'Retiro',
      forma_aporte: 'Deposito',
      email: null,
      celular: null,
      telefono_casa: null,
      direccion: null,
      distrito: null,
      estado: MemberStatus.Moroso,
      foto_url: null,
    },
    {
      dni: '11223344',
      cip: '554433',
      nombres: 'Carlos',
      apellidos: 'Ferrero',
      promocion: '1980',
      grado: 'Almirante',
      especialidad: 'Inteligencia',
      situacion: 'Retiro',
      forma_aporte: 'Descuento Planilla',
      email: null,
      celular: null,
      telefono_casa: null,
      direccion: null,
      distrito: null,
      estado: MemberStatus.Activo,
      foto_url: null,
    },
    {
      dni: '55667788',
      cip: '000001',
      nombres: 'Miguel',
      apellidos: 'Grau',
      promocion: '1854',
      grado: 'Gran Almirante',
      especialidad: 'Comando',
      situacion: 'Honor',
      forma_aporte: 'Honorario',
      email: null,
      celular: null,
      telefono_casa: null,
      direccion: null,
      distrito: null,
      estado: MemberStatus.Honorario,
      foto_url: null,
    },
    {
      dni: '99887766',
      cip: '223344',
      nombres: 'Jorge',
      apellidos: 'Chavez',
      promocion: '1995',
      grado: 'Teniente 2do',
      especialidad: 'Aviacion',
      situacion: 'Retiro',
      forma_aporte: 'Deposito',
      email: null,
      celular: null,
      telefono_casa: null,
      direccion: null,
      distrito: null,
      estado: MemberStatus.Inactivo,
      foto_url: null,
    },
  ];

  for (const member of members) {
    await prisma.member.upsert({
      where: { dni: member.dni },
      update: member,
      create: member,
    });
  }

  const demoMember = await prisma.member.findUnique({ where: { dni: '12345678' } });
  if (demoMember) {
    const amount = 50;
    const now = new Date();
    for (let i = 0; i < 6; i += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const dueDate = new Date(year, month, 0);
      const status = i === 0 ? DueStatus.PENDING : DueStatus.PAID;

      await prisma.due.upsert({
        where: {
          member_id_year_month: {
            member_id: demoMember.id,
            year,
            month,
          },
        },
        update: {
          amount,
          status,
          due_date: dueDate,
        },
        create: {
          member_id: demoMember.id,
          year,
          month,
          amount,
          status,
          due_date: dueDate,
        },
      });
    }
  }

  const services = [
    {
      name: 'Tramite de licencias de armas (SUCAMEC)',
      description: 'Asesoria y gestion para tramites de licencias de armas ante SUCAMEC.',
      requirements: 'DNI vigente, antecedentes, certificado medico, pago de tasas.',
      schedule: null,
      phones: null,
      email: null,
    },
    {
      name: 'Auditorium',
      description: 'Reservas de auditorium institucional para eventos.',
      requirements: 'Solicitud previa y coordinacion con administracion.',
      schedule: 'Horario de atencion: 9am-6pm',
      phones: '999-111-222 / 01-555-1234',
      email: 'auditorium@asomar.pe',
    },
    {
      name: 'Barberia',
      description: 'Servicios de corte clasico/moderno, barba y facial.',
      requirements: null,
      schedule: 'Horario de atencion: 9am-6pm',
      phones: null,
      email: null,
    },
    {
      name: 'Podologia',
      description: 'Tratamiento integral de pies y cuidados podologicos.',
      requirements: null,
      schedule: 'Horario de atencion: 9am-6pm',
      phones: null,
      email: null,
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: service,
      create: service,
    });
  }

  const courses = [
    {
      title: 'Seguridad y Defensa Internacional',
      instructor: 'Valm. (r) Juan Perez',
      duration: '4 Semanas',
      image_url: 'https://images.unsplash.com/photo-1598335624128-444702958742?q=80&w=800&auto=format&fit=crop',
      modules: [
        {
          title: 'Panorama Geopolitico 2025',
          duration: '45 min',
          description: 'Analisis del panorama geopolitico actual y su impacto en la seguridad maritima nacional.',
          order: 1,
        },
        {
          title: 'Amenazas Asimetricas en el Pacifico',
          duration: '50 min',
          description: 'Estudio de amenazas no convencionales en la region Asia-Pacifico.',
          order: 2,
        },
        {
          title: 'Ciberseguridad Naval',
          duration: '60 min',
          description: 'Protocolos de defensa ante ataques ciberneticos.',
          order: 3,
        },
        {
          title: 'Estrategias de Cooperacion Regional',
          duration: '40 min',
          description: 'Mecanismos de integracion naval y ejercicios combinados.',
          order: 4,
        },
      ],
    },
    {
      title: 'Historia Naval: La Campana Maritima de 1879',
      instructor: 'Historiador Naval Luis Alva',
      duration: '6 Semanas',
      image_url: 'https://images.unsplash.com/photo-1533602534571-70802c34d402?q=80&w=800&auto=format&fit=crop',
      modules: [
        {
          title: 'Antecedentes y el Poder Naval en 1879',
          duration: '50 min',
          description: 'Analisis comparativo de las escuadras de Peru y Chile.',
          order: 1,
        },
        {
          title: 'El Combate Naval de Iquique',
          duration: '60 min',
          description: 'Estudio tactico de las maniobras del 21 de mayo de 1879.',
          order: 2,
        },
        {
          title: 'Las Correrias del Huascar',
          duration: '55 min',
          description: 'Analisis de la estrategia de flota en potencia.',
          order: 3,
        },
        {
          title: 'El Combate de Angamos',
          duration: '70 min',
          description: 'Reconstruccion del 8 de octubre de 1879 y su legado.',
          order: 4,
        },
        {
          title: 'El Bloqueo del Callao y la Defensa de Lima',
          duration: '45 min',
          description: 'La resistencia naval tras la perdida de los buques capitales.',
          order: 5,
        },
      ],
    },
    {
      title: 'Historia del Terrorismo y Pacificacion',
      instructor: 'CALM. (r) Miguel Santos',
      duration: '6 Semanas',
      image_url: 'https://images.unsplash.com/photo-1535970793548-5231c5905f15?q=80&w=800&auto=format&fit=crop',
      modules: [
        {
          title: 'Origenes del Terrorismo en el Peru',
          duration: '45 min',
          description: 'Factores sociopoliticos que explican el surgimiento de grupos terroristas.',
          order: 1,
        },
        {
          title: 'La Marina de Guerra en el Frente Interno',
          duration: '55 min',
          description: 'Despliegue de la fuerza naval en zonas de emergencia.',
          order: 2,
        },
        {
          title: 'Evolucion Estrategica',
          duration: '60 min',
          description: 'Transformacion de la doctrina militar peruana.',
          order: 3,
        },
        {
          title: 'Sociologia de la Violencia',
          duration: '50 min',
          description: 'Analisis de dinamicas sociales y legitimidad del Estado.',
          order: 4,
        },
        {
          title: 'Proceso de Pacificacion Nacional',
          duration: '40 min',
          description: 'Declive de organizaciones terroristas y consolidacion de la paz.',
          order: 5,
        },
        {
          title: 'La CVR: Analisis del Informe',
          duration: '60 min',
          description: 'Debate sobre el informe de la Comision de la Verdad y Reconciliacion.',
          order: 6,
        },
      ],
    },
  ];

  const courseRecords = [];
  for (const course of courses) {
    const existing = await prisma.course.findFirst({ where: { title: course.title } });
    let courseRecord = existing;
    if (!courseRecord) {
      courseRecord = await prisma.course.create({
        data: {
          title: course.title,
          instructor: course.instructor,
          duration: course.duration,
          image_url: course.image_url,
        },
      });
    } else {
      await prisma.course.update({
        where: { id: courseRecord.id },
        data: {
          instructor: course.instructor,
          duration: course.duration,
          image_url: course.image_url,
        },
      });
    }

    const moduleCount = await prisma.module.count({ where: { course_id: courseRecord.id } });
    if (moduleCount === 0) {
      for (const module of course.modules) {
        const moduleRecord = await prisma.module.create({
          data: {
            course_id: courseRecord.id,
            title: module.title,
            duration: module.duration,
            description: module.description,
            order: module.order,
          },
        });

        const materials = [
          {
            title: 'Lectura: Material Academico.pdf',
            file_url: '/uploads/material-academico.pdf',
            type: 'pdf',
          },
          {
            title: 'Diapositivas de la Sesion.pptx',
            file_url: '/uploads/diapositivas-sesion.pptx',
            type: 'pptx',
          },
        ];

        for (const material of materials) {
          await prisma.material.create({
            data: {
              module_id: moduleRecord.id,
              title: material.title,
              file_url: material.file_url,
              type: material.type,
            },
          });
        }
      }
    }

    courseRecords.push(courseRecord);
  }

  if (demoMember) {
    for (const course of courseRecords.slice(0, 2)) {
      await prisma.enrollment.upsert({
        where: {
          member_id_course_id: {
            member_id: demoMember.id,
            course_id: course.id,
          },
        },
        update: {},
        create: {
          member_id: demoMember.id,
          course_id: course.id,
        },
      });
    }
  }

  const adminUser = await prisma.user.findUnique({ where: { dni: 'admin' } });
  if (adminUser) {
    const announcements = [
      {
        title: 'Convocatoria Asamblea General',
        body: 'Se convoca a todos los asociados a la asamblea general del proximo mes. La agenda sera publicada en breve.',
        segment_type: AnnouncementSegmentType.ALL,
        segment_value: null,
      },
      {
        title: 'Comunicado Promocion 1995',
        body: 'Reunion especial para la promocion 1995. Confirmar asistencia con la secretaria.',
        segment_type: AnnouncementSegmentType.PROMOCION,
        segment_value: '1995',
      },
    ];

    for (const announcement of announcements) {
      const exists = await prisma.announcement.findFirst({
        where: { title: announcement.title },
      });
      if (!exists) {
        await prisma.announcement.create({
          data: {
            ...announcement,
            created_by_user_id: adminUser.id,
          },
        });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
