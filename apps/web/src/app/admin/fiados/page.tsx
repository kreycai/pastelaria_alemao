"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { LuNotebook, LuBanknote, LuCircleAlert, LuTriangleAlert, LuCalendar, LuX } from "react-icons/lu";

interface ItemPedido { id: string; quantidade: number; pastel: { nome: string } }
interface Fiado {
  id: string;
  total: number;
  clienteId: string | null;
  nomeCliente: string | null;
  previsaoPagamento: string | null;
  fiadoPago: boolean;
  fiadoPagoEm: string | null;
  createdAt: string;
  itens: ItemPedido[];
}

interface GrupoCliente {
  chave: string;
  nome: string;
  total: number;
  count: number;
  vencidos: number;
}

function diasDesde(data: string) {
  return Math.floor((Date.now() - new Date(data).getTime()) / (1000 * 60 * 60 * 24));
}

function diasAte(data: string): number {
  const deadline = new Date(data.split("T")[0] + "T00:00:00.000Z");
  const today = new Date(new Date().toISOString().split("T")[0] + "T00:00:00.000Z");
  return Math.round((deadline.getTime() - today.getTime()) / 86400000);
}

function StatusDias({ fiado }: { fiado: Fiado }) {
  const dias = diasDesde(fiado.createdAt);
  const temPrevisao = !!fiado.previsaoPagamento;
  const vencido = temPrevisao && diasAte(fiado.previsaoPagamento!) <= 0;
  const urgente = temPrevisao && !vencido && diasAte(fiado.previsaoPagamento!) <= 3;

  if (vencido) {
    const diasVencido = Math.abs(diasAte(fiado.previsaoPagamento!));
    return (
      <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
        <LuCircleAlert size={11} />
        Vencido há {diasVencido}d
      </span>
    );
  }
  if (urgente) {
    return (
      <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ backgroundColor: "rgba(249,115,22,0.12)", color: "#f97316" }}>
        <LuTriangleAlert size={11} />
        Vence em {diasAte(fiado.previsaoPagamento!)}d
      </span>
    );
  }
  return (
    <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: "rgba(113,113,122,0.12)", color: "#71717a" }}>
      {dias === 0 ? "Hoje" : `${dias}d atrás`}
    </span>
  );
}

