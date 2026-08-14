import { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch, Pedido } from "@/lib/api";

type ColStatus = "PENDENTE" | "EM_PREPARO" | "PRONTO";

const COLS: {
  key: ColStatus;
  label: string;
  next: "EM_PREPARO" | "PRONTO" | "ENTREGUE";
  nextLabel: string;
  color: string;
  bg: string;
}[] = [
  { key: "PENDENTE",   label: "Na fila",    next: "EM_PREPARO", nextLabel: "Iniciar",  color: "#eab308", bg: "rgba(234,179,8,0.08)"  },
  { key: "EM_PREPARO", label: "Preparando", next: "PRONTO",     nextLabel: "Pronto",   color: "#f97316", bg: "rgba(249,115,22,0.08)" },
  { key: "PRONTO",     label: "Pronto",     next: "ENTREGUE",   nextLabel: "Entregar", color: "#22c55e", bg: "rgba(34,197,94,0.08)"  },
];

function elapsed(iso: string, now: number): string {
  const secs = Math.floor((now - new Date(iso).getTime()) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ""}` : `${s}s`;
}

export default function CozinhaScreen() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [advancing, setAdvancing] = useState<Set<string>>(new Set());

  const carregar = useCallback(async () => {
    try {
      const data = await apiFetch<Pedido[]>("/pedidos");
      setPedidos(data.filter((p) => ["PENDENTE", "EM_PREPARO", "PRONTO"].includes(p.status)));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh enquanto a tela está em foco
  useFocusEffect(
    useCallback(() => {
      carregar();
      const poll = setInterval(carregar, 8000);
      return () => clearInterval(poll);
    }, [carregar]),
  );

  // Tick do cronômetro — atualiza tempo decorrido a cada 5s
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  async function avancar(id: string, novoStatus: string) {
    if (advancing.has(id)) return;
    setAdvancing((prev) => new Set([...prev, id]));
    try {
      await apiFetch(`/pedidos/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: novoStatus }),
      });
      await carregar();
    } finally {
      setAdvancing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#dc2626" size="large" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Cozinha</Text>
        <Text style={s.headerSub}>
          {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} ativos
        </Text>
        {refreshing && <ActivityIndicator color="#52525b" size="small" style={{ marginLeft: 8 }} />}
        <Pressable
          onPress={() => { setRefreshing(true); carregar(); }}
          style={s.refreshBtn}
          hitSlop={12}
        >
          <Text style={s.refreshIcon}>↻</Text>
        </Pressable>
      </View>

      {/* 3 colunas lado a lado */}
      <View style={s.columns}>
        {COLS.map((col, colIndex) => {
          const items = pedidos.filter((p) => p.status === col.key);
          return (
            <View
              key={col.key}
              style={[s.col, colIndex < COLS.length - 1 && s.colBorder]}
            >
              {/* Cabeçalho da coluna */}
              <View style={[s.colHeader, { borderBottomColor: col.color + "33" }]}>
                <View style={[s.colDot, { backgroundColor: col.color }]} />
                <Text style={[s.colTitle, { color: col.color }]}>{col.label}</Text>
                {items.length > 0 && (
                  <View style={[s.colBadge, { backgroundColor: col.color + "22" }]}>
                    <Text style={[s.colBadgeText, { color: col.color }]}>{items.length}</Text>
                  </View>
                )}
              </View>

              {/* Cards */}
              <ScrollView
                contentContainerStyle={s.colList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => { setRefreshing(true); carregar(); }}
                    tintColor={col.color}
                  />
                }
              >
                {items.length === 0 ? (
                  <View style={s.emptyCol}>
                    <Text style={s.emptyText}>Nenhum pedido</Text>
                  </View>
                ) : (
                  items.map((p) => {
                    const mins = Math.floor((now - new Date(p.createdAt).getTime()) / 60000);
                    const urgente = mins >= 10;
                    const isLoading = advancing.has(p.id);

                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => avancar(p.id, col.next)}
                        disabled={isLoading}
                        style={({ pressed }) => [
                          s.card,
                          urgente && s.cardUrgente,
                          pressed && !isLoading && s.cardPressed,
                          isLoading && s.cardDisabled,
                        ]}
                      >
                        {/* Topo: ID + tempo decorrido */}
                        <View style={s.cardTop}>
                          <Text style={s.cardId}>#{p.id.slice(-6).toUpperCase()}</Text>
                          <Text style={[s.cardElapsed, urgente && s.cardElapsedUrgente]}>
                            {elapsed(p.createdAt, now)}
                          </Text>
                        </View>

                        {/* Nome do cliente (fiado) */}
                        {p.nomeCliente ? (
                          <Text style={s.cardCliente}>{p.nomeCliente}</Text>
                        ) : null}

                        {/* Itens do pedido */}
                        <View style={s.cardItens}>
                          {p.itens.map((item) => (
                            <Text key={item.id} style={s.cardItem}>
                              {item.quantidade}× {item.pastel.nome}
                            </Text>
                          ))}
                        </View>

                        {/* Observação */}
                        {p.observacao ? (
                          <Text style={s.cardObs}>{p.observacao}</Text>
                        ) : null}

                        {/* Botão de avançar — toque único */}
                        <View
                          style={[
                            s.cardBtn,
                            {
                              backgroundColor: isLoading ? "#1e1e22" : col.color + "1a",
                              borderColor: col.color + "44",
                            },
                          ]}
                        >
                          {isLoading ? (
                            <ActivityIndicator color={col.color} size="small" />
                          ) : (
                            <Text style={[s.cardBtnText, { color: col.color }]}>
                              {col.nextLabel} →
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  center: {
    flex: 1, backgroundColor: "#09090b",
    alignItems: "center", justifyContent: "center",
  },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 14,
    backgroundColor: "#0c0c0f",
    borderBottomWidth: 1, borderBottomColor: "#18181c",
    gap: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#f4f4f5" },
  headerSub: { fontSize: 12, color: "#52525b", flex: 1 },
  refreshBtn: {
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#1a1a1e", borderRadius: 10,
  },
  refreshIcon: { fontSize: 20, color: "#52525b" },

  // Layout das colunas
  columns: { flex: 1, flexDirection: "row" },
  col: { flex: 1 },
  colBorder: { borderRightWidth: 1, borderRightColor: "#1e1e22" },

  colHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  colDot: { width: 8, height: 8, borderRadius: 4 },
  colTitle: {
    fontSize: 11, fontWeight: "800",
    textTransform: "uppercase", letterSpacing: 0.8, flex: 1,
  },
  colBadge: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1 },
  colBadgeText: { fontSize: 11, fontWeight: "900" },

  colList: { padding: 8, gap: 8 },

  emptyCol: {
    marginTop: 40, alignItems: "center",
    paddingHorizontal: 12,
  },
  emptyText: { color: "#2e2e34", fontSize: 13, textAlign: "center" },

  // Cards
  card: {
    backgroundColor: "#111113",
    borderRadius: 12,
    borderWidth: 1.5, borderColor: "#1e1e22",
    padding: 12, gap: 8,
  },
  cardUrgente: {
    backgroundColor: "rgba(220,38,38,0.06)",
    borderColor: "rgba(220,38,38,0.4)",
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  cardDisabled: { opacity: 0.45 },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardId: {
    fontSize: 10, fontWeight: "600",
    color: "#3f3f46", fontFamily: "monospace",
  },
  cardElapsed: {
    fontSize: 20, fontWeight: "900", color: "#52525b",
  },
  cardElapsedUrgente: { color: "#ef4444" },

  cardCliente: {
    fontSize: 14, fontWeight: "700", color: "#eab308",
  },

  cardItens: { gap: 3 },
  cardItem: {
    fontSize: 15, fontWeight: "700", color: "#d4d4d8",
  },

  cardObs: {
    fontSize: 11, color: "#a1a1aa",
    backgroundColor: "rgba(234,179,8,0.06)",
    borderWidth: 1, borderColor: "rgba(234,179,8,0.15)",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },

  cardBtn: {
    borderRadius: 8, borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center", justifyContent: "center",
    minHeight: 44,
  },
  cardBtnText: {
    fontSize: 14, fontWeight: "800",
  },
});
