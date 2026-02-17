const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient, Role, MemberStatus } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const HEADER_ALIASES = {
  dni: ['DNI'],
  cip: ['CIP'],
  fullName: ['APELLIDOSYNOMBRES'],
  promocion: ['PROM', 'PROMOCION'],
  grado: ['GRADO'],
  especialidad: ['ESPEC', 'ESP'],
  telefonos: ['TELEFONOS', 'TELEFONO'],
  telefonoCasa: ['TELFCASA', 'TELEFONOCASA'],
  celular: ['CELULAR', 'CEL'],
  email: ['EMAIL', 'CORREO', 'MAIL'],
  direccion: ['DIRECCIONDOMICILIARIA', 'DIRECCION'],
  distrito: ['DISTRITO'],
  situacion: ['SITUACIONMILITAR', 'SITUACION'],
  formaAporte: ['FORMAPORT', 'FORMAAPORTE'],
};

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ';' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  if (cells.length > 0 && cells[cells.length - 1] === '') {
    cells.pop();
  }
  return cells;
}

function clean(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).replace(/^\uFEFF/, '').trim();
}

function normalizeHeader(value) {
  return clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
}

function toOptional(value) {
  const trimmed = clean(value);
  return trimmed ? trimmed : null;
}

function splitFullName(fullName) {
  const normalized = clean(fullName).replace(/\s+/g, ' ');
  if (!normalized) {
    return { nombres: '', apellidos: '' };
  }
  const parts = normalized.split(' ');
  if (parts.length === 1) {
    return { nombres: parts[0], apellidos: '' };
  }
  if (parts.length === 2) {
    return { nombres: parts[1], apellidos: parts[0] };
  }
  const nombres = parts.slice(-2).join(' ');
  const apellidos = parts.slice(0, -2).join(' ');
  return { nombres, apellidos };
}

function normalizeKeyPart(value) {
  return clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '');
}

