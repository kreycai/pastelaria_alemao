-- CreateTable
CREATE TABLE "materias_primas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "preco_kg" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materias_primas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pastel_ingredientes" (
    "id" TEXT NOT NULL,
    "pastel_id" TEXT NOT NULL,
    "materia_prima_id" TEXT NOT NULL,
    "quantidade_gramas" DECIMAL(10,3) NOT NULL,

    CONSTRAINT "pastel_ingredientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pastel_ingredientes_pastel_id_materia_prima_id_key" ON "pastel_ingredientes"("pastel_id", "materia_prima_id");

-- AddForeignKey
ALTER TABLE "pastel_ingredientes" ADD CONSTRAINT "pastel_ingredientes_pastel_id_fkey" FOREIGN KEY ("pastel_id") REFERENCES "pasteis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pastel_ingredientes" ADD CONSTRAINT "pastel_ingredientes_materia_prima_id_fkey" FOREIGN KEY ("materia_prima_id") REFERENCES "materias_primas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
