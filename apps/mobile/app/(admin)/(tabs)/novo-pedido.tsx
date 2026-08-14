import { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, Pressable, StyleSheet,
  TextInput, ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch, Pastel } from "@/lib/api";

type Metodo = "DINHEIRO" | "PIX" | "CARTAO_DEBITO" | "CARTAO_CREDITO" | "FIADO";
interface CartItem { pastel: Pastel; qty: number }

const METODOS: { key: Metodo; label: string }[] = [
  { key: "DINHEIRO", label: "💵 Dinheiro" },
  { key: "PIX", label: "📱 Pix" },
  { key: "CARTAO_DEBITO", label: "💳 Débito" },
  { key: "CARTAO_CREDITO", label: "💳 Crédito" },
  { key: "FIADO", label: "📒 Fiado" },
];

export default function NovoPedidoScreen() {
  const [pasteis, setPasteis] = useState<Pastel[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metodo, setMetodo] = useState<Metodo>("DINHEIRO");
  const [nomeCliente, setNomeCliente] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPasteis, setLoadingPasteis] = useState(true);

  useFocusEffect(useCallback(() => {
    apiFetch<Pastel[]>("/pasteis")
      .then((data) => setPasteis(data.filter((p) => p.disponivel)))
      .finally(() => setLoadingPasteis(false));
  }, []));

  function addToCart(pastel: Pastel) {
    setCart((prev) => {
      const existing = prev.find((i) => i.pastel.id === pastel.id);
      if (existing) return prev.map((i) => i.pastel.id === pastel.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { pastel, qty: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.pastel.id === id);
      if (!existing) return prev;
      if (existing.qty === 1) return prev.filter((i) => i.pastel.id !== id);
      return prev.map((i) => i.pastel.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  }

  const total = cart.reduce((a, i) => a + Number(i.pastel.preco) * i.qty, 0);
  const cartQty = (id: string) => cart.find((i) => i.pastel.id === id)?.qty ?? 0;

  async function confirmar() {
    if (cart.length === 0) return;
    if (metodo === "FIADO" && !nomeCliente.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome do cliente para fiado.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: cart.map((i) => ({ pastelId: i.pastel.id, quantidade: i.qty })),
          metodoPagamento: metodo,
          nomeCliente: metodo === "FIADO" ? nomeCliente.trim() : undefined,
          observacao: observacao.trim() || undefined,
        }),
      });
      setCart([]);
      setNomeCliente("");
      setObservacao("");
      setMetodo("DINHEIRO");
      Alert.alert("✓ Pedido registrado!", `Total: R$ ${total.toFixed(2)}`);
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível registrar o pedido.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingPasteis) {
    return <View style={s.center}><ActivityIndicator color="#dc2626" /></View>;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Novo Pedido</Text>
        <Text style={s.headerSub}>Pedido para a mesa / balcão</Text>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Cardápio */}
        <Text style={s.section}>Cardápio</Text>
        {pasteis.map((p) => {
          const qty = cartQty(p.id);
          return (
            <View key={p.id} style={s.pastelRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.pastelNome}>{p.nome}</Text>
                <Text style={s.pastelPreco}>R$ {Number(p.preco).toFixed(2)}</Text>
              </View>
              <View style={s.qtyRow}>
                {qty > 0 && (
                  <>
                    <Pressable style={s.qtyBtn} onPress={() => removeFromCart(p.id)}>
                      <Text style={s.qtyBtnText}>−</Text>
                    </Pressable>
                    <Text style={s.qtyNum}>{qty}</Text>
                  </>
                )}
                <Pressable style={s.addBtn} onPress={() => addToCart(p)}>
                  <Text style={s.addBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        {/* Método de pagamento */}
        <Text style={[s.section, { marginTop: 20 }]}>Pagamento</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <View style={{ flexDirection: "row", gap: 8, paddingRight: 4 }}>
            {METODOS.map((m) => (
              <Pressable
                key={m.key}
                style={[s.metodoBtn, metodo === m.key && s.metodoBtnActive]}
                onPress={() => setMetodo(m.key)}
              >
                <Text style={[s.metodoBtnText, metodo === m.key && s.metodoBtnTextActive]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {metodo === "FIADO" && (
          <View style={s.fiadoBox}>
            <Text style={s.fiadoLabel}>Nome do cliente (fiado)</Text>
            <TextInput
              style={s.input}
              value={nomeCliente}
              onChangeText={setNomeCliente}
              placeholder="Ex: João da Silva"
              placeholderTextColor="#3f3f46"
            />
          </View>
        )}

        {/* Observação */}
        <Text style={[s.section, { marginTop: 16 }]}>Observação <Text style={{ color: "#3f3f46", fontWeight: "400" }}>(opcional)</Text></Text>
        <TextInput
          style={[s.input, { height: 60 }]}
          value={observacao}
          onChangeText={setObservacao}
          placeholder="Ex: sem cebola"
          placeholderTextColor="#3f3f46"
          multiline
        />

        {/* Total + confirmar */}
        {cart.length > 0 && (
          <View style={s.totalBox}>
            <View>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>R$ {total.toFixed(2)}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [s.confirmarBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
              onPress={confirmar} disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.confirmarText}>Registrar Pedido</Text>}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  center: { flex: 1, backgroundColor: "#09090b", alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: "#0c0c0f", borderBottomWidth: 1, borderBottomColor: "#18181c",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#f4f4f5" },
  headerSub: { fontSize: 12, color: "#52525b", marginTop: 2 },
  body: { padding: 16, paddingBottom: 40 },
  section: { fontSize: 11, fontWeight: "700", color: "#3f3f46", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  pastelRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#111113", borderRadius: 12, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: "#1e1e22",
  },
  pastelNome: { fontSize: 14, fontWeight: "600", color: "#f4f4f5" },
  pastelPreco: { fontSize: 13, color: "#eab308", marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    backgroundColor: "#1e1e22", borderRadius: 8, width: 30, height: 30,
    alignItems: "center", justifyContent: "center",
  },
  qtyBtnText: { color: "#f4f4f5", fontSize: 18, lineHeight: 22 },
  qtyNum: { fontSize: 15, fontWeight: "700", color: "#f4f4f5", minWidth: 20, textAlign: "center" },
  addBtn: {
    backgroundColor: "#dc2626", borderRadius: 8, width: 30, height: 30,
    alignItems: "center", justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 18, lineHeight: 22 },
  metodoBtn: {
    backgroundColor: "#1a1a1e", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "#2a2a30",
  },
  metodoBtnActive: { backgroundColor: "rgba(220,38,38,0.12)", borderColor: "#dc2626" },
  metodoBtnText: { fontSize: 13, color: "#52525b" },
  metodoBtnTextActive: { color: "#f4f4f5", fontWeight: "600" },
  fiadoBox: {
    marginTop: 10, backgroundColor: "rgba(234,179,8,0.05)", borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: "rgba(234,179,8,0.2)",
  },
  fiadoLabel: { fontSize: 12, color: "#ca8a04", fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#1a1a1e", borderWidth: 1, borderColor: "#2a2a30",
    borderRadius: 10, padding: 12, color: "#f4f4f5", fontSize: 14,
  },
  totalBox: {
    marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#111113", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#1e1e22",
  },
  totalLabel: { fontSize: 12, color: "#52525b" },
  totalValue: { fontSize: 22, fontWeight: "900", color: "#eab308" },
  confirmarBtn: {
    backgroundColor: "#dc2626", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12,
  },
  confirmarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
