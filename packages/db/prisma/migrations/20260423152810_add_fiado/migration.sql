-- AlterEnum
ALTER TYPE "MetodoPagamento" ADD VALUE 'FIADO';

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "fiado_pago" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fiado_pago_em" TIMESTAMP(3),
ADD COLUMN     "nome_cliente" TEXT,
ADD COLUMN     "previsao_pagamento" TIMESTAMP(3);
