"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Unidade = "KG" | "UNIDADE";

interface MateriaPrima {
  id: string;
  nome: string;
  unidade: Unidade;
  precoKg: number;
  estoqueGramas: number;
  estoqueMinimo: number;
  createdAt: string;
  updatedAt: string;
}

function formatEstoque(gramas: number, unidade: Unidade) {
  if (unidade === "UNIDADE") return `${Number(gramas).toFixed(0)} un`;
  if (gramas >= 1000) return `${(gramas / 1000).toFixed(2).replace(/\.?0+$/, "")} kg`;
  return `${Number(gramas).toFixed(0)} g`;
}

export default function MateriasPrimasPage() {
  const [lista, setLista] = useState<MateriaPrima[]>([]);
  const [nome, setNome] = useState("");
  const [unidade, setUnidade] = useState<Unidade>("KG");
  const [precoKg, setPrecoKg] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("0");
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState<MateriaPrima | null>(null);

  const [estoqueModal, setEstoqueModal] = useState<MateriaPrima | null>(null);
  const [ajusteQtd, setAjusteQtd] = useState("");
  const [loadingEstoque, setLoadingEstoque] = useState(false);

  async function carregar() {
    const data = await apiFetch<MateriaPrima[]>("/materias-primas");
    setLista(data);
  }

  useEffect(() => { carregar(); }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        nome,
        unidade,
        precoKg: parseFloat(precoKg),
        estoqueMinimo: parseFloat(estoqueMinimo) || 0,
      };
      if (editando) {
        await apiFetch(`/materias-primas/${editando.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch("/materias-primas", { method: "POST", body: JSON.stringify(body) });
      }
      setNome(""); setPrecoKg(""); setUnidade("KG"); setEstoqueMinimo("0"); setEditando(null);
      await carregar();
    } finally { setLoading(false); }
  }

  function iniciarEdicao(mp: MateriaPrima) {
    setEditando(mp);
    setNome(mp.nome);
    setUnidade(mp.unidade);
    setPrecoKg(String(mp.precoKg));
    setEstoqueMinimo(String(mp.estoqueMinimo));
  }

  function cancelar() { setEditando(null); setNome(""); setPrecoKg(""); setUnidade("KG"); setEstoqueMinimo("0"); }

  async function remover(id: string) {
    if (!confirm("Remover esta matéria-prima?")) return;
    await apiFetch(`/materias-primas/${id}`, { method: "DELETE" });
    await carregar();
  }

  async function ajustarEstoque(e: React.FormEvent) {
    e.preventDefault();
    if (!estoqueModal) return;
    setLoadingEstoque(true);
    try {
      await apiFetch(`/materias-primas/${estoqueModal.id}/estoque`, {
        method: "PATCH",
        body: JSON.stringify({ quantidade: parseFloat(ajusteQtd) }),
      });
      setEstoqueModal(null);
      setAjusteQtd("");
      await carregar();
    } finally { setLoadingEstoque(false); }
  }

  function estoqueStatus(mp: MateriaPrima) {
    const atual = Number(mp.estoqueGramas);
    const minimo = Number(mp.estoqueMinimo);
    if (atual <= minimo) return { label: "Crítico", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
    const limiarBaixo = mp.unidade === "UNIDADE" ? Math.max(minimo + 2, 3) : Math.max(minimo + 200, 500);
    if (atual < limiarBaixo) return { label: "Baixo", color: "#f97316", bg: "rgba(249,115,22,0.1)" };
    return { label: "OK", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  }

  const precoLabel = unidade === "KG" ? "Preço por kg (R$)" : "Preço por unidade (R$)";
  const minimoLabel = unidade === "KG" ? "Estoque mínimo (g)" : "Estoque mínimo (unidades)";

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Matérias-primas</h1>
        <p className="text-sm" style={{ color: "#71717a" }}>
          Cadastre ingredientes com preço, unidade e controle de estoque mínimo.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Formulário */}
        <div className="rounded-xl p-6" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
          <h2 className="mb-5 text-base font-semibold">
            {editando ? "Editar Matéria-prima" : "Nova Matéria-prima"}
          </h2>
          <form onSubmit={salvar} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "#a1a1aa" }}>Nome</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Frango desfiado" required />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "#a1a1aa" }}>Unidade de medida</label>
              <select value={unidade} onChange={(e) => setUnidade(e.target.value as Unidade)}>
                <option value="KG">Kilograma (g / kg)</option>
                <option value="UNIDADE">Unidade (un)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "#a1a1aa" }}>{precoLabel}</label>
                <input type="number" step="0.01" min="0" value={precoKg}
                  onChange={(e) => setPrecoKg(e.target.value)}
                  placeholder="Ex: 20.00" required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "#a1a1aa" }}>{minimoLabel}</label>
                <input type="number" step="0.1" min="0" value={estoqueMinimo}
                  onChange={(e) => setEstoqueMinimo(e.target.value)}
                  placeholder="0" />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#dc2626", color: "white" }}>
                {loading ? "Salvando…" : editando ? "Salvar alterações" : "Adicionar"}
              </button>
              {editando && (
                <button type="button" onClick={cancelar}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium"
                  style={{ backgroundColor: "#1e1e22", color: "#a1a1aa", border: "1px solid #2e2e34" }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e1e22" }}>
            <h2 className="text-base font-semibold">Cadastradas <span className="text-sm font-normal" style={{ color: "#52525b" }}>({lista.length})</span></h2>
          </div>
          {lista.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: "#3f3f46" }}>
              Nenhuma matéria-prima cadastrada ainda.
            </div>
          ) : (
            <ul>
              {lista.map((mp, i) => {
                const status = estoqueStatus(mp);
                return (
                  <li key={mp.id} className="px-6 py-4" style={{ borderTop: i === 0 ? "none" : "1px solid #1a1a1e" }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{mp.nome}</span>
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: status.bg, color: status.color }}>
                            {status.label}
                          </span>
                          <span className="rounded px-1.5 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: "#1e1e22", color: "#71717a" }}>
                            {mp.unidade === "KG" ? "kg" : "un"}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs" style={{ color: "#52525b" }}>
                          <span>R$ {Number(mp.precoKg).toFixed(2)}/{mp.unidade === "KG" ? "kg" : "un"}</span>
                          <span>Estoque: <strong style={{ color: status.color }}>
                            {formatEstoque(Number(mp.estoqueGramas), mp.unidade)}
                          </strong></span>
                          {Number(mp.estoqueMinimo) > 0 && (
                            <span>Mín: {formatEstoque(Number(mp.estoqueMinimo), mp.unidade)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => { setEstoqueModal(mp); setAjusteQtd(""); }}
                          className="rounded-md px-2.5 py-1.5 text-xs font-medium"
                          style={{ backgroundColor: "#1e1e22", color: "#eab308", border: "1px solid #2e2e34" }}>
                          Estoque
                        </button>
                        <button onClick={() => iniciarEdicao(mp)}
                          className="rounded-md px-2.5 py-1.5 text-xs font-medium"
                          style={{ backgroundColor: "#1e1e22", color: "#a1a1aa", border: "1px solid #2e2e34" }}>
                          Editar
                        </button>
                        <button onClick={() => remover(mp.id)}
                          className="rounded-md px-2.5 py-1.5 text-xs font-medium"
                          style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#f87171", border: "1px solid rgba(220,38,38,0.15)" }}>
                          Remover
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de ajuste de estoque */}
      {estoqueModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div className="rounded-2xl p-6" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22", width: "100%", maxWidth: "400px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold">Ajuste de Estoque</h3>
              <button onClick={() => setEstoqueModal(null)} className="text-lg leading-none" style={{ color: "#52525b" }}>✕</button>
            </div>

            <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: "#1a1a1e", border: "1px solid #2a2a30" }}>
              <p className="text-sm font-medium">{estoqueModal.nome}</p>
              <p className="mt-0.5 text-xs" style={{ color: "#71717a" }}>
                Estoque atual:{" "}
                <strong style={{ color: "#f4f4f5" }}>
                  {formatEstoque(Number(estoqueModal.estoqueGramas), estoqueModal.unidade)}
                </strong>
                {Number(estoqueModal.estoqueMinimo) > 0 && (
                  <span> · Mínimo: {formatEstoque(Number(estoqueModal.estoqueMinimo), estoqueModal.unidade)}</span>
                )}
              </p>
            </div>

            <form onSubmit={ajustarEstoque} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: "#a1a1aa" }}>
                  {estoqueModal.unidade === "KG"
                    ? "Quantidade em gramas (negativo para retirar)"
                    : "Quantidade em unidades (negativo para retirar)"}
                </label>
                <input type="number" step={estoqueModal.unidade === "KG" ? "0.1" : "1"} value={ajusteQtd}
                  onChange={(e) => setAjusteQtd(e.target.value)}
                  placeholder={estoqueModal.unidade === "KG" ? "Ex: 1000 para adicionar 1kg" : "Ex: 10 para adicionar 10 unidades"}
                  required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEstoqueModal(null)}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                  style={{ backgroundColor: "#1e1e22", color: "#a1a1aa", border: "1px solid #2e2e34" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loadingEstoque}
                  className="flex-1 rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: "#dc2626", color: "white" }}>
                  {loadingEstoque ? "Salvando…" : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
