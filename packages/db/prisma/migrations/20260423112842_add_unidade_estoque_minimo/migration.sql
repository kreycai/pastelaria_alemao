-- CreateEnum
CREATE TYPE "UnidadeMateriaPrima" AS ENUM ('KG', 'UNIDADE');

-- AlterTable
ALTER TABLE "materias_primas" ADD COLUMN     "estoque_minimo" DECIMAL(10,3) NOT NULL DEFAULT 0,
ADD COLUMN     "unidade" "UnidadeMateriaPrima" NOT NULL DEFAULT 'KG';
