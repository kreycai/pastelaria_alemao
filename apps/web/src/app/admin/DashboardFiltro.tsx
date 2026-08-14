"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";

interface PeriodoStats {
  periodo: { pedidos: number; faturamento: number; custo: number; lucro: number };
  topPasteis: Array<{ id: string; nome: string; quantidade: number; faturamento: number }>;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardFiltro() {
  const today = new Date().toISOString().split("T")[0]!;
  const firstOfMonth = today.slice(0, 7) + "-01";

  const [de, setDe] = useState(firstOfMonth);
  const [ate, setAte] = useState(today);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<PeriodoStats | null>(null);
  const [erro, setErro] = useState("");

  async function buscar() {
    if (!de || !ate) return;
    setLoading(true);
    setErro("");
    try {
      const res = await fetch(`${API_URL}/dashboard/periodo?de=${de}&ate=${ate}`);
      if (!res.ok) throw new Error();
      setResultado(await res.json());
    } catch {
      setErro("Erro ao buscar dados do período.");
    } finally {
      setLoading(false);
    }
  }

  const margem =
    resultado && resultado.periodo.faturamento > 0
      ? (resultado.periodo.lucro / resultado.periodo.faturamento) * 100
      : 0;

  return (
    <div className="mb-6 rounded-xl p-6" style={{ backgroundColor: "#111113", border: "1px solid #1e1e22" }}>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "#3f3f46" }}>
        Faturamento por período
      </h2>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs" style={{ color: "#52525b" }}>De</label>
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} style={{ width: "160px" }} />
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "#52525b" }}>Até</label>
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} style={{ width: "160px" }} />
        </div>
        <button
          onClick={buscar}
          disabled={loading || !de || !ate}
          className="rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ backgroundColor: "#dc2626", color: "white" }}
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {erro && <p className="mt-3 text-sm" style={{ color: "#ef4444" }}>{erro}</p>}

      {resultado && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Faturamento</div>
              <div className="text-xl font-black" style={{ color: "#eab308" }}>R$ {fmt(resultado.periodo.faturamento)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Custo ingredientes</div>
              <div className="text-xl font-black" style={{ color: "#f87171" }}>R$ {fmt(resultado.periodo.custo)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Lucro bruto</div>
              <div
                className="text-xl font-black"
                style={{ color: resultado.periodo.lucro >= 0 ? "#22c55e" : "#f87171" }}
              >
                R$ {fmt(resultado.periodo.lucro)}
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "#52525b" }}>Pedidos / Margem</div>
              <div className="text-xl font-black">
                {resultado.periodo.pedidos}{" "}
                <span className="text-base font-semibold" style={{ color: margem >= 0 ? "#22c55e" : "#f87171" }}>
                  ({margem.toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>

          {resultado.topPasteis.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#3f3f46" }}>
                Top pastéis no período
              </div>
              <div className="flex flex-col gap-1.5">
                {resultado.topPasteis.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold" style={{ color: "#3f3f46", width: "1rem" }}>{i + 1}</span>
                    <span className="flex-1 text-sm">{p.nome}</span>
                    <span className="text-xs" style={{ color: "#52525b" }}>{p.quantidade}×</span>
                    <span className="text-sm font-semibold" style={{ color: "#eab308" }}>R$ {fmt(p.faturamento)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
