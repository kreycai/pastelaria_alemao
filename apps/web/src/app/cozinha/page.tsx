"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/api";
import { LuClock, LuChefHat, LuCircleCheck, LuFileText } from "react-icons/lu";
import type { IconType } from "react-icons";

interface ItemPedido {
  id: string;
  quantidade: number;
  pastel: { nome: string };
}

interface Pedido {
  id: string;
  status: "PENDENTE" | "EM_PREPARO" | "PRONTO" | "ENTREGUE" | "CANCELADO";
  total: number;
  observacao: string | null;
  nomeCliente: string | null;
  createdAt: string;
  itens: ItemPedido[];
}

const STATUS_COLS: { key: Pedido["status"]; label: string; Icon: IconType; color: string; bg: string }[] = [
  { key: "PENDENTE",   label: "Aguardando", Icon: LuClock,       color: "#eab308", bg: "rgba(234,179,8,0.08)" },
  { key: "EM_PREPARO", label: "Em preparo", Icon: LuChefHat,     color: "#f97316", bg: "rgba(249,115,22,0.08)" },
  { key: "PRONTO",     label: "Pronto",     Icon: LuCircleCheck, color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
];

function elapsed(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}min${s > 0 ? ` ${s}s` : ""}` : `${s}s`;
}

function PedidoCard({ p, now }: { p: Pedido; now: number }) {
  const mins = Math.floor((now - new Date(p.createdAt).getTime()) / 60000);
  const urgente = mins >= 10;
  return (
    <div style={{
      backgroundColor: urgente ? "rgba(220,38,38,0.08)" : "#111113",
      border: `2px solid ${urgente ? "rgba(220,38,38,0.4)" : "#1e1e22"}`,
      borderRadius: "1rem",
      padding: "1.25rem",
      display: "flex", flexDirection: "column", gap: "0.625rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {p.nomeCliente && (
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f4f4f5", marginBottom: "0.25rem" }}>
              {p.nomeCliente}
            </div>
          )}
          <div style={{ fontSize: "0.75rem", color: "#52525b", fontFamily: "monospace" }}>
            #{p.id.slice(-6).toUpperCase()}
          </div>
        </div>
        <div style={{
          fontSize: "1.125rem", fontWeight: 900,
          color: urgente ? "#ef4444" : "#52525b",
        }}>
          {elapsed(p.createdAt)}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {p.itens.map((item) => (
          <div key={item.id} style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            backgroundColor: "#0c0c0f", borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
          }}>
            <span style={{
              fontSize: "1.25rem", fontWeight: 900, color: "#dc2626",
              minWidth: "1.75rem", textAlign: "center",
            }}>
              {item.quantidade}×
            </span>
            <span style={{ fontSize: "1rem", fontWeight: 600, color: "#d4d4d8" }}>
              {item.pastel.nome}
            </span>
          </div>
        ))}
      </div>

      {p.observacao && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          fontSize: "0.875rem", color: "#a1a1aa",
          backgroundColor: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)",
          borderRadius: "0.5rem", padding: "0.5rem 0.75rem",
        }}>
          <LuFileText size={14} style={{ flexShrink: 0 }} />
          {p.observacao}
        </div>
      )}
    </div>
  );
}

export default function CozinhaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(Date.now());
  const socketRef = useRef<Socket | null>(null);

  // tick every 10s to refresh elapsed times
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // load active orders on mount
    fetch(`${API_URL}/pedidos`)
      .then((r) => r.json())
      .then((data: Pedido[]) =>
        setPedidos(data.filter((p) => ["PENDENTE", "EM_PREPARO", "PRONTO"].includes(p.status)))
      )
      .catch(() => {});

    const socket: Socket = io(API_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("novo-pedido", (pedido: Pedido) => {
      setPedidos((prev) => [pedido, ...prev.filter((p) => p.id !== pedido.id)]);
    });

    socket.on("status-atualizado", (pedido: Pedido) => {
      setPedidos((prev) => {
        if (["ENTREGUE", "CANCELADO"].includes(pedido.status)) {
          return prev.filter((p) => p.id !== pedido.id);
        }
        const exists = prev.find((p) => p.id === pedido.id);
        if (exists) return prev.map((p) => p.id === pedido.id ? pedido : p);
        return [pedido, ...prev];
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  const cols = STATUS_COLS.map((col) => ({
    ...col,
    items: pedidos.filter((p) => p.status === col.key),
  }));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#09090b", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            height: "2.5rem", width: "2.5rem", borderRadius: "0.625rem",
            background: "linear-gradient(135deg, #dc2626, #b91c1c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", fontWeight: 900, color: "white",
          }}>P</div>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f4f4f5", lineHeight: 1 }}>
              Cozinha
            </div>
            <div style={{ fontSize: "0.75rem", color: "#52525b", marginTop: "0.125rem" }}>
              Pastelaria Alemão
            </div>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          fontSize: "0.75rem", color: connected ? "#22c55e" : "#ef4444",
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            backgroundColor: connected ? "#22c55e" : "#ef4444",
          }} />
          {connected ? "Ao vivo" : "Reconectando…"}
        </div>
      </div>

      {/* Columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", alignItems: "start" }}>
        {cols.map((col) => {
          const ColIcon = col.Icon;
          return (
          <div key={col.key}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              marginBottom: "0.875rem",
            }}>
              <ColIcon size={16} style={{ color: col.color, flexShrink: 0 }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: col.color, margin: 0 }}>
                {col.label}
              </h2>
              {col.items.length > 0 && (
                <span style={{
                  fontSize: "0.75rem", fontWeight: 800,
                  backgroundColor: col.bg, color: col.color,
                  border: `1px solid ${col.color}33`,
                  borderRadius: "9999px", padding: "0.125rem 0.5rem",
                }}>
                  {col.items.length}
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {col.items.length === 0 ? (
                <div style={{
                  backgroundColor: "#111113", border: "1px dashed #1e1e22",
                  borderRadius: "1rem", padding: "2rem", textAlign: "center",
                  color: "#3f3f46", fontSize: "0.875rem",
                }}>
                  Nenhum pedido
                </div>
              ) : (
                col.items.map((p) => <PedidoCard key={p.id} p={p} now={now} />)
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
