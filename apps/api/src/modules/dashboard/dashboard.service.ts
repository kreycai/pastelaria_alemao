import { Injectable } from "@nestjs/common";
import { prisma } from "@pastelaria/db";

function startOf(unit: "day" | "month"): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (unit === "month") d.setDate(1);
  return d;
}

@Injectable()
export class DashboardService {
  async getTopPasteis() {
    const top = await prisma.itemPedido.groupBy({
      by: ["pastelId"],
      _sum: { quantidade: true },
      where: { pedido: { status: { not: "CANCELADO" } } },
      orderBy: { _sum: { quantidade: "desc" } },
      take: 10,
    });
    const ids = top.map((t) => t.pastelId);
    const pasteis = await prisma.pastel.findMany({
      where: { id: { in: ids }, disponivel: true },
      select: { id: true, nome: true, preco: true },
    });
    const pm = new Map(pasteis.map((p) => [p.id, p]));
    return top
      .filter((t) => pm.has(t.pastelId))
      .map((t) => ({
        id: t.pastelId,
        nome: pm.get(t.pastelId)!.nome,
        preco: pm.get(t.pastelId)!.preco,
        quantidade: t._sum.quantidade ?? 0,
      }));
  }

  async getPeriodo(de: Date, ate: Date) {
    const pedidos = await prisma.pedido.findMany({
      where: { createdAt: { gte: de, lte: ate }, status: { not: "CANCELADO" } },
      include: { itens: { include: { pastel: { include: { ingredientes: { include: { materiaPrima: true } } } } } } },
    });

    const faturamento = pedidos.reduce((a, p) => a + Number(p.total), 0);
    const custo = pedidos.reduce(
      (acc, pedido) =>
        acc +
        pedido.itens.reduce(
          (a, item) =>
            a +
            item.pastel.ingredientes.reduce(
              (b, ing) =>
                b + (Number(ing.materiaPrima.precoKg) * Number(ing.quantidadeGramas) * item.quantidade) / 1000,
              0,
            ),
          0,
        ),
      0,
    );

    const topItens = await prisma.itemPedido.groupBy({
      by: ["pastelId"],
      _sum: { quantidade: true },
      where: { pedido: { status: { not: "CANCELADO" }, createdAt: { gte: de, lte: ate } } },
      orderBy: { _sum: { quantidade: "desc" } },
      take: 5,
    });

    const pastelIds = topItens.map((t) => t.pastelId);
    const pasteis = await prisma.pastel.findMany({
      where: { id: { in: pastelIds } },
      select: { id: true, nome: true, preco: true },
    });
    const pastelMap = new Map(pasteis.map((p) => [p.id, p]));

    return {
      periodo: { pedidos: pedidos.length, faturamento, custo, lucro: faturamento - custo },
      topPasteis: topItens.map((t) => ({
        id: t.pastelId,
        nome: pastelMap.get(t.pastelId)?.nome ?? "?",
        quantidade: t._sum.quantidade ?? 0,
        faturamento: (t._sum.quantidade ?? 0) * Number(pastelMap.get(t.pastelId)?.preco ?? 0),
      })),
    };
  }

  async getStats() {
    const hojeInicio = startOf("day");
    const mesInicio = startOf("month");

    const [pedidosHoje, pedidosMes, topPasteis, todasMaterias] = await Promise.all([
      prisma.pedido.findMany({
        where: { createdAt: { gte: hojeInicio }, status: { not: "CANCELADO" } },
        include: { itens: { include: { pastel: { include: { ingredientes: { include: { materiaPrima: true } } } } } } },
      }),
      prisma.pedido.findMany({
        where: { createdAt: { gte: mesInicio }, status: { not: "CANCELADO" } },
        include: { itens: { include: { pastel: { include: { ingredientes: { include: { materiaPrima: true } } } } } } },
      }),
      prisma.itemPedido.groupBy({
        by: ["pastelId"],
        _sum: { quantidade: true },
        _count: { id: true },
        where: { pedido: { status: { not: "CANCELADO" }, createdAt: { gte: mesInicio } } },
        orderBy: { _sum: { quantidade: "desc" } },
        take: 5,
      }),
      prisma.materiaPrima.findMany({ orderBy: { estoqueGramas: "asc" } }),
    ]);

    const estoqueAlerta = todasMaterias.filter(
      (mp) => Number(mp.estoqueGramas) <= Number(mp.estoqueMinimo),
    );

    const calcCusto = (pedidos: typeof pedidosMes) =>
      pedidos.reduce((acc, pedido) =>
        acc + pedido.itens.reduce((a, item) =>
          a + item.pastel.ingredientes.reduce((b, ing) =>
            b + (Number(ing.materiaPrima.precoKg) * Number(ing.quantidadeGramas) * item.quantidade) / 1000,
            0), 0), 0);

    const faturamentoHoje = pedidosHoje.reduce((a, p) => a + Number(p.total), 0);
    const faturamentoMes = pedidosMes.reduce((a, p) => a + Number(p.total), 0);
    const custoHoje = calcCusto(pedidosHoje);
    const custoMes = calcCusto(pedidosMes);

    const pastelIds = topPasteis.map((t) => t.pastelId);
    const pasteis = await prisma.pastel.findMany({ where: { id: { in: pastelIds } }, select: { id: true, nome: true, preco: true } });
    const pastelMap = new Map(pasteis.map((p) => [p.id, p]));

    const pedidosPorStatus = await prisma.pedido.groupBy({
      by: ["status"],
      _count: { id: true },
      where: { createdAt: { gte: mesInicio } },
    });

    return {
      hoje: {
        pedidos: pedidosHoje.length,
        faturamento: faturamentoHoje,
        custo: custoHoje,
        lucro: faturamentoHoje - custoHoje,
      },
      mes: {
        pedidos: pedidosMes.length,
        faturamento: faturamentoMes,
        custo: custoMes,
        lucro: faturamentoMes - custoMes,
      },
      topPasteis: topPasteis.map((t) => ({
        id: t.pastelId,
        nome: pastelMap.get(t.pastelId)?.nome ?? "?",
        quantidade: t._sum.quantidade ?? 0,
        faturamento: (t._sum.quantidade ?? 0) * Number(pastelMap.get(t.pastelId)?.preco ?? 0),
      })),
      pedidosPorStatus: pedidosPorStatus.map((p) => ({ status: p.status, count: p._count.id })),
      estoqueAlerta: estoqueAlerta.map((mp) => ({
        id: mp.id,
        nome: mp.nome,
        unidade: mp.unidade,
        estoque: Number(mp.estoqueGramas),
        estoqueMinimo: Number(mp.estoqueMinimo),
      })),
    };
  }
}