export default function FiadosPage() {
  const [fiados, setFiados] = useState<Fiado[]>([]);
  const [filtro, setFiltro] = useState<"PENDENTE" | "PAGO">("PENDENTE");
  const [clienteFiltro, setClienteFiltro] = useState<string | null>(null);
  const [editandoPrevisao, setEditandoPrevisao] = useState<string | null>(null);
  const [novaPrevisao, setNovaPrevisao] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const data = await apiFetch<Fiado[]>("/pedidos/fiados");
    setFiados(data);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setClienteFiltro(null); }, [filtro]);

  async function marcarPago(id: string) {
    if (!confirm("Confirmar recebimento deste fiado?")) return;
    setLoadingId(id);
    try {
      await apiFetch(`/pedidos/${id}/pagar-fiado`, { method: "PATCH" });
      await carregar();
    } finally { setLoadingId(null); }
  }

  async function salvarPrevisao(id: string) {
    setLoadingId(id);
    try {
      await apiFetch(`/pedidos/${id}/previsao`, {
        method: "PATCH",
        body: JSON.stringify({ previsaoPagamento: novaPrevisao || null }),
      });
      setEditandoPrevisao(null);
      await carregar();
    } finally { setLoadingId(null); }
  }

  const pendentes = fiados.filter((f) => !f.fiadoPago);
  const pagos = fiados.filter((f) => f.fiadoPago);
  const listaBase = filtro === "PENDENTE" ? pendentes : pagos;

  const totalPendente = pendentes.reduce((a, f) => a + Number(f.total), 0);
  const vencidos = pendentes.filter((f) => f.previsaoPagamento && diasAte(f.previsaoPagamento) <= 0);

  // Agrupar pendentes por cliente para os chips
  const gruposCliente = useMemo<GrupoCliente[]>(() => {
    const map = new Map<string, GrupoCliente>();
    pendentes.forEach((f) => {
      const chave = f.clienteId ?? f.nomeCliente ?? "—";
      const nome = f.nomeCliente ?? "—";
      const g = map.get(chave) ?? { chave, nome, total: 0, count: 0, vencidos: 0 };
      g.total += Number(f.total);
      g.count += 1;
      if (f.previsaoPagamento && diasAte(f.previsaoPagamento) <= 0) g.vencidos += 1;
      map.set(chave, g);
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [pendentes]);

  const lista = clienteFiltro
    ? listaBase.filter((f) => (f.clienteId ?? f.nomeCliente ?? "—") === clienteFiltro)
    : listaBase;

  const clienteFiltroInfo = clienteFiltro ? gruposCliente.find((g) => g.chave === clienteFiltro) : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
          <LuNotebook size={22} />
          Fiados
        </h1>
        <p className="text-sm" style={{ color: "#71717a" }}>
          Acompanhe quem está devendo e controle os recebimentos.
        </p>
      </div>

      {/* Cards resumo */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl p-4" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22" }}>
          <div style={{ color: "#52525b" }}><LuNotebook size={20} /></div>
          <div className="mt-1 text-xl font-black">{pendentes.length}</div>
          <div className="text-xs" style={{ color: "#71717a" }}>Fiados pendentes</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: "#111113", border: "1px solid rgba(234,179,8,0.2)" }}>
          <div style={{ color: "#eab308" }}><LuBanknote size={20} /></div>
          <div className="mt-1 text-xl font-black" style={{ color: "#eab308" }}>R$ {totalPendente.toFixed(2)}</div>
          <div className="text-xs" style={{ color: "#71717a" }}>Total a receber</div>
        </div>
        <div className="rounded-xl p-4" style={{
          backgroundColor: vencidos.length > 0 ? "rgba(239,68,68,0.06)" : "#111113",
          border: `1px solid ${vencidos.length > 0 ? "rgba(239,68,68,0.25)" : "#1e1e22"}`,
        }}>
          <div style={{ color: vencidos.length > 0 ? "#ef4444" : "#52525b" }}><LuCircleAlert size={20} /></div>
          <div className="mt-1 text-xl font-black" style={{ color: vencidos.length > 0 ? "#ef4444" : "#f4f4f5" }}>{vencidos.length}</div>
          <div className="text-xs" style={{ color: "#71717a" }}>Vencidos</div>
        </div>
      </div>

      {/* Filtro pendente/pago */}
      <div className="mb-4 flex gap-2">
        {(["PENDENTE", "PAGO"] as const).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
            style={{
              backgroundColor: filtro === f ? (f === "PENDENTE" ? "#eab308" : "#22c55e") : "#1e1e22",
              color: filtro === f ? (f === "PENDENTE" ? "#422006" : "#052e16") : "#71717a",
              border: "1px solid",
              borderColor: filtro === f ? "transparent" : "#2e2e34",
            }}>
            {f === "PENDENTE" ? `Pendentes (${pendentes.length})` : `Pagos (${pagos.length})`}
          </button>
        ))}
      </div>

      {/* Chips de cliente — só em Pendentes */}
      {filtro === "PENDENTE" && gruposCliente.length > 1 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium" style={{ color: "#52525b" }}>Filtrar por cliente:</p>
          <div className="flex flex-wrap gap-2">
            {gruposCliente.map((g) => {
              const ativo = clienteFiltro === g.chave;
              return (
                <button
                  key={g.chave}
                  onClick={() => setClienteFiltro(ativo ? null : g.chave)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: ativo ? "rgba(234,179,8,0.15)" : "#1a1a1e",
                    border: `1px solid ${ativo ? "rgba(234,179,8,0.4)" : "#2e2e34"}`,
                    color: ativo ? "#eab308" : "#a1a1aa",
                  }}
                >
                  {g.nome}
                  <span style={{ opacity: 0.7 }}>
                    · R$ {Number(g.total).toFixed(2)}
                  </span>
                  {g.vencidos > 0 && (
                    <span className="rounded-full px-1.5 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: "rgba(239,68,68,0.2)", color: "#ef4444", fontSize: "10px" }}>
                      {g.vencidos} venc.
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner do cliente filtrado */}
      {clienteFiltroInfo && (
        <div className="mb-4 flex items-center justify-between rounded-xl px-4 py-3"
          style={{ backgroundColor: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
          <div>
            <span className="font-semibold" style={{ color: "#eab308" }}>{clienteFiltroInfo.nome}</span>
            <span className="ml-3 text-sm" style={{ color: "#71717a" }}>
              {clienteFiltroInfo.count} pedido{clienteFiltroInfo.count !== 1 ? "s" : ""}
              {" · "}
              <strong style={{ color: "#eab308" }}>R$ {clienteFiltroInfo.total.toFixed(2)}</strong> pendente
            </span>
          </div>
          <button onClick={() => setClienteFiltro(null)} style={{ color: "#52525b" }}>
            <LuX size={16} />
          </button>
        </div>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {lista.length === 0 ? (
          <div className="rounded-xl py-16 text-center text-sm" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22", color: "#3f3f46" }}>
            {filtro === "PENDENTE" ? "Nenhum fiado pendente." : "Nenhum fiado pago ainda."}
          </div>
        ) : (
          lista.map((fiado) => {
            const dias = diasDesde(fiado.createdAt);
            const vencido = fiado.previsaoPagamento && !fiado.fiadoPago && diasAte(fiado.previsaoPagamento) <= 0;
            return (
              <div key={fiado.id} className="rounded-xl p-5" style={{
                backgroundColor: "#111113",
                border: `1px solid ${vencido ? "rgba(239,68,68,0.3)" : fiado.fiadoPago ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.2)"}`,
              }}>
                <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-base font-bold" style={{ color: fiado.fiadoPago ? "#71717a" : "#f4f4f5" }}>
                        {fiado.nomeCliente ?? "—"}
                      </span>
                      {fiado.fiadoPago ? (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                          ✓ Pago
                        </span>
                      ) : (
                        <StatusDias fiado={fiado} />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: "#52525b" }}>
                      <span>Pedido em {new Date(fiado.createdAt).toLocaleDateString("pt-BR")}</span>
                      <span>Deve há <strong style={{ color: fiado.fiadoPago ? "#52525b" : "#a1a1aa" }}>{dias} dia{dias !== 1 ? "s" : ""}</strong></span>
                      {fiado.fiadoPagoEm && (
                        <span>Pago em {new Date(fiado.fiadoPagoEm).toLocaleDateString("pt-BR")}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black" style={{ color: fiado.fiadoPago ? "#71717a" : "#eab308" }}>
                      R$ {Number(fiado.total).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {fiado.itens.map((item) => (
                    <span key={item.id} className="rounded px-2 py-0.5 text-xs"
                      style={{ backgroundColor: "#1a1a1e", color: "#71717a" }}>
                      {item.quantidade}× {item.pastel.nome}
                    </span>
                  ))}
                </div>

                {!fiado.fiadoPago && (
                  <div className="mb-3">
                    {editandoPrevisao === fiado.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={novaPrevisao}
                          onChange={(e) => setNovaPrevisao(e.target.value)}
                          style={{ width: "auto", flex: "0 0 auto" }}
                          min={new Date().toISOString().split("T")[0]}
                        />
                        <button onClick={() => salvarPrevisao(fiado.id)}
                          disabled={loadingId === fiado.id}
                          className="rounded-md px-3 py-1.5 text-xs font-semibold"
                          style={{ backgroundColor: "#dc2626", color: "white" }}>
                          {loadingId === fiado.id ? "…" : "Salvar"}
                        </button>
                        <button onClick={() => setEditandoPrevisao(null)}
                          className="rounded-md px-2 py-1.5 text-xs"
                          style={{ backgroundColor: "#1e1e22", color: "#71717a" }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditandoPrevisao(fiado.id);
                          setNovaPrevisao(fiado.previsaoPagamento ? fiado.previsaoPagamento.split("T")[0] : "");
                        }}
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: fiado.previsaoPagamento ? "#71717a" : "#52525b" }}>
                        <LuCalendar size={11} />
                        {fiado.previsaoPagamento
                          ? `Previsão: ${new Date(fiado.previsaoPagamento).toLocaleDateString("pt-BR")} — alterar`
                          : "Definir previsão de pagamento"}
                      </button>
                    )}
                  </div>
                )}

                {!fiado.fiadoPago && (
                  <button
                    onClick={() => marcarPago(fiado.id)}
                    disabled={loadingId === fiado.id}
                    className="rounded-md px-4 py-2 text-xs font-semibold disabled:opacity-50"
                    style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
                    {loadingId === fiado.id ? "Salvando…" : "✓ Marcar como pago"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
