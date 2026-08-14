import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@pastelaria/db";
import { CreateMateriaPrimaDto } from "./dto/create-materia-prima.dto";
import { UpdateMateriaPrimaDto } from "./dto/update-materia-prima.dto";

@Injectable()
export class MateriaPrimaService {
  async findAll() {
    return prisma.materiaPrima.findMany({ orderBy: { nome: "asc" } });
  }

  async findOne(id: string) {
    const mp = await prisma.materiaPrima.findUnique({ where: { id } });
    if (!mp) throw new NotFoundException(`Matéria-prima ${id} não encontrada`);
    return mp;
  }

  async create(dto: CreateMateriaPrimaDto) {
    return prisma.materiaPrima.create({ data: dto });
  }

  async update(id: string, dto: UpdateMateriaPrimaDto) {
    await this.findOne(id);
    return prisma.materiaPrima.update({ where: { id }, data: dto });
  }

  async ajustarEstoque(id: string, gramas: number) {
    await this.findOne(id);
    return prisma.materiaPrima.update({
      where: { id },
      data: { estoqueGramas: { increment: gramas } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.materiaPrima.delete({ where: { id } });
  }
}
