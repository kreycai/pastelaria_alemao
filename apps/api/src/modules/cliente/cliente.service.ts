import { Injectable } from "@nestjs/common";
import { prisma } from "@pastelaria/db";

@Injectable()
export class ClienteService {
  search(nome: string) {
    return prisma.cliente.findMany({
      where: { nome: { contains: nome, mode: "insensitive" } },
      orderBy: { nome: "asc" },
      take: 10,
      select: { id: true, nome: true },
    });
  }

  create(nome: string) {
    return prisma.cliente.create({
      data: { nome: nome.trim() },
      select: { id: true, nome: true },
    });
  }
}
