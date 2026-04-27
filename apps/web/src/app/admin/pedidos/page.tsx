"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api";
import type { Pastel } from "@pastelaria/types";
import {
  LuBanknote, LuSmartphone, LuCreditCard, LuNotebook,
  LuRefreshCw, LuReceipt, LuFileText,
} from "react-icons/lu";
import type { IconType } from "react-icons";

type MetodoPagamento = "DINHEIRO" | "PIX" | "CARTAO_DEBITO" | "CARTAO_CREDITO" | "FIADO";
type StatusPedido = "PENDENTE" | "EM_PREPARO" | "PRONTO" | "ENTREGUE" | "CANCELADO";

interface ItemPedido { id: string; quantidade: number; precoUnit: number; pastel: { nome: string } }
interface Pedido {
  id: string; status: StatusPedido; total: number; observacao: string | null;
  metodoPagamento: MetodoPagamento; nomeCliente: string | null; createdAt: string;
  fiadoPago: boolean;
  itens: ItemPedido[];
}
interface ClienteOpcao { id: string; nome: string; }

const STATUS_LABEL: Record<StatusPedido, string> = {
  PENDENTE: "Pendente", EM_PREPARO: "Em preparo", PRONTO: "Pronto",
  ENTREGUE: "Entregue", CANCELADO: "Cancelado",
};
const STATUS_COLOR: Record<StatusPedido, string> = {
  PENDENTE: "#eab308", EM_PREPARO: "#3b82f6", PRONTO: "#22c55e",
  ENTREGUE: "#71717a", CANCELADO: "#ef4444",
};
const METODO_LABEL: Record<MetodoPagamento, string> = {
  DINHEIRO: "Dinheiro", PIX: "Pix",
  CARTAO_DEBITO: "Débito", CARTAO_CREDITO: "Crédito",
  FIADO: "Fiado",
};
const METODO_ICON: Record<MetodoPagamento, IconType> = {
  DINHEIRO: LuBanknote, PIX: LuSmartphone,
  CARTAO_DEBITO: LuCreditCard, CARTAO_CREDITO: LuCreditCard,
  FIADO: LuNotebook,
};
const METODOS: MetodoPagamento[] = ["DINHEIRO", "PIX", "CARTAO_DEBITO", "CARTAO_CREDITO", "FIADO"];
const STATUS_PROXIMOS: Partial<Record<StatusPedido, StatusPedido>> = {
  PENDENTE: "EM_PREPARO", EM_PREPARO: "PRONTO", PRONTO: "ENTREGUE",
};
const POR_PAGINA = 20;

