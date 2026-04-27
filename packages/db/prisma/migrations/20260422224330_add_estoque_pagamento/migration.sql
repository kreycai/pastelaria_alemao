-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO');

-- AlterTable
ALTER TABLE "materias_primas" ADD COLUMN     "estoque_gramas" DECIMAL(10,3) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "metodo_pagamento" "MetodoPagamento" NOT NULL DEFAULT 'DINHEIRO';
