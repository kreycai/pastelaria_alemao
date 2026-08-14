"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { MateriaPrima } from "@pastelaria/types";

interface Ingrediente { materiaPrimaId: string; quantidadeGramas: number }
interface PastelIngrediente extends Ingrediente { materiaPrima: MateriaPrima }
interface Pastel {
  id: string; nome: string; descricao: string | null;
  preco: number; tipo: "SALGADO" | "DOCE"; disponivel: boolean;
  custo: number; ingredientes: PastelIngrediente[];
}

const TIPOS = ["SALGADO", "DOCE"] as const;

function calcCusto(ingredientes: Ingrediente[], materiaMap: Map<string, MateriaPrima>) {
  return ingredientes.reduce((acc, ing) => {
    const mp = materiaMap.get(ing.materiaPrimaId);
    return acc + (mp ? (Number(mp.precoKg) * ing.quantidadeGramas) / 1000 : 0);
  }, 0);
}

export default function PasteisPage() {
  const [pasteis, setPasteis] = useState<Pastel[]>([]);
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Pastel | null>(null);
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [tipo, setTipo] = useState<"SALGADO" | "DOCE">("SALGADO");
  const [disponivel, setDisponivel] = useState(true);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);

  const materiaMap = new Map(materias.map((m) => [m.id, m]));

  async function carregarPasteis() {
    setPasteis(await apiFetch<Pastel[]>("/pasteis"));
  }

  useEffect(() => {
    Promise.all([
      apiFetch<Pastel[]>("/pasteis"),
      apiFetch<MateriaPrima[]>("/materias-primas"),
    ]).then(([p, m]) => { setPasteis(p); setMaterias(m); });
  }, []);

  function resetForm() {
    setNome(""); setDescricao(""); setPreco(""); setTipo("SALGADO");
    setDisponivel(true); setIngredientes([]); setEditando(null); setShowForm(false);
  }

  function iniciarEdicao(p: Pastel) {
    setEditando(p); setNome(p.nome); setDescricao(p.descricao ?? "");
    setPreco(String(p.preco)); setTipo(p.tipo); setDisponivel(p.disponivel);
    setIngredientes(p.ingredientes.map((i) => ({
      materiaPrimaId: i.materiaPrimaId,
      quantidadeGramas: Number(i.quantidadeGramas),
    })));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleIngrediente(mpId: string) {
    setIngredientes((prev) =>
      prev.find((i) => i.materiaPrimaId === mpId)
        ? prev.filter((i) => i.materiaPrimaId !== mpId)
        : [...prev, { materiaPrimaId: mpId, quantidadeGramas: 100 }],
    );
  }

  function setGramas(mpId: string, gramas: number) {
    setIngredientes((prev) =>
      prev.map((i) => i.materiaPrimaId === mpId ? { ...i, quantidadeGramas: gramas } : i),
    );
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { nome, descricao: descricao || undefined, preco: parseFloat(preco), tipo, disponivel, ingredientes };
      if (editando) {
        await apiFetch(`/pasteis/${editando.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch("/pasteis", { method: "POST", body: JSON.stringify(body) });
      }
      resetForm();
      await carregarPasteis();
    } finally { setLoading(false); }
  }

  async function remover(id: string) {
    if (!confirm("Remover este pastel?")) return;
    await apiFetch(`/pasteis/${id}`, { method: "DELETE" });
    await carregarPasteis();
  }

  const custoPrevisto = calcCusto(ingredientes, materiaMap);
  const precoNum = parseFloat(preco) || 0;
  const margem = precoNum - custoPrevisto;
  const margemPct = precoNum > 0 ? (margem / precoNum) * 100 : 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Pastéis</h1>
          <p className="text-sm" style={{ color: "#71717a" }}>
            Gerencie o cardápio com custo por ingrediente.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: "#dc2626", color: "white" }}>
            + Novo Pastel
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 rounded-xl p-6" style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold">{editando ? "Editar Pastel" : "Novo Pastel"}</h2>
            <button onClick={resetForm} className="text-sm" style={{ color: "#71717a" }}>✕ Cancelar</button>
          </div>

          <form onSubmit={salvar}>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: "#a1a1aa" }}>Nome *</label>
                  <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Pastel de Frango" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: "#a1a1aa" }}>Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Frango desfiado com catupiry..." rows={2}
                    style={{ backgroundColor: "#27272a", border: "1px solid #3f3f46", color: "#f4f4f5", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", width: "100%", fontSize: "0.875rem", outline: "none" }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: "#a1a1aa" }}>Preço de venda (R$) *</label>
                    <input type="number" step="0.01" min="0" value={preco}
                      onChange={(e) => setPreco(e.target.value)} placeholder="8.50" required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: "#a1a1aa" }}>Tipo *</label>
                    <select value={tipo} onChange={(e) => setTipo(e.target.value as "SALGADO" | "DOCE")}>
                      {TIPOS.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={disponivel} onChange={(e) => setDisponivel(e.target.checked)}
                    style={{ width: "auto", accentColor: "#dc2626" }} />
                  <span className="text-sm">Disponível no cardápio</span>
                </label>

                {ingredientes.length > 0 && (
                  <div className="rounded-lg p-4" style={{ backgroundColor: "#09090b", border: "1px solid #27272a" }}>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#52525b" }}>
                      Análise de custo
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-xs" style={{ color: "#71717a" }}>Custo</div>
                        <div className="font-bold" style={{ color: "#fca5a5" }}>R$ {custoPrevisto.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: "#71717a" }}>Preço</div>
                        <div className="font-bold">R$ {precoNum.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: "#71717a" }}>Margem</div>
                        <div className="font-bold" style={{ color: margem >= 0 ? "#4ade80" : "#f87171" }}>
                          {margemPct.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-3 block text-xs font-medium" style={{ color: "#a1a1aa" }}>
                  Ingredientes (matérias-primas)
                </label>
                {materias.length === 0 ? (
                  <div className="rounded-lg p-4 text-center text-sm" style={{ color: "#52525b", backgroundColor: "#27272a" }}>
                    Cadastre matérias-primas primeiro.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "320px" }}>
                    {materias.map((mp) => {
                      const selecionado = ingredientes.find((i) => i.materiaPrimaId === mp.id);
                      return (
                        <div key={mp.id} className="rounded-lg p-3 transition-colors"
                          style={{
                            backgroundColor: selecionado ? "rgba(220,38,38,0.08)" : "#27272a",
                            border: `1px solid ${selecionado ? "rgba(220,38,38,0.3)" : "#3f3f46"}`,
                          }}>
                          <label className="flex cursor-pointer items-center gap-3">
                            <input type="checkbox" checked={!!selecionado}
                              onChange={() => toggleIngrediente(mp.id)}
                              style={{ width: "auto", accentColor: "#dc2626" }} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{mp.nome}</div>
                              <div className="text-xs" style={{ color: "#71717a" }}>
                                R$ {Number(mp.precoKg).toFixed(2)}/kg
                              </div>
                            </div>
                          </label>
                          {selecionado && (
                            <div className="mt-2 flex items-center gap-2 pl-7">
                              <input type="number" step="0.1" min="0.1"
                                value={selecionado.quantidadeGramas}
                                onChange={(e) => setGramas(mp.id, parseFloat(e.target.value) || 0)}
                                style={{ width: "80px", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }} />
                              <span className="text-xs" style={{ color: "#71717a" }}>g</span>
                              <span className="ml-auto text-xs" style={{ color: "#71717a" }}>
                                = R$ {((Number(mp.precoKg) * selecionado.quantidadeGramas) / 1000).toFixed(3)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={resetForm}
                className="rounded-lg px-5 py-2.5 text-sm font-medium"
                style={{ backgroundColor: "#27272a", color: "#a1a1aa", border: "1px solid #3f3f46" }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="rounded-lg px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#dc2626", color: "white" }}>
                {loading ? "Salvando…" : editando ? "Salvar alterações" : "Criar Pastel"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl" style={{ border: "1px solid #27272a" }}>
        <div className="px-6 py-4" style={{ backgroundColor: "#18181b", borderBottom: "1px solid #27272a" }}>
          <h2 className="text-base font-semibold">Cadastrados ({pasteis.length})</h2>
        </div>
        {pasteis.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ backgroundColor: "#18181b", color: "#52525b" }}>
            Nenhum pastel cadastrado ainda.
          </div>
        ) : (
          <div style={{ backgroundColor: "#18181b" }}>
            {pasteis.map((p, i) => {
              const custo = Number(p.custo) || 0;
              const preco2 = Number(p.preco);
              const margem2 = preco2 - custo;
              const margemPct2 = preco2 > 0 ? (margem2 / preco2) * 100 : 0;
              return (
                <div key={p.id} className="flex items-center gap-4 px-6 py-4"
                  style={{ borderTop: i > 0 ? "1px solid #27272a" : undefined }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.nome}</span>
                      <span className="rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: "#27272a", color: "#a1a1aa" }}>
                        {p.tipo}
                      </span>
                      {!p.disponivel && (
                        <span className="rounded px-1.5 py-0.5 text-xs"
                          style={{ backgroundColor: "#27272a", color: "#71717a" }}>
                          indisponível
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-4 text-xs" style={{ color: "#71717a" }}>
                      <span>Venda: <strong style={{ color: "#f4f4f5" }}>R$ {preco2.toFixed(2)}</strong></span>
                      <span>Custo: <strong style={{ color: "#fca5a5" }}>R$ {custo.toFixed(2)}</strong></span>
                      <span>Margem:{" "}
                        <strong style={{ color: margem2 >= 0 ? "#4ade80" : "#f87171" }}>
                          {margemPct2.toFixed(0)}%
                        </strong>
                      </span>
                      {p.ingredientes.length > 0 && (
                        <span>{p.ingredientes.length} ingrediente{p.ingredientes.length !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => iniciarEdicao(p)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium"
                      style={{ backgroundColor: "#27272a", color: "#a1a1aa", border: "1px solid #3f3f46" }}>
                      Editar
                    </button>
                    <button onClick={() => remover(p.id)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium"
                      style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.2)" }}>
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
