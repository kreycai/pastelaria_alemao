"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { LuShoppingCart, LuCircleAlert, LuCheck, LuBanknote } from "react-icons/lu";

interface MateriaPrima {
  id: string;
  nome: string;
  unidade: "KG" | "UNIDADE";
  precoKg: number;
  estoqueGramas: number;
  estoqueMinimo: number;
}

function formatQtd(gramas: number, unidade: "KG" | "UNIDADE") {
  if (unidade === "UNIDADE") return `${Number(gramas).toFixed(0)} un`;
  if (gramas >= 1000) return `${(gramas / 1000).toFixed(2).replace(/\.?0+$/, "")} kg`;
  return `${Number(gramas).toFixed(0)} g`;
}

export default function EstoquePage() {
  const [lista, setLista] = useState<MateriaPrima[]>([]);
  const [checados, setChecados] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState<"TODOS" | "CRITICOS">("CRITICOS");

  const carregar = useCallback(async () => {
    const data = await apiFetch<MateriaPrima[]>("/materias-primas");
    setLista(data);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function toggleCheck(id: string) {
    setChecados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const criticos = lista.filter(
    (mp) => Number(mp.estoqueGramas) <= Number(mp.estoqueMinimo)
  );
  const exibir = filtro === "CRITICOS" ? criticos : lista;

  const totalComprar = criticos.reduce((acc, mp) => {
    const falta = Math.max(0, Number(mp.estoqueMinimo) - Number(mp.estoqueGramas));
    const margem = mp.unidade === "UNIDADE" ? 2 : 500;
    return acc + (falta + margem) * (Number(mp.precoKg) / (mp.unidade === "KG" ? 1000 : 1));
  }, 0);

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <LuShoppingCart size={22} />
            Estoque
          </h1>
          <p className="text-sm" style={{ color: "#71717a" }}>
            Lista de compras — itens abaixo do mínimo configurado.
          </p>
        </div>
        <Link href="/admin/materias-primas"
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "#1e1e22", color: "#a1a1aa", border: "1px solid #2e2e34", textDecoration: "none" }}>
          Ajustar estoques →
        </Link>
      </div>

      {/* Cards resumo */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl p-4" style={{
          backgroundColor: criticos.length > 0 ? "rgba(239,68,68,0.06)" : "#111113",
          border: `1px solid ${criticos.length > 0 ? "rgba(239,68,68,0.25)" : "#1e1e22"}`,
        }}>
          <div className="mb-1" style={{ color: criticos.length > 0 ? "#ef4444" : "#52525b" }}>
            <LuCircleAlert size={20} />
          </div>
          <div className="text-2xl font-black" style={{ color: criticos.length > 0 ? "#ef4444" : "#f4f4f5" }}>
            {criticos.length}
          </div>
          <div className="text-xs" style={{ color: "#52525b" }}>Itens para comprar</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22" }}>
          <div className="mb-1" style={{ color: "#22c55e" }}><LuCheck size={20} /></div>
          <div className="text-2xl font-black" style={{ color: "#22c55e" }}>
            {lista.length - criticos.length}
          </div>
          <div className="text-xs" style={{ color: "#52525b" }}>Itens com estoque OK</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: "#111113", border: "1px solid rgba(234,179,8,0.2)" }}>
          <div className="mb-1" style={{ color: "#eab308" }}><LuBanknote size={20} /></div>
          <div className="text-2xl font-black" style={{ color: "#eab308" }}>
            R$ {totalComprar.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs" style={{ color: "#52525b" }}>Estimativa de compra</div>
        </div>
      </div>

      {/* Filtro */}
      <div className="mb-4 flex gap-2">
        {([
          { key: "CRITICOS", label: `Lista de compras (${criticos.length})` },
          { key: "TODOS", label: `Todos os itens (${lista.length})` },
        ] as const).map((f) => (
          <button key={f.key} onClick={() => setFiltro(f.key)}
            className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
            style={{
              backgroundColor: filtro === f.key ? "#dc2626" : "#1e1e22",
              color: filtro === f.key ? "white" : "#71717a",
              border: "1px solid",
              borderColor: filtro === f.key ? "#dc2626" : "#2e2e34",
            }}>
            {f.label}
          </button>
        ))}
        {checados.size > 0 && (
          <button onClick={() => setChecados(new Set())}
            className="ml-auto rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: "#1e1e22", color: "#52525b", border: "1px solid #2e2e34" }}>
            Limpar ({checados.size} marcado{checados.size !== 1 ? "s" : ""})
          </button>
        )}
      </div>

      {/* Lista */}
      {exibir.length === 0 ? (
        <div className="rounded-xl py-16 text-center" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22" }}>
          <div className="mb-3 flex justify-center" style={{ color: "#22c55e" }}>
            <LuCheck size={36} />
          </div>
          <div className="text-base font-semibold" style={{ color: "#22c55e" }}>Tudo em dia!</div>
          <div className="mt-1 text-sm" style={{ color: "#3f3f46" }}>Nenhum item abaixo do estoque mínimo.</div>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22" }}>
          <div className="px-5 py-3 grid text-xs font-semibold uppercase tracking-wider"
            style={{ color: "#3f3f46", borderBottom: "1px solid #1a1a1e", gridTemplateColumns: "2rem 1fr auto auto auto" }}>
            <span />
            <span>Item</span>
            <span className="text-right pr-6">Atual</span>
            <span className="text-right pr-6">Mínimo</span>
            <span className="text-right">Comprar</span>
          </div>
          {exibir.map((mp, i) => {
            const atual = Number(mp.estoqueGramas);
            const minimo = Number(mp.estoqueMinimo);
            const critico = atual <= minimo;
            const faltam = critico ? Math.max(0, minimo - atual) + (mp.unidade === "UNIDADE" ? 2 : 500) : 0;
            const checked = checados.has(mp.id);
            return (
              <div
                key={mp.id}
                onClick={() => critico && toggleCheck(mp.id)}
                className="px-5 py-4 grid items-center"
                style={{
                  gridTemplateColumns: "2rem 1fr auto auto auto",
                  borderTop: i === 0 ? "none" : "1px solid #1a1a1e",
                  opacity: checked ? 0.4 : 1,
                  cursor: critico ? "pointer" : "default",
                  transition: "opacity 0.15s",
                }}>
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: `2px solid ${checked ? "#22c55e" : critico ? "#2e2e34" : "transparent"}`,
                  backgroundColor: checked ? "#22c55e" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "white", fontWeight: 800,
                }}>
                  {checked ? "✓" : ""}
                </div>

                {/* Nome */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ textDecoration: checked ? "line-through" : "none", color: checked ? "#52525b" : "#f4f4f5" }}>
                      {mp.nome}
                    </span>
                    {critico && !checked && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                        Crítico
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: "#3f3f46" }}>{mp.unidade === "KG" ? "kg/gramas" : "unidade"}</span>
                </div>

                {/* Atual */}
                <div className="text-sm font-semibold pr-6 text-right"
                  style={{ color: critico ? "#ef4444" : "#22c55e" }}>
                  {formatQtd(atual, mp.unidade)}
                </div>

                {/* Mínimo */}
                <div className="text-sm pr-6 text-right" style={{ color: "#52525b" }}>
                  {minimo > 0 ? formatQtd(minimo, mp.unidade) : "—"}
                </div>

                {/* Comprar */}
                <div className="text-sm font-black text-right" style={{ color: critico ? "#dc2626" : "#3f3f46" }}>
                  {critico ? formatQtd(faltam, mp.unidade) : "—"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