function buildMemberKey({ fullName, promocion, grado, especialidad }) {
  const parts = [fullName, promocion, grado, especialidad]
    .map((value) => normalizeKeyPart(value))
    .filter((value) => value.length > 0);
  return parts.join('-');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const replaceExisting = args.includes('--replace');
  const pruneMissing = args.includes('--prune');
  const fileArgIndex = args.indexOf('--file');
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const envFile = process.env.PADRON_CSV_PATH;
  const defaultFile = path.join(repoRoot, 'padron.csv');
  const resolveFromRoot = (value) =>
    path.isAbsolute(value) ? value : path.resolve(repoRoot, value);

  let filePath = defaultFile;
  if (envFile) {
    filePath = resolveFromRoot(envFile);
  }
  if (fileArgIndex !== -1 && args[fileArgIndex + 1]) {
    filePath = resolveFromRoot(args[fileArgIndex + 1]);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encuentra el archivo: ${filePath}`);
  }

  console.log(`Archivo de padron: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    throw new Error('El archivo esta vacio.');
  }

  const headers = parseCsvLine(lines[0]).map((header) => clean(header));
  const headerIndex = new Map(headers.map((header, idx) => [header, idx]));
  const normalizedHeaderIndex = new Map();
  headers.forEach((header, idx) => {
    const normalized = normalizeHeader(header);
    if (!normalizedHeaderIndex.has(normalized)) {
      normalizedHeaderIndex.set(normalized, idx);
    }
  });

  const hasAnyHeader = (aliases) =>
    aliases.some((alias) => normalizedHeaderIndex.has(alias));

  const isFullFormat = hasAnyHeader(HEADER_ALIASES.dni);

  const requiredGroups = isFullFormat
    ? [
      HEADER_ALIASES.dni,
      HEADER_ALIASES.fullName,
      HEADER_ALIASES.promocion,
      HEADER_ALIASES.grado,
      HEADER_ALIASES.especialidad,
    ]
    : [
      HEADER_ALIASES.fullName,
      HEADER_ALIASES.promocion,
      HEADER_ALIASES.grado,
      HEADER_ALIASES.especialidad,
    ];

  const missingHeaders = requiredGroups
    .filter((aliases) => !aliases.some((alias) => normalizedHeaderIndex.has(alias)))
    .map((aliases) => aliases.join('/'));
  if (missingHeaders.length) {
    throw new Error(
      `Faltan columnas requeridas para el formato ${isFullFormat ? 'completo' : 'basico'}: ` +
      `${missingHeaders.join(', ')}. ` +
      `Encontradas: ${headers.join(', ')}`,
    );
  }

  console.log(`Formato detectado: ${isFullFormat ? 'completo' : 'basico'}`);
  console.log(`Columnas encontradas: ${headers.join(' | ')}`);

  const [existingMembers, existingUsers] = await Promise.all([
    prisma.member.findMany({ select: { id: true, dni: true, cip: true } }),
    prisma.user.findMany({ select: { dni: true } }),
  ]);

  const existingMemberDnis = new Set(existingMembers.map((item) => item.dni));
  const existingUserDnis = new Set(existingUsers.map((item) => item.dni));
  const existingCipToDni = new Map(
    existingMembers
      .filter((item) => item.cip)
      .map((item) => [item.cip, item.dni]),
  );
  const seenDnis = new Set();
  const duplicates = [];
  const skipped = [];
  const inserted = [];
  const updated = [];
  const errors = [];
  const seenCips = new Map();

  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i]);
    const getValueByAliases = (aliases) => {
      for (const alias of aliases) {
        const idx = normalizedHeaderIndex.get(alias);
        if (idx !== undefined) {
          return row[idx] ?? '';
        }
      }
      return '';
    };

    const fullName = clean(getValueByAliases(HEADER_ALIASES.fullName));
    if (!fullName) {
      skipped.push({ row: i + 1, reason: 'Nombre vacio' });
      continue;
    }

    const promocion = clean(getValueByAliases(HEADER_ALIASES.promocion));
    const grado = clean(getValueByAliases(HEADER_ALIASES.grado));
    const especialidad = clean(getValueByAliases(HEADER_ALIASES.especialidad));

    let dni = '';
    if (isFullFormat) {
      dni = clean(getValueByAliases(HEADER_ALIASES.dni));
      if (!dni) {
        skipped.push({ row: i + 1, reason: 'DNI vacio' });
        continue;
      }
    } else {
      dni = buildMemberKey({ fullName, promocion, grado, especialidad });
    }
    if (!dni) {
      skipped.push({ row: i + 1, reason: 'Identificador vacio' });
      continue;
    }

    if (seenDnis.has(dni)) {
      duplicates.push({ dni, reason: 'Duplicado en el archivo' });
      continue;
    }
    seenDnis.add(dni);

    const hasExistingMember = existingMemberDnis.has(dni);
    const hasExistingUser = existingUserDnis.has(dni);
    if ((hasExistingMember || hasExistingUser) && !replaceExisting) {
      duplicates.push({ dni, reason: 'Ya existe en la base' });
      continue;
    }

    const nameParts = splitFullName(fullName);
    const fallbackText = 'Sin dato';
    const email = toOptional(getValueByAliases(HEADER_ALIASES.email));
    const telefonos = toOptional(getValueByAliases(HEADER_ALIASES.telefonos));
    const celular = toOptional(getValueByAliases(HEADER_ALIASES.celular)) || telefonos;
    const telefonoCasa = toOptional(getValueByAliases(HEADER_ALIASES.telefonoCasa));
    const cipValue = toOptional(getValueByAliases(HEADER_ALIASES.cip));

    let cipForCreate = cipValue;
    let cipForUpdate = cipValue;
    if (cipValue) {
      const existingOwner = existingCipToDni.get(cipValue);
      const seenOwner = seenCips.get(cipValue);
      const conflictDni = existingOwner || seenOwner;
      if (conflictDni && conflictDni !== dni) {
        cipForCreate = null;
        cipForUpdate = undefined;
        skipped.push({ row: i + 1, reason: `CIP duplicado (${cipValue})` });
      } else {
        seenCips.set(cipValue, dni);
      }
    }

    const memberData = {
      dni,
      cip: cipForCreate,
      nombres: nameParts.nombres || fullName,
      apellidos: nameParts.apellidos || fullName,
      promocion: promocion || fallbackText,
      grado: grado || fallbackText,
      especialidad: especialidad || fallbackText,
      situacion: toOptional(getValueByAliases(HEADER_ALIASES.situacion)) || fallbackText,
      forma_aporte: toOptional(getValueByAliases(HEADER_ALIASES.formaAporte)) || fallbackText,
      email,
      celular,
      telefono_casa: telefonoCasa,
      direccion: toOptional(getValueByAliases(HEADER_ALIASES.direccion)),
      distrito: toOptional(getValueByAliases(HEADER_ALIASES.distrito)),
      estado: MemberStatus.Activo,
      foto_url: null,
    };
    const memberUpdateData = {
      ...memberData,
      cip: cipForUpdate,
    };

    if (dryRun) {
      if (hasExistingMember || hasExistingUser) {
        updated.push(dni);
      } else {
        inserted.push(dni);
      }
      continue;
    }

    try {
      const passwordHash = await bcrypt.hash(dni, 10);
      if (replaceExisting) {
        await prisma.$transaction([
          prisma.member.upsert({
            where: { dni },
            update: memberUpdateData,
            create: memberData,
          }),
          prisma.user.upsert({
            where: { dni },
            update: {},
            create: {
              dni,
              passwordHash,
              role: Role.ASOCIADO,
            },
          }),
        ]);
        if (hasExistingMember || hasExistingUser) {
          updated.push(dni);
        } else {
          inserted.push(dni);
        }
      } else {
        await prisma.$transaction([
          prisma.member.create({ data: memberData }),
          prisma.user.create({
            data: {
              dni,
              passwordHash,
              role: Role.ASOCIADO,
            },
          }),
        ]);
        inserted.push(dni);
      }
    } catch (error) {
      errors.push({ dni, message: error.message || String(error) });
    }
  }

  console.log(`Total filas: ${lines.length - 1}`);
  console.log(`Insertados: ${inserted.length}`);
  console.log(`Actualizados: ${updated.length}`);
  console.log(`Duplicados: ${duplicates.length}`);
  console.log(`Saltados: ${skipped.length}`);
  if (errors.length) {
    console.log(`Errores: ${errors.length}`);
  }
  if (duplicates.length) {
    console.log('Duplicados (DNI):');
    duplicates.forEach((item) => {
      console.log(`- ${item.dni} (${item.reason})`);
    });
  }
  if (skipped.length) {
    console.log('Saltados:');
    skipped.forEach((item) => {
      console.log(`- ${item.dni || item.row}: ${item.reason}`);
    });
  }
  if (errors.length) {
    console.log('Errores:');
    errors.forEach((item) => {
      console.log(`- ${item.dni}: ${item.message}`);
    });
  }

  if (pruneMissing) {
    const membersToDelete = existingMembers.filter((member) => !seenDnis.has(member.dni));
    console.log(`Por eliminar (no estan en padron): ${membersToDelete.length}`);
    if (!membersToDelete.length) {
      return;
    }
    if (dryRun) {
      return;
    }

    const chunkSize = 200;
    const chunk = (list, size) => {
      const result = [];
      for (let i = 0; i < list.length; i += size) {
        result.push(list.slice(i, i + size));
      }
      return result;
    };

    for (const batch of chunk(membersToDelete, chunkSize)) {
      const memberIds = batch.map((member) => member.id);
      const memberDnis = batch.map((member) => member.dni);

      const dueIds = await prisma.due
        .findMany({ where: { member_id: { in: memberIds } }, select: { id: true } })
        .then((rows) => rows.map((row) => row.id));

      const serviceRequestIds = await prisma.serviceRequest
        .findMany({ where: { member_id: { in: memberIds } }, select: { id: true } })
        .then((rows) => rows.map((row) => row.id));

      if (serviceRequestIds.length) {
        await prisma.attachment.deleteMany({
          where: { service_request_id: { in: serviceRequestIds } },
        });
      }

      if (dueIds.length) {
        const paymentIds = await prisma.payment
          .findMany({ where: { due_id: { in: dueIds } }, select: { id: true } })
          .then((rows) => rows.map((row) => row.id));

        if (paymentIds.length) {
          await prisma.attachment.deleteMany({ where: { payment_id: { in: paymentIds } } });
        }
        await prisma.payment.deleteMany({ where: { due_id: { in: dueIds } } });
      }

      await prisma.due.deleteMany({ where: { member_id: { in: memberIds } } });
      await prisma.moduleProgress.deleteMany({ where: { member_id: { in: memberIds } } });
      await prisma.enrollment.deleteMany({ where: { member_id: { in: memberIds } } });
      await prisma.serviceRequest.deleteMany({ where: { member_id: { in: memberIds } } });
      await prisma.member.deleteMany({ where: { id: { in: memberIds } } });

      const userIds = await prisma.user
        .findMany({
          where: { dni: { in: memberDnis }, role: Role.ASOCIADO },
          select: { id: true },
        })
        .then((rows) => rows.map((row) => row.id));

      if (userIds.length) {
        await prisma.deviceToken.deleteMany({ where: { user_id: { in: userIds } } });
        await prisma.attachment.deleteMany({ where: { created_by_user_id: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
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
