import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@pastelaria/db";
import { CreatePastelDto } from "./dto/create-pastel.dto";
import { UpdatePastelDto } from "./dto/update-pastel.dto";

const includeIngredientes = {
  ingredientes: {
    include: { materiaPrima: true },
  },
};

function calcularCusto(
  ingredientes: Array<{
    quantidadeGramas: { valueOf(): unknown } | number;
    materiaPrima: { precoKg: { valueOf(): unknown } | number };
  }>,
): number {
  return ingredientes.reduce(
    (acc, ing) =>
      acc + (Number(ing.materiaPrima.precoKg) * Number(ing.quantidadeGramas)) / 1000,
    0,
  );
}

function withCusto<T extends { ingredientes: Parameters<typeof calcularCusto>[0] }>(
  pastel: T,
) {
  return { ...pastel, custo: calcularCusto(pastel.ingredientes) };
}

@Injectable()
export class PastelService {
  async findAll() {
    const pasteis = await prisma.pastel.findMany({
      include: includeIngredientes,
      orderBy: { nome: "asc" },
    });
    return pasteis.map(withCusto);
  }

  async findDisponiveis() {
    const pasteis = await prisma.pastel.findMany({
      where: { disponivel: true },
      include: includeIngredientes,
      orderBy: { nome: "asc" },
    });
    return pasteis.map(withCusto);
  }

  async findOne(id: string) {
    const pastel = await prisma.pastel.findUnique({
      where: { id },
      include: includeIngredientes,
    });
    if (!pastel) throw new NotFoundException(`Pastel ${id} não encontrado`);
    return withCusto(pastel);
  }

  async create(dto: CreatePastelDto) {
    const { ingredientes, ...data } = dto;
    const pastel = await prisma.pastel.create({
      data: {
        ...data,
        ingredientes: ingredientes?.length
          ? {
              create: ingredientes.map((ing) => ({
                materiaPrimaId: ing.materiaPrimaId,
                quantidadeGramas: ing.quantidadeGramas,
              })),
            }
          : undefined,
      },
      include: includeIngredientes,
    });
    return withCusto(pastel);
  }

  async update(id: string, dto: UpdatePastelDto) {
    await this.findOne(id);
    const { ingredientes, ...data } = dto;

    if (ingredientes !== undefined) {
      await prisma.pastelIngrediente.deleteMany({ where: { pastelId: id } });
    }

    const pastel = await prisma.pastel.update({
      where: { id },
      data: {
        ...data,
        ingredientes: ingredientes?.length
          ? {
              create: ingredientes.map((ing) => ({
                materiaPrimaId: ing.materiaPrimaId,
                quantidadeGramas: ing.quantidadeGramas,
              })),
            }
          : undefined,
      },
      include: includeIngredientes,
    });
    return withCusto(pastel);
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.pastel.delete({ where: { id } });
  }
}
