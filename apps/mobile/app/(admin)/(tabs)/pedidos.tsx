import { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch, Pedido } from "@/lib/api";
import { clearAdminSession } from "@/lib/store";
import { router } from "expo-router";

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente", EM_PREPARO: "Em preparo",
  PRONTO: "Pronto", ENTREGUE: "Entregue", CANCELADO: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  PENDENTE: "#eab308", EM_PREPARO: "#3b82f6", PRONTO: "#22c55e",
  ENTREGUE: "#52525b", CANCELADO: "#ef4444",
};
const PROXIMO: Record<string, string> = {
  PENDENTE: "EM_PREPARO", EM_PREPARO: "PRONTO", PRONTO: "ENTREGUE",
};

export default function PedidosScreen() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const data = await apiFetch<Pedido[]>("/pedidos");
      setPedidos(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function avancar(id: string, status: string) {
    await apiFetch(`/pedidos/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    await carregar();
  }

  async function cancelar(id: string) {
    Alert.alert("Cancelar pedido?", "Esta ação não pode ser desfeita.", [
      { text: "Não" },
      {
        text: "Cancelar pedido", style: "destructive",
        onPress: async () => {
          await apiFetch(`/pedidos/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: "CANCELADO" }) });
          await carregar();
        },
      },
    ]);
  }

  async function sair() {
    await clearAdminSession();
    router.replace("/");
  }

  const ativos = pedidos.filter((p) => !["ENTREGUE", "CANCELADO"].includes(p.status));

  if (loading) {
    return <View style={s.center}><ActivityIndicator color="#dc2626" /></View>;
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Pedidos</Text>
          <Text style={s.headerSub}>{ativos.length} ativo{ativos.length !== 1 ? "s" : ""}</Text>
        </View>
        <Pressable onPress={sair} style={s.sairBtn}>
          <Text style={s.sairText}>Sair</Text>
        </Pressable>
      </View>

      <FlatList
        data={pedidos}
        keyExtractor={(p) => p.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregar(); }} tintColor="#dc2626" />}
        renderItem={({ item: p }) => {
          const proximo = PROXIMO[p.status];
          const isFiado = p.metodoPagamento === "FIADO";
          return (
            <View style={[s.card, isFiado && !p.fiadoPago && { borderColor: "rgba(234,179,8,0.25)" }]}>
              <View style={s.cardHeader}>
                <View style={{ gap: 4 }}>
                  <View style={s.row}>
                    <Text style={s.codigo}>#{p.id.slice(-6).toUpperCase()}</Text>
                    <View style={[s.badge, { backgroundColor: `${STATUS_COLOR[p.status]}18` }]}>
                      <Text style={[s.badgeText, { color: STATUS_COLOR[p.status] }]}>{STATUS_LABEL[p.status]}</Text>
                    </View>
                    {isFiado && <View style={s.fiadoBadge}><Text style={s.fiadoBadgeText}>📒 Fiado</Text></View>}
                  </View>
                  {p.nomeCliente && <Text style={s.nomeCliente}>{p.nomeCliente}</Text>}
                  <Text style={s.horario}>{new Date(p.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</Text>
                </View>
                <Text style={s.total}>R$ {Number(p.total).toFixed(2)}</Text>
              </View>

              <View style={s.itens}>
                {p.itens.map((item) => (
                  <Text key={item.id} style={s.itemText}>{item.quantidade}× {item.pastel.nome}</Text>
                ))}
              </View>

              {p.status !== "ENTREGUE" && p.status !== "CANCELADO" && (
                <View style={s.actions}>
                  {proximo && (
                    <Pressable style={s.btnAvancar} onPress={() => avancar(p.id, proximo)}>
                      <Text style={s.btnAvancarText}>→ {STATUS_LABEL[proximo]}</Text>
                    </Pressable>
                  )}
                  <Pressable style={s.btnCancelar} onPress={() => cancelar(p.id)}>
                    <Text style={s.btnCancelarText}>Cancelar</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>Nenhum pedido ainda.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  center: { flex: 1, backgroundColor: "#09090b", alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: "#0c0c0f", borderBottomWidth: 1, borderBottomColor: "#18181c",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#f4f4f5" },
  headerSub: { fontSize: 12, color: "#52525b", marginTop: 2 },
  sairBtn: { backgroundColor: "#1a1a1e", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  sairText: { fontSize: 13, color: "#52525b" },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#111113", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#1e1e22",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  codigo: { fontSize: 11, fontWeight: "600", color: "#3f3f46", fontFamily: "monospace" },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  fiadoBadge: { backgroundColor: "rgba(234,179,8,0.1)", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  fiadoBadgeText: { fontSize: 11, color: "#eab308" },
  nomeCliente: { fontSize: 13, fontWeight: "700", color: "#eab308" },
  horario: { fontSize: 11, color: "#3f3f46" },
  total: { fontSize: 18, fontWeight: "900", color: "#eab308" },
  itens: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  itemText: {
    fontSize: 12, color: "#71717a", backgroundColor: "#1a1a1e",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  actions: { flexDirection: "row", gap: 8 },
  btnAvancar: { flex: 1, backgroundColor: "#dc2626", borderRadius: 8, padding: 10, alignItems: "center" },
  btnAvancarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnCancelar: {
    backgroundColor: "#1e1e22", borderRadius: 8, padding: 10, alignItems: "center",
    borderWidth: 1, borderColor: "#2e2e34",
  },
  btnCancelarText: { color: "#52525b", fontSize: 13 },
  empty: { textAlign: "center", color: "#3f3f46", marginTop: 60, fontSize: 14 },
});
