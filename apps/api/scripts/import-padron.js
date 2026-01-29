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
  const fileArgIndex = args.indexOf('--file');
  const defaultFile = path.resolve(__dirname, '..', '..', '..', 'padron.csv');
  const filePath = fileArgIndex !== -1 && args[fileArgIndex + 1]
    ? path.resolve(process.cwd(), args[fileArgIndex + 1])
    : defaultFile;

  if (!fs.existsSync(filePath)) {
    throw new Error(`No se encuentra el archivo: ${filePath}`);
  }

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

  const requiredAliases = isFullFormat
    ? [
      ...HEADER_ALIASES.dni,
      ...HEADER_ALIASES.fullName,
      ...HEADER_ALIASES.promocion,
      ...HEADER_ALIASES.grado,
      ...HEADER_ALIASES.especialidad,
    ]
    : [
      ...HEADER_ALIASES.fullName,
      ...HEADER_ALIASES.promocion,
      ...HEADER_ALIASES.grado,
      ...HEADER_ALIASES.especialidad,
    ];

  const missingHeaders = requiredAliases.filter((alias) => !normalizedHeaderIndex.has(alias));
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
    prisma.member.findMany({ select: { dni: true, cip: true } }),
    prisma.user.findMany({ select: { dni: true } }),
  ]);

  const existingMemberDnis = new Set(existingMembers.map((item) => item.dni));
  const existingUserDnis = new Set(existingUsers.map((item) => item.dni));
  const seenDnis = new Set();
  const duplicates = [];
  const skipped = [];
  const inserted = [];
  const errors = [];

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

    if (existingMemberDnis.has(dni) || existingUserDnis.has(dni)) {
      duplicates.push({ dni, reason: 'Ya existe en la base' });
      continue;
    }

    const nameParts = splitFullName(fullName);
    const fallbackText = 'Sin dato';
    const email = toOptional(getValueByAliases(HEADER_ALIASES.email));
    const telefonos = toOptional(getValueByAliases(HEADER_ALIASES.telefonos));
    const celular = toOptional(getValueByAliases(HEADER_ALIASES.celular)) || telefonos;
    const telefonoCasa = toOptional(getValueByAliases(HEADER_ALIASES.telefonoCasa));

    const memberData = {
      dni,
      cip: toOptional(getValueByAliases(HEADER_ALIASES.cip)),
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

    if (dryRun) {
      inserted.push(dni);
      continue;
    }

    try {
      const passwordHash = await bcrypt.hash(dni, 10);
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
    } catch (error) {
      errors.push({ dni, message: error.message || String(error) });
    }
  }

  console.log(`Total filas: ${lines.length - 1}`);
  console.log(`Insertados: ${inserted.length}`);
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