// ─── Combobox de cliente ──────────────────────────────────────────────────────
function ClienteCombobox({
  value,
  onChange,
}: {
  value: ClienteOpcao | null;
  onChange: (v: ClienteOpcao | null) => void;
}) {
  const [query, setQuery] = useState(value?.nome ?? "");
  const [opcoes, setOpcoes] = useState<ClienteOpcao[]>([]);
  const [open, setOpen] = useState(false);
  const [criando, setCriando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setQuery(value?.nome ?? ""); }, [value]);

  useEffect(() => {
    if (query.length < 1) { setOpcoes([]); return; }
    const t = setTimeout(async () => {
      try {
        const data = await apiFetch<ClienteOpcao[]>(`/clientes?nome=${encodeURIComponent(query)}`);
        setOpcoes(data);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const exactMatch = opcoes.some((c) => c.nome.toLowerCase() === query.trim().toLowerCase());
  const showCreate = !exactMatch && query.trim().length >= 2;

  async function criar() {
    setCriando(true);
    try {
      const novo = await apiFetch<ClienteOpcao>("/clientes", {
        method: "POST",
        body: JSON.stringify({ nome: query.trim() }),
      });
      onChange(novo);
      setOpen(false);
    } finally { setCriando(false); }
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(null); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Nome do cliente…"
        required
      />
      {open && query.length >= 1 && (opcoes.length > 0 || showCreate) && (
        <div style={{
          position: "absolute", zIndex: 200, top: "calc(100% + 4px)", left: 0, right: 0,
          backgroundColor: "#18181c", border: "1px solid #2e2e34", borderRadius: "8px",
          overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          {opcoes.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => { onChange(c); setQuery(c.nome); setOpen(false); }}
              style={{
                display: "block", width: "100%", padding: "10px 14px",
                textAlign: "left", color: "#f4f4f5", fontSize: "14px",
                borderBottom: "1px solid #27272a",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#27272a")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {c.nome}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={criar}
              disabled={criando}
              style={{
                display: "block", width: "100%", padding: "10px 14px",
                textAlign: "left", color: "#22c55e", fontSize: "14px", fontWeight: 700,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#27272a")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {criando ? "Criando…" : `+ Criar "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
interface ItemForm { pastelId: string; quantidade: number }

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pasteis, setPasteis] = useState<Pastel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | "TODOS">("TODOS");
  const [pagina, setPagina] = useState(1);

  const [itens, setItens] = useState<ItemForm[]>([{ pastelId: "", quantidade: 1 }]);
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("DINHEIRO");
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteOpcao | null>(null);
  const [observacao, setObservacao] = useState("");

  const carregar = useCallback(async () => {
    const [p, m] = await Promise.all([
      apiFetch<Pedido[]>("/pedidos"),
      apiFetch<Pastel[]>("/pasteis"),
    ]);
    setPedidos(p);
    setPasteis(m);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(1); }, [filtroStatus]);

  function addItem() { setItens((prev) => [...prev, { pastelId: "", quantidade: 1 }]); }
  function removeItem(i: number) { setItens((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, field: keyof ItemForm, value: string | number) {
    setItens((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  const totalForm = itens.reduce((acc, item) => {
    const p = pasteis.find((p) => p.id === item.pastelId);
    return acc + (p ? Number(p.preco) * item.quantidade : 0);
  }, 0);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const validItems = itens.filter((i) => i.pastelId && i.quantidade > 0);
    if (!validItems.length) return;
    if (metodoPagamento === "FIADO" && !clienteSelecionado) return;
    setLoading(true);
    try {
      await apiFetch("/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: validItems,
          metodoPagamento,
          observacao: observacao || undefined,
          clienteId: metodoPagamento === "FIADO" ? clienteSelecionado?.id : undefined,
          nomeCliente: metodoPagamento === "FIADO" ? clienteSelecionado?.nome : undefined,
        }),
      });
      setItens([{ pastelId: "", quantidade: 1 }]);
      setObservacao("");
      setClienteSelecionado(null);
      setMetodoPagamento("DINHEIRO");
      setShowForm(false);
      await carregar();
    } finally { setLoading(false); }
  }

  async function avancarStatus(id: string, novoStatus: StatusPedido) {
    await apiFetch(`/pedidos/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: novoStatus }) });
    await carregar();
  }

  async function cancelar(id: string) {
    if (!confirm("Cancelar este pedido?")) return;
    await apiFetch(`/pedidos/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: "CANCELADO" }) });
    await carregar();
  }

  const pedidosFiltrados = filtroStatus === "TODOS"
    ? pedidos
    : pedidos.filter((p) => p.status === filtroStatus);

  const totalPaginas = Math.max(1, Math.ceil(pedidosFiltrados.length / POR_PAGINA));
  const pedidosPaginados = pedidosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const ativos = pedidos.filter((p) => !["ENTREGUE", "CANCELADO"].includes(p.status));
  const totalHoje = pedidos
    .filter((p) => {
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      return new Date(p.createdAt) >= hoje && p.status !== "CANCELADO";
    })
    .reduce((a, p) => a + Number(p.total), 0);

  const resumoCards = [
    { label: "Pedidos ativos",  value: ativos.length,                                          Icon: LuRefreshCw },
    { label: "Total hoje",      value: `R$ ${totalHoje.toFixed(2)}`,                           Icon: LuBanknote  },
    { label: "Total pedidos",   value: pedidos.filter((p) => p.status !== "CANCELADO").length, Icon: LuReceipt   },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight">Caixa / Pedidos</h1>
          <p className="text-sm" style={{ color: "#71717a" }}>Registre pedidos e acompanhe o status.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: "#dc2626", color: "white" }}>
            + Novo Pedido
          </button>
        )}
      </div>

      {/* Cards resumo */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {resumoCards.map((c) => {
          const Icon = c.Icon;
          return (
            <div key={c.label} className="rounded-xl p-4" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22" }}>
              <div style={{ color: "#52525b" }}><Icon size={20} /></div>
              <div className="mt-1 text-xl font-black">{c.value}</div>
              <div className="text-xs" style={{ color: "#71717a" }}>{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* Formulário novo pedido */}
      {showForm && (
        <div className="mb-6 rounded-xl p-6" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Novo Pedido</h2>
            <button onClick={() => setShowForm(false)} className="text-sm" style={{ color: "#71717a" }}>✕ Cancelar</button>
          </div>
          <form onSubmit={salvar}>
            <div className="mb-4 flex flex-col gap-3">
              {itens.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <select value={item.pastelId} onChange={(e) => updateItem(i, "pastelId", e.target.value)}
                    style={{ flex: 1 }} required>
                    <option value="">Selecionar pastel…</option>
                    {pasteis.filter((p) => p.disponivel).map((p) => (
                      <option key={p.id} value={p.id}>{p.nome} — R$ {Number(p.preco).toFixed(2)}</option>
                    ))}
                  </select>
                  <input type="number" min="1" value={item.quantidade}
                    onChange={(e) => updateItem(i, "quantidade", parseInt(e.target.value) || 1)}
                    style={{ width: "70px" }} />
                  {itens.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)}
                      style={{ color: "#ef4444", fontSize: "1.1rem", lineHeight: 1 }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={addItem} className="mb-4 text-sm" style={{ color: "#71717a" }}>
              + Adicionar item
            </button>

            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "#a1a1aa" }}>Pagamento</label>
                <select value={metodoPagamento} onChange={(e) => {
                  setMetodoPagamento(e.target.value as MetodoPagamento);
                  setClienteSelecionado(null);
                }}>
                  {METODOS.map((m) => <option key={m} value={m}>{METODO_LABEL[m]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "#a1a1aa" }}>Observação</label>
                <input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex: sem cebola" />
              </div>
            </div>

            {metodoPagamento === "FIADO" && (
              <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)" }}>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium" style={{ color: "#ca8a04" }}>
                  <LuNotebook size={12} />
                  Cliente (fiado)
                </label>
                <ClienteCombobox value={clienteSelecionado} onChange={setClienteSelecionado} />
                {clienteSelecionado && (
                  <p className="mt-1.5 text-xs" style={{ color: "#ca8a04" }}>
                    ✓ Cliente vinculado: <strong>{clienteSelecionado.nome}</strong>
                  </p>
                )}
                {!clienteSelecionado && (
                  <p className="mt-1.5 text-xs" style={{ color: "#713f12" }}>
                    Digite o nome — selecione um existente ou crie um novo.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-lg font-black">
                Total: <span style={{ color: "#eab308" }}>R$ {totalForm.toFixed(2)}</span>
              </div>
              <button type="submit" disabled={loading || (metodoPagamento === "FIADO" && !clienteSelecionado)}
                className="rounded-lg px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#dc2626", color: "white" }}>
                {loading ? "Salvando…" : "Registrar Pedido"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["TODOS", "PENDENTE", "EM_PREPARO", "PRONTO", "ENTREGUE", "CANCELADO"] as const).map((s) => (
          <button key={s} onClick={() => setFiltroStatus(s)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-all"
            style={{
              backgroundColor: filtroStatus === s ? "#dc2626" : "#1e1e22",
              color: filtroStatus === s ? "white" : "#71717a",
              border: "1px solid",
              borderColor: filtroStatus === s ? "#dc2626" : "#2e2e34",
            }}>
            {s === "TODOS" ? "Todos" : STATUS_LABEL[s]}
            {s !== "TODOS" && (
              <span className="ml-1" style={{ opacity: 0.6 }}>
                ({pedidos.filter((p) => p.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista de pedidos */}
      <div className="flex flex-col gap-3">
        {pedidosFiltrados.length === 0 ? (
          <div className="rounded-xl py-16 text-center text-sm" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22", color: "#3f3f46" }}>
            Nenhum pedido encontrado.
          </div>
        ) : (
          pedidosPaginados.map((pedido) => {
            const proximo = STATUS_PROXIMOS[pedido.status];
            const isFiado = pedido.metodoPagamento === "FIADO";
            const MetodoIcon = METODO_ICON[pedido.metodoPagamento];
            return (
              <div key={pedido.id} className="rounded-xl p-5" style={{
                backgroundColor: "#111113",
                border: `1px solid ${isFiado && !pedido.fiadoPago ? "rgba(234,179,8,0.25)" : "#1e1e22"}`,
              }}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs" style={{ color: "#3f3f46" }}>#{pedido.id.slice(-6).toUpperCase()}</span>
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: `${STATUS_COLOR[pedido.status]}18`, color: STATUS_COLOR[pedido.status] }}>
                        {STATUS_LABEL[pedido.status]}
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: isFiado ? "#ca8a04" : "#52525b" }}>
                        <MetodoIcon size={11} />
                        {METODO_LABEL[pedido.metodoPagamento]}
                      </span>
                      {isFiado && pedido.fiadoPago && (
                        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                          ✓ Pago
                        </span>
                      )}
                    </div>
                    {isFiado && pedido.nomeCliente && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs font-medium" style={{ color: "#eab308" }}>
                        <LuNotebook size={11} />
                        {pedido.nomeCliente}
                      </div>
                    )}
                    <div className="mt-0.5 text-xs" style={{ color: "#3f3f46" }}>
                      {new Date(pedido.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black" style={{ color: "#eab308" }}>R$ {Number(pedido.total).toFixed(2)}</div>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  {pedido.itens.map((item) => (
                    <span key={item.id} className="rounded px-2 py-1 text-xs"
                      style={{ backgroundColor: "#1a1a1e", color: "#71717a" }}>
                      {item.quantidade}× {item.pastel.nome}
                    </span>
                  ))}
                </div>

                {pedido.observacao && (
                  <p className="mb-3 flex items-center gap-1 text-xs" style={{ color: "#52525b" }}>
                    <LuFileText size={11} />
                    {pedido.observacao}
                  </p>
                )}

                {pedido.status !== "ENTREGUE" && pedido.status !== "CANCELADO" && (
                  <div className="flex gap-2">
                    {proximo && (
                      <button onClick={() => avancarStatus(pedido.id, proximo)}
                        className="rounded-md px-3 py-1.5 text-xs font-medium"
                        style={{ backgroundColor: "#dc2626", color: "white" }}>
                        → {STATUS_LABEL[proximo]}
                      </button>
                    )}
                    <button onClick={() => cancelar(pedido.id)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium"
                      style={{ backgroundColor: "#1e1e22", color: "#52525b", border: "1px solid #2e2e34" }}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setPagina((p) => p - 1)}
            disabled={pagina === 1}
            className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30"
            style={{ backgroundColor: "#1e1e22", color: "#a1a1aa", border: "1px solid #2e2e34" }}
          >
            ← Anterior
          </button>
          <span className="text-sm" style={{ color: "#52525b" }}>
            Página <span style={{ color: "#f4f4f5", fontWeight: 700 }}>{pagina}</span> de {totalPaginas}
            <span className="ml-2" style={{ color: "#3f3f46" }}>({pedidosFiltrados.length} pedidos)</span>
          </span>
          <button
            onClick={() => setPagina((p) => p + 1)}
            disabled={pagina === totalPaginas}
            className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-30"
            style={{ backgroundColor: "#1e1e22", color: "#a1a1aa", border: "1px solid #2e2e34" }}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
