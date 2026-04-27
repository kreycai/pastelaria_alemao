import Link from "next/link";
import { API_URL } from "@/lib/api";
import {
  LuClock, LuMapPin, LuCreditCard, LuUtensils,
  LuTrendingUp, LuUtensilsCrossed, LuCake, LuChefHat,
} from "react-icons/lu";
import type { IconType } from "react-icons";

interface Pastel {
  id: string; nome: string; descricao: string | null;
  preco: number; tipo: "SALGADO" | "DOCE"; disponivel: boolean;
}
interface TopPastel { id: string; nome: string; preco: number; quantidade: number }

async function getPasteis(): Promise<Pastel[]> {
  try {
    const res = await fetch(`${API_URL}/pasteis`, { cache: "no-store" });
    if (!res.ok) return [];
    const data: Pastel[] = await res.json();
    return data.filter((p) => p.disponivel);
  } catch { return []; }
}

async function getTopPasteis(): Promise<TopPastel[]> {
  try {
    const res = await fetch(`${API_URL}/dashboard/top-pasteis`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const infoCards: { Icon: IconType; title: string; desc: string }[] = [
  { Icon: LuClock,      title: "Horário",     desc: "Seg–Sáb · 10h às 21h" },
  { Icon: LuMapPin,     title: "Localização", desc: "Rua Principal, 123" },
  { Icon: LuCreditCard, title: "Pagamento",   desc: "Pix, débito e dinheiro" },
  { Icon: LuUtensils,   title: "Peça na hora",desc: "Frito na sua frente" },
];

export default async function HomePage() {
  const [pasteis, topPasteis] = await Promise.all([getPasteis(), getTopPasteis()]);

  const salgados = pasteis.filter((p) => p.tipo === "SALGADO");
  const doces = pasteis.filter((p) => p.tipo === "DOCE");

  return (
    <main>
      {/* Hero */}
      <section style={{
        padding: "3.5rem 1.25rem 3rem", textAlign: "center",
        borderBottom: "1px solid #18181c",
        background: "radial-gradient(ellipse at 50% -20%, rgba(220,38,38,0.08) 0%, transparent 65%)",
      }}>
        <div style={{ maxWidth: "38rem", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.375rem",
            backgroundColor: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)",
            borderRadius: "9999px", padding: "0.3rem 0.875rem",
            fontSize: "0.75rem", fontWeight: 600, color: "#ca8a04",
            marginBottom: "1.5rem", letterSpacing: "0.04em",
          }}>
            <LuChefHat size={12} />
            Aberto hoje
          </div>

          <h1 style={{
            fontSize: "clamp(1.875rem, 6vw, 2.75rem)", fontWeight: 800,
            lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 1rem", color: "#f4f4f5",
          }}>
            Pastelaria <span style={{ color: "#dc2626" }}>Alemão</span>
          </h1>

          <p style={{
            fontSize: "clamp(0.9rem, 3vw, 1.0625rem)", color: "#71717a",
            lineHeight: 1.65, maxWidth: "28rem", margin: "0 auto 2rem",
          }}>
            Pastéis fritos na hora, recheios caprichados e aquele sabor de bairro que você não esquece.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
            <Link href="/cardapio" style={{
              display: "block", width: "100%", maxWidth: "16rem",
              borderRadius: "0.625rem", padding: "0.8rem 1.5rem",
              fontSize: "0.9375rem", fontWeight: 700,
              backgroundColor: "#dc2626", color: "white",
              textDecoration: "none", textAlign: "center",
            }}>
              Ver cardápio completo
            </Link>
            <p style={{ fontSize: "0.75rem", color: "#3f3f46" }}>
              Retire no balcão · Sem filas · Pague como quiser
            </p>
          </div>
        </div>
      </section>

      {/* Info rápida */}
      <section style={{ padding: "2rem 1.25rem", maxWidth: "38rem", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {infoCards.map((item) => {
            const Icon = item.Icon;
            return (
              <div key={item.title} style={{
                backgroundColor: "#111113", border: "1px solid #1e1e22",
                borderRadius: "0.75rem", padding: "1rem",
              }}>
                <div style={{ marginBottom: "0.375rem", color: "#dc2626" }}>
                  <Icon size={20} />
                </div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f4f4f5", marginBottom: "0.125rem" }}>{item.title}</div>
                <div style={{ fontSize: "0.75rem", color: "#52525b", lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {pasteis.length > 0 && (
        <section style={{ padding: "0 1.25rem 3rem", maxWidth: "38rem", margin: "0 auto" }}>

          {topPasteis.length > 0 && (
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                fontSize: "0.8125rem", fontWeight: 700, color: "#3f3f46",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem",
              }}>
                <LuTrendingUp size={13} />
                Mais pedidos
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {topPasteis.map((p, i) => (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    backgroundColor: "#111113", border: "1px solid #1e1e22",
                    borderRadius: "0.625rem", padding: "0.75rem 1rem",
                  }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#3f3f46", width: "1.2rem", flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "0.875rem", color: "#d4d4d8" }}>{p.nome}</span>
                      <div style={{ fontSize: "0.7rem", color: "#52525b", marginTop: "0.125rem" }}>
                        {p.quantidade} vendido{p.quantidade !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#eab308", flexShrink: 0 }}>
                      R$ {fmt(Number(p.preco))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {salgados.length > 0 && (
            <div style={{ marginBottom: "1.25rem" }}>
              <h2 style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                fontSize: "0.8125rem", fontWeight: 700, color: "#3f3f46",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem",
              }}>
                <LuUtensilsCrossed size={13} />
                Salgados
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {salgados.map((p) => (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    backgroundColor: "#111113", border: "1px solid #1e1e22",
                    borderRadius: "0.625rem", padding: "0.75rem 1rem",
                  }}>
                    <div>
                      <span style={{ fontSize: "0.875rem", color: "#d4d4d8", display: "block" }}>{p.nome}</span>
                      {p.descricao && <span style={{ fontSize: "0.75rem", color: "#52525b" }}>{p.descricao}</span>}
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#eab308", flexShrink: 0, marginLeft: "1rem" }}>
                      R$ {fmt(Number(p.preco))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {doces.length > 0 && (
            <div style={{ marginBottom: "1.25rem" }}>
              <h2 style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                fontSize: "0.8125rem", fontWeight: 700, color: "#3f3f46",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem",
              }}>
                <LuCake size={13} />
                Doces
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {doces.map((p) => (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    backgroundColor: "#111113", border: "1px solid #1e1e22",
                    borderRadius: "0.625rem", padding: "0.75rem 1rem",
                  }}>
                    <div>
                      <span style={{ fontSize: "0.875rem", color: "#d4d4d8", display: "block" }}>{p.nome}</span>
                      {p.descricao && <span style={{ fontSize: "0.75rem", color: "#52525b" }}>{p.descricao}</span>}
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#eab308", flexShrink: 0, marginLeft: "1rem" }}>
                      R$ {fmt(Number(p.preco))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <Link href="/cardapio" style={{
              fontSize: "0.8125rem", color: "#52525b", textDecoration: "none",
              borderBottom: "1px solid #27272a", paddingBottom: "1px",
            }}>
              Ver cardápio completo →
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
