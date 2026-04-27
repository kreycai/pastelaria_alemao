import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@pastelaria/db";
import { StatusPedido } from "@pastelaria/db";
import { CreatePedidoDto } from "./dto/create-pedido.dto";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class PedidoService {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}
  async findAll() {
    return prisma.pedido.findMany({
      include: { itens: { include: { pastel: true } }, cliente: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findFiados(nome?: string, clienteId?: string) {
    return prisma.pedido.findMany({
      where: {
        metodoPagamento: "FIADO",
        ...(clienteId ? { clienteId } : nome ? { nomeCliente: { contains: nome, mode: "insensitive" } } : {}),
      },
      include: { itens: { include: { pastel: true } }, cliente: { select: { id: true, nome: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { itens: { include: { pastel: true } }, cliente: true },
    });
    if (!pedido) throw new NotFoundException(`Pedido ${id} não encontrado`);
    return pedido;
  }

  async create(dto: CreatePedidoDto) {
    const pasteis = await prisma.pastel.findMany({
      where: { id: { in: dto.itens.map((i) => i.pastelId) } },
      include: { ingredientes: true },
    });

    const total = dto.itens.reduce((acc, item) => {
      const pastel = pasteis.find((p) => p.id === item.pastelId);
      return acc + Number(pastel?.preco ?? 0) * item.quantidade;
    }, 0);

    const pedido = await prisma.pedido.create({
      data: {
        clienteId: dto.clienteId,
        observacao: dto.observacao,
        metodoPagamento: dto.metodoPagamento ?? "DINHEIRO",
        nomeCliente: dto.nomeCliente,
        previsaoPagamento: dto.previsaoPagamento ? new Date(dto.previsaoPagamento) : null,
        total,
        itens: {
          create: dto.itens.map((item) => {
            const pastel = pasteis.find((p) => p.id === item.pastelId)!;
            return { pastelId: item.pastelId, quantidade: item.quantidade, precoUnit: pastel.preco };
          }),
        },
      },
      include: { itens: { include: { pastel: true } } },
    });

    // Coleta IDs de matérias-primas afetadas pelo pedido
    const materiasAfetadas = new Map<string, number>();
    for (const item of dto.itens) {
      const pastel = pasteis.find((p) => p.id === item.pastelId);
      if (!pastel) continue;
      for (const ing of pastel.ingredientes) {
        const atual = materiasAfetadas.get(ing.materiaPrimaId) ?? 0;
        materiasAfetadas.set(ing.materiaPrimaId, atual + Number(ing.quantidadeGramas) * item.quantidade);
      }
    }

    if (materiasAfetadas.size > 0) {
      const ids = [...materiasAfetadas.keys()];

      // Estado ANTES do decremento
      const antes = await prisma.materiaPrima.findMany({
        where: { id: { in: ids } },
        select: { id: true, nome: true, estoqueGramas: true, estoqueMinimo: true },
      });

      // Decrementa todas as matérias-primas
      await Promise.all(
        [...materiasAfetadas.entries()].map(([id, gramas]) =>
          prisma.materiaPrima.update({
            where: { id },
            data: { estoqueGramas: { decrement: gramas } },
          }),
        ),
      );

      // Estado DEPOIS do decremento
      const depois = await prisma.materiaPrima.findMany({
        where: { id: { in: ids } },
        select: { id: true, nome: true, estoqueGramas: true, estoqueMinimo: true },
      });

      // Detecta itens que CRUZARAM o limiar (eram OK, agora são críticos)
      const recemCriticos = depois.filter((d) => {
        const a = antes.find((x) => x.id === d.id);
        const eraOk = a && Number(a.estoqueGramas) > Number(a.estoqueMinimo);
        const agoraCritico = Number(d.estoqueGramas) <= Number(d.estoqueMinimo);
        return eraOk && agoraCritico;
      });

      if (recemCriticos.length > 0) {
        void this.notificationsService.sendStockCriticalAlert(recemCriticos);
      }
    }

    return pedido;
  }

  async updateStatus(id: string, status: StatusPedido) {
    await this.findOne(id);
    const pedido = await prisma.pedido.update({
      where: { id }, data: { status },
      include: { itens: { include: { pastel: true } } },
    });
    return pedido;
  }

  async pagarFiado(id: string, previsaoPagamento?: string) {
    await this.findOne(id);
    return prisma.pedido.update({
      where: { id },
      data: {
        fiadoPago: true,
        fiadoPagoEm: new Date(),
        ...(previsaoPagamento !== undefined
          ? { previsaoPagamento: previsaoPagamento ? new Date(previsaoPagamento) : null }
          : {}),
      },
    });
  }

  async atualizarPrevisao(id: string, previsaoPagamento: string | null) {
    await this.findOne(id);
    return prisma.pedido.update({
      where: { id },
      data: { previsaoPagamento: previsaoPagamento ? new Date(previsaoPagamento) : null },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.pedido.delete({ where: { id } });
  }
}
