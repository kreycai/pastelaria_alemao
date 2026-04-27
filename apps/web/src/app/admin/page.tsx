import Link from "next/link";
import { API_URL } from "@/lib/api";
import {
  LuChefHat, LuReceipt, LuNotebook, LuTriangleAlert,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import DashboardFiltro from "./DashboardFiltro";

interface DashStats {
  hoje: { pedidos: number; faturamento: number; custo: number; lucro: number };
  mes: { pedidos: number; faturamento: number; custo: number; lucro: number };
  topPasteis: Array<{ id: string; nome: string; quantidade: number; faturamento: number }>;
  pedidosPorStatus: Array<{ status: string; count: number }>;
  estoqueAlerta: Array<{ id: string; nome: string; unidade: "KG" | "UNIDADE"; estoque: number; estoqueMinimo: number }>;
}

interface Fiado {
  id: string; nomeCliente: string | null; total: number;
  previsaoPagamento: string | null; fiadoPago: boolean; createdAt: string;
}

async function getStats(): Promise<DashStats | null> {
  try {
    const res = await fetch(`${API_URL}/dashboard/stats`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getCounts() {
  try {
    const [pasteis, materias] = await Promise.all([
      fetch(`${API_URL}/pasteis`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`${API_URL}/materias-primas`, { cache: "no-store" }).then((r) => r.json()),
    ]);
    return { pasteis: pasteis.length ?? 0, materias: materias.length ?? 0 };
  } catch { return { pasteis: 0, materias: 0 }; }
}

async function getFiados(): Promise<Fiado[]> {
  try {
    const res = await fetch(`${API_URL}/pedidos/fiados`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function diasAte(data: string): number {
  const deadlineStr = data.split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];
  const deadline = new Date(deadlineStr + "T00:00:00.000Z");
  const today = new Date(todayStr + "T00:00:00.000Z");
  return Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AdminDashboard(): Promise<JSX.Element> {
  const [stats, counts, todosOsFiados] = await Promise.all([getStats(), getCounts(), getFiados()]);

  const margemMes = stats && stats.mes.faturamento > 0
    ? (stats.mes.lucro / stats.mes.faturamento) * 100
    : 0;

  const fiadosPendentes = todosOsFiados.filter((f) => !f.fiadoPago);
  const fiadosVencidos = fiadosPendentes.filter(
    (f) => f.previsaoPagamento && diasAte(f.previsaoPagamento) <= 0,
  );
  const totalFiado = fiadosPendentes.reduce((a, f) => a + Number(f.total), 0);

  const cards: { label: string; value: number; Icon: IconType; href: string; warn: boolean }[] = [
    { label: "Pastéis cadastrados", value: counts.pasteis,              Icon: LuChefHat,       href: "/admin/pasteis",         warn: false },
    { label: "Pedidos hoje",         value: stats?.hoje.pedidos ?? 0,   Icon: LuReceipt,       href: "/admin/pedidos",         warn: false },
    { label: "Fiados pendentes",     value: fiadosPendentes.length,     Icon: LuNotebook,      href: "/admin/fiados",          warn: fiadosVencidos.length > 0 },
    { label: "Alertas estoque",      value: stats?.estoqueAlerta.length ?? 0, Icon: LuTriangleAlert, href: "/admin/materias-primas", warn: (stats?.estoqueAlerta.length ?? 0) > 0 },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mb-8 text-sm" style={{ color: "#71717a" }}>Visão geral da Pastelaria Alemão</p>

      {/* Cards principais */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.Icon;
          return (
            <Link key={card.label} href={card.href}
              className="rounded-xl p-5 transition-colors"
              style={{
                backgroundColor: "#111113",
                border: `1px solid ${card.warn && card.value > 0 ? "rgba(239,68,68,0.3)" : "#1e1e22"}`,
              }}>
              <div className="mb-2" style={{ color: card.warn && card.value > 0 ? "#ef4444" : "#52525b" }}>
                <Icon size={20} />
              </div>
              <div className="text-3xl font-black" style={{ color: card.warn && card.value > 0 ? "#ef4444" : "#f4f4f5" }}>{card.value}</div>
              <div className="mt-1 text-xs" style={{ color: "#52525b" }}>{card.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Relatório financeiro */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Hoje */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22" }}>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "#3f3f46" }}>Hoje</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Faturamento</div>
              <div className="text-xl font-black" style={{ color: "#eab308" }}>R$ {fmt(stats?.hoje.faturamento ?? 0)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Custo ingredientes</div>
              <div className="text-xl font-black" style={{ color: "#f87171" }}>R$ {fmt(stats?.hoje.custo ?? 0)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Lucro bruto</div>
              <div className="text-xl font-black" style={{ color: (stats?.hoje.lucro ?? 0) >= 0 ? "#22c55e" : "#f87171" }}>
                R$ {fmt(stats?.hoje.lucro ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Pedidos</div>
              <div className="text-xl font-black">{stats?.hoje.pedidos ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Mês */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22" }}>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "#3f3f46" }}>Este mês</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Faturamento</div>
              <div className="text-xl font-black" style={{ color: "#eab308" }}>R$ {fmt(stats?.mes.faturamento ?? 0)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Custo ingredientes</div>
              <div className="text-xl font-black" style={{ color: "#f87171" }}>R$ {fmt(stats?.mes.custo ?? 0)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Lucro bruto</div>
              <div className="text-xl font-black" style={{ color: (stats?.mes.lucro ?? 0) >= 0 ? "#22c55e" : "#f87171" }}>
                R$ {fmt(stats?.mes.lucro ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Margem</div>
              <div className="text-xl font-black" style={{ color: margemMes >= 0 ? "#22c55e" : "#f87171" }}>
                {margemMes.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Faturamento por período */}
      <DashboardFiltro />

      {/* Top pasteis + Estoque alerta + Fiados vencidos */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Top pasteis */}
        <div className="rounded-xl" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #1a1a1e" }}>
            <h2 className="text-sm font-semibold">Top Pastéis do mês</h2>
          </div>
          {!stats?.topPasteis.length ? (
            <div className="py-10 text-center text-sm" style={{ color: "#3f3f46" }}>Sem vendas ainda.</div>
          ) : (
            <div>
              {stats.topPasteis.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3" style={{ borderTop: i === 0 ? "none" : "1px solid #1a1a1e" }}>
                  <span className="text-xs font-bold" style={{ color: "#3f3f46", width: "1rem" }}>{i + 1}</span>
                  <span className="flex-1 text-sm">{p.nome}</span>
                  <span className="text-xs" style={{ color: "#52525b" }}>{p.quantidade}×</span>
                  <span className="text-sm font-semibold" style={{ color: "#eab308" }}>R$ {fmt(p.faturamento)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estoque em alerta */}
        <div className="rounded-xl" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #1a1a1e" }}>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <LuTriangleAlert size={14} style={{ color: "#f97316" }} />
              Estoque em alerta
            </h2>
          </div>
          {!stats?.estoqueAlerta.length ? (
            <div className="py-10 text-center text-sm" style={{ color: "#22c55e" }}>✓ Todos OK</div>
          ) : (
            <div>
              {stats.estoqueAlerta.map((mp, i) => (
                <div key={mp.id} className="flex items-center justify-between px-5 py-3" style={{ borderTop: i === 0 ? "none" : "1px solid #1a1a1e" }}>
                  <span className="text-sm">{mp.nome}</span>
                  <span className="text-sm font-semibold" style={{ color: mp.estoque <= mp.estoqueMinimo ? "#ef4444" : "#f97316" }}>
                    {mp.estoque <= 0 ? "Sem estoque" : mp.unidade === "UNIDADE" ? `${mp.estoque.toFixed(0)} un` : `${mp.estoque.toFixed(0)}g`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fiados vencidos */}
        <div className="rounded-xl" style={{
          backgroundColor: "#111113",
          border: `1px solid ${fiadosVencidos.length > 0 ? "rgba(239,68,68,0.3)" : "#1e1e22"}`,
        }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${fiadosVencidos.length > 0 ? "rgba(239,68,68,0.15)" : "#1a1a1e"}` }}>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold">
                <LuNotebook size={14} style={{ color: "#52525b" }} />
                Fiados vencidos
              </h2>
              {totalFiado > 0 && (
                <span className="text-xs font-semibold" style={{ color: "#eab308" }}>R$ {fmt(totalFiado)} pendente</span>
              )}
            </div>
          </div>
          {fiadosVencidos.length === 0 ? (
            <div className="py-10 text-center text-sm" style={{ color: "#22c55e" }}>✓ Nenhum vencido</div>
          ) : (
            <div>
              {fiadosVencidos.map((f, i) => {
                const diasVencido = Math.abs(diasAte(f.previsaoPagamento!));
                return (
                  <div key={f.id} className="px-5 py-3" style={{ borderTop: i === 0 ? "none" : "1px solid #1a1a1e" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{f.nomeCliente ?? "—"}</span>
                      <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>R$ {fmt(Number(f.total))}</span>
                    </div>
                    <div className="mt-0.5 text-xs" style={{ color: "#ef4444", opacity: 0.7 }}>
                      Vencido há {diasVencido} dia{diasVencido !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
              <div className="px-5 py-3" style={{ borderTop: "1px solid #1a1a1e" }}>
                <Link href="/admin/fiados" className="text-xs font-medium" style={{ color: "#52525b" }}>
                  Ver todos os fiados →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
