-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('Activo', 'Moroso', 'Inactivo', 'Honorario');

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "dni" TEXT NOT NULL,
    "cip" TEXT,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "promocion" TEXT NOT NULL,
    "grado" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "situacion" TEXT NOT NULL,
    "forma_aporte" TEXT NOT NULL,
    "email" TEXT,
    "celular" TEXT,
    "telefono_casa" TEXT,
    "direccion" TEXT,
    "distrito" TEXT,
    "estado" "MemberStatus" NOT NULL,
    "foto_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_dni_key" ON "Member"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Member_cip_key" ON "Member"("cip");
