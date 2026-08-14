import { useState } from "react";
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { apiFetch, Pedido } from "@/lib/api";

function diasDesde(data: string) {
  return Math.floor((Date.now() - new Date(data).getTime()) / (1000 * 60 * 60 * 24));
}

export default function FiadoScreen() {
  const [busca, setBusca] = useState("");
  const [fiados, setFiados] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscou, setBuscou] = useState(false);

  async function buscar() {
    if (!busca.trim()) return;
    setLoading(true);
    setBuscou(false);
    try {
      const data = await apiFetch<Pedido[]>(`/pedidos/fiados?nome=${encodeURIComponent(busca.trim())}`);
      setFiados(data);
      setBuscou(true);
    } finally {
      setLoading(false);
    }
  }

  const pendentes = fiados.filter((f) => !f.fiadoPago);
  const pagos = fiados.filter((f) => f.fiadoPago);
  const totalPendente = pendentes.reduce((a, f) => a + Number(f.total), 0);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Meu Fiado</Text>
        <Text style={s.headerSub}>Consulte o que você deve</Text>
      </View>

      <View style={s.searchBox}>
        <TextInput
          style={s.input}
          value={busca}
          onChangeText={setBusca}
          placeholder="Digite seu nome"
          placeholderTextColor="#3f3f46"
          onSubmitEditing={buscar}
          returnKeyType="search"
        />
        <Pressable
          style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
          onPress={buscar}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Buscar</Text>}
        </Pressable>
      </View>

      {buscou && (
        <>
          {pendentes.length > 0 && (
            <View style={s.totalBanner}>
              <Text style={s.totalBannerLabel}>Total que você deve</Text>
              <Text style={s.totalBannerValue}>R$ {totalPendente.toFixed(2)}</Text>
            </View>
          )}

          <FlatList
            data={[...pendentes, ...pagos]}
            keyExtractor={(f) => f.id}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <View style={s.emptyBox}>
                <Text style={s.emptyEmoji}>✓</Text>
                <Text style={s.emptyTitle}>Nenhum fiado encontrado</Text>
                <Text style={s.emptyDesc}>Não há fiados para "{busca}"</Text>
              </View>
            }
            renderItem={({ item: f }) => {
              const dias = diasDesde(f.createdAt);
              return (
                <View style={[s.card, f.fiadoPago && s.cardPago]}>
                  <View style={s.cardHeader}>
                    <View style={{ gap: 2 }}>
                      <View style={s.row}>
                        <Text style={s.data}>{new Date(f.createdAt).toLocaleDateString("pt-BR")}</Text>
                        {f.fiadoPago ? (
                          <View style={s.pagoBadge}><Text style={s.pagoBadgeText}>✓ Pago</Text></View>
                        ) : (
                          <View style={s.pendenteBadge}>
                            <Text style={s.pendenteBadgeText}>{dias === 0 ? "Hoje" : `${dias}d`}</Text>
                          </View>
                        )}
                      </View>
                      {f.previsaoPagamento && !f.fiadoPago && (
                        <Text style={s.previsao}>
                          Previsão: {new Date(f.previsaoPagamento).toLocaleDateString("pt-BR")}
                        </Text>
                      )}
                    </View>
                    <Text style={[s.valor, f.fiadoPago && { color: "#52525b" }]}>
                      R$ {Number(f.total).toFixed(2)}
                    </Text>
                  </View>

                  <View style={s.itens}>
                    {f.itens.map((i) => (
                      <Text key={i.id} style={s.itemText}>{i.quantidade}× {i.pastel.nome}</Text>
                    ))}
                  </View>
                </View>
              );
            }}
          />
        </>
      )}

      {!buscou && !loading && (
        <View style={s.hint}>
          <Text style={s.hintEmoji}>📒</Text>
          <Text style={s.hintText}>Digite seu nome para ver{"\n"}o que está fiado</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: "#0c0c0f", borderBottomWidth: 1, borderBottomColor: "#18181c",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#f4f4f5" },
  headerSub: { fontSize: 12, color: "#52525b", marginTop: 2 },
  searchBox: {
    flexDirection: "row", gap: 10, padding: 16,
    borderBottomWidth: 1, borderBottomColor: "#1a1a1e",
  },
  input: {
    flex: 1, backgroundColor: "#1a1a1e", borderWidth: 1, borderColor: "#2a2a30",
    borderRadius: 10, padding: 12, color: "#f4f4f5", fontSize: 15,
  },
  btn: { backgroundColor: "#dc2626", borderRadius: 10, paddingHorizontal: 18, justifyContent: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  totalBanner: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: "rgba(234,179,8,0.08)",
    borderRadius: 12, padding: 14, flexDirection: "row",
    justifyContent: "space-between", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(234,179,8,0.2)",
  },
  totalBannerLabel: { fontSize: 13, color: "#71717a" },
  totalBannerValue: { fontSize: 22, fontWeight: "900", color: "#eab308" },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#111113", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "rgba(234,179,8,0.2)",
  },
  cardPago: { borderColor: "#1e1e22", opacity: 0.6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  data: { fontSize: 12, color: "#52525b" },
  pagoBadge: { backgroundColor: "rgba(34,197,94,0.1)", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  pagoBadgeText: { fontSize: 11, color: "#22c55e", fontWeight: "600" },
  pendenteBadge: { backgroundColor: "rgba(234,179,8,0.1)", borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  pendenteBadgeText: { fontSize: 11, color: "#eab308", fontWeight: "600" },
  previsao: { fontSize: 11, color: "#52525b" },
  valor: { fontSize: 18, fontWeight: "900", color: "#eab308" },
  itens: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  itemText: {
    fontSize: 12, color: "#71717a", backgroundColor: "#1a1a1e",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  emptyBox: { alignItems: "center", paddingTop: 40 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#f4f4f5" },
  emptyDesc: { fontSize: 13, color: "#52525b", marginTop: 4, textAlign: "center" },
  hint: { flex: 1, alignItems: "center", justifyContent: "center" },
  hintEmoji: { fontSize: 48, marginBottom: 12 },
  hintText: { fontSize: 15, color: "#3f3f46", textAlign: "center", lineHeight: 22 },
});
