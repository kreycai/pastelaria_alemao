import { useCallback, useState } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch, MateriaPrima } from "@/lib/api";

interface StockItem extends MateriaPrima {
  checked: boolean;
  precisaComprar: number;
}

function formatQtd(gramas: number, unidade: "KG" | "UNIDADE") {
  if (unidade === "UNIDADE") return `${gramas.toFixed(0)} un`;
  if (gramas >= 1000) return `${(gramas / 1000).toFixed(2).replace(/\.?0+$/, "")} kg`;
  return `${gramas.toFixed(0)} g`;
}

export default function EstoqueScreen() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const all = await apiFetch<MateriaPrima[]>("/materias-primas");
      const baixos = all
        .filter((m) => Number(m.estoqueGramas) <= Number(m.estoqueMinimo))
        .map((m) => ({
          ...m,
          checked: false,
          precisaComprar: Math.max(0, Number(m.estoqueMinimo) - Number(m.estoqueGramas) + (m.unidade === "KG" ? 500 : 2)),
        }))
        .sort((a, b) => Number(a.estoqueGramas) - Number(b.estoqueGramas));
      setItems(baixos);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  function toggle(id: string) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));
  }

  function resetChecks() {
    setItems((prev) => prev.map((i) => ({ ...i, checked: false })));
  }

  const checked = items.filter((i) => i.checked).length;

  if (loading) {
    return <View style={s.center}><ActivityIndicator color="#dc2626" /></View>;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Lista de Compras</Text>
          <Text style={s.headerSub}>Itens abaixo do estoque mínimo</Text>
        </View>
        {checked > 0 && (
          <Pressable onPress={resetChecks} style={s.resetBtn}>
            <Text style={s.resetText}>Limpar ({checked})</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>✓</Text>
          <Text style={s.emptyTitle}>Tudo em dia!</Text>
          <Text style={s.emptyDesc}>Nenhum item abaixo do mínimo.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); carregar(); }}
              tintColor="#dc2626"
            />
          }
          ListHeaderComponent={
            <View style={s.summary}>
              <Text style={s.summaryText}>{items.length} item{items.length !== 1 ? "s" : ""} para comprar</Text>
              <Text style={s.summaryChecked}>{checked} marcado{checked !== 1 ? "s" : ""}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable style={[s.card, item.checked && s.cardChecked]} onPress={() => toggle(item.id)}>
              <View style={[s.checkbox, item.checked && s.checkboxChecked]}>
                {item.checked && <Text style={s.checkmark}>✓</Text>}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[s.nome, item.checked && s.nomeChecked]}>{item.nome}</Text>
                <View style={s.row}>
                  <Text style={s.tag}>{item.unidade === "KG" ? "kg" : "un"}</Text>
                  <Text style={s.stock}>
                    Atual: <Text style={{ color: "#ef4444" }}>{formatQtd(Number(item.estoqueGramas), item.unidade)}</Text>
                  </Text>
                  {Number(item.estoqueMinimo) > 0 && (
                    <Text style={s.stock}>
                      Mín: {formatQtd(Number(item.estoqueMinimo), item.unidade)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={s.comprarBox}>
                <Text style={s.comprarLabel}>Comprar</Text>
                <Text style={s.comprarQtd}>{formatQtd(item.precisaComprar, item.unidade)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
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
  resetBtn: { backgroundColor: "#1e1e22", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  resetText: { fontSize: 12, color: "#71717a" },
  list: { padding: 16, gap: 8 },
  summary: {
    flexDirection: "row", justifyContent: "space-between",
    marginBottom: 12, paddingHorizontal: 2,
  },
  summaryText: { fontSize: 12, color: "#52525b" },
  summaryChecked: { fontSize: 12, color: "#22c55e" },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#111113", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#1e1e22",
  },
  cardChecked: { opacity: 0.45, borderColor: "#22c55e" },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: "#2e2e34",
    alignItems: "center", justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#22c55e", borderColor: "#22c55e" },
  checkmark: { fontSize: 13, color: "#fff", fontWeight: "800" },
  nome: { fontSize: 15, fontWeight: "700", color: "#f4f4f5", marginBottom: 4 },
  nomeChecked: { textDecorationLine: "line-through", color: "#52525b" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  tag: {
    fontSize: 10, fontWeight: "700", color: "#52525b", backgroundColor: "#1e1e22",
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  stock: { fontSize: 12, color: "#52525b" },
  comprarBox: { alignItems: "flex-end" },
  comprarLabel: { fontSize: 10, color: "#52525b", textTransform: "uppercase" },
  comprarQtd: { fontSize: 15, fontWeight: "900", color: "#dc2626", marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#22c55e" },
  emptyDesc: { fontSize: 13, color: "#3f3f46", marginTop: 4 },
});
