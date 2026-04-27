import { useCallback, useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  TextInput, ActivityIndicator, Alert, Modal,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { apiFetch, Pastel } from "@/lib/api";

type Metodo = "DINHEIRO" | "PIX" | "CARTAO_DEBITO" | "CARTAO_CREDITO";
interface CartItem { pastel: Pastel; qty: number }
interface TopPastel { id: string; nome: string; preco: number; quantidade: number }

const METODOS: { key: Metodo; label: string }[] = [
  { key: "DINHEIRO", label: "💵 Dinheiro" },
  { key: "PIX", label: "📱 Pix" },
  { key: "CARTAO_DEBITO", label: "💳 Débito" },
  { key: "CARTAO_CREDITO", label: "💳 Crédito" },
];

export default function CardapioScreen() {
  const [pasteis, setPasteis] = useState<Pastel[]>([]);
  const [topPasteis, setTopPasteis] = useState<TopPastel[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState(false);
  const [nome, setNome] = useState("");
  const [metodo, setMetodo] = useState<Metodo>("DINHEIRO");
  const [obs, setObs] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(useCallback(() => {
    Promise.all([
      apiFetch<Pastel[]>("/pasteis"),
      apiFetch<TopPastel[]>("/dashboard/top-pasteis").catch(() => []),
    ]).then(([ps, top]) => {
      setPasteis(ps.filter((p) => p.disponivel));
      setTopPasteis(top);
    }).finally(() => setLoading(false));
  }, []));

  function addToCart(p: Pastel) {
    setCart((prev) => {
      const ex = prev.find((i) => i.pastel.id === p.id);
      if (ex) return prev.map((i) => i.pastel.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { pastel: p, qty: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => {
      const ex = prev.find((i) => i.pastel.id === id);
      if (!ex) return prev;
      if (ex.qty === 1) return prev.filter((i) => i.pastel.id !== id);
      return prev.map((i) => i.pastel.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  }

  const total = cart.reduce((a, i) => a + Number(i.pastel.preco) * i.qty, 0);
  const cartQty = (id: string) => cart.find((i) => i.pastel.id === id)?.qty ?? 0;
  const totalItens = cart.reduce((a, i) => a + i.qty, 0);

  async function fazerPedido() {
    if (!nome.trim()) { Alert.alert("Informe seu nome para continuar."); return; }
    setSubmitting(true);
    try {
      await apiFetch("/pedidos", {
        method: "POST",
        body: JSON.stringify({
          itens: cart.map((i) => ({ pastelId: i.pastel.id, quantidade: i.qty })),
          metodoPagamento: metodo,
          nomeCliente: nome.trim(),
          observacao: obs.trim() || undefined,
        }),
      });
      setCart([]);
      setNome(""); setObs(""); setMetodo("DINHEIRO");
      setCheckout(false);
      Alert.alert("Pedido feito! 🎉", `Aguarde: R$ ${total.toFixed(2)} — ${metodo}`);
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível enviar o pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  const maisVendidos = topPasteis;
  const salgados = pasteis.filter((p) => p.tipo === "SALGADO");
  const doces = pasteis.filter((p) => p.tipo === "DOCE");

  if (loading) {
    return <View style={s.center}><ActivityIndicator color="#dc2626" /></View>;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Cardápio</Text>
        <Text style={s.headerSub}>Pastéis fritos na hora 🔥</Text>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Mais vendidos */}
        {maisVendidos.length > 0 && (
          <View>
            <Text style={s.section}>🔥 Mais pedidos</Text>
            {maisVendidos.map((t, i) => {
              const qty = cartQty(t.id);
              // Build a Pastel-compatible object to pass to addToCart/removeFromCart
              const asPastel = pasteis.find((p) => p.id === t.id) ?? {
                id: t.id, nome: t.nome, descricao: null,
                preco: t.preco, tipo: "SALGADO" as const, disponivel: true,
              };
              return (
                <View key={t.id} style={s.card}>
                  <View style={{ width: 22 }}>
                    <Text style={{ fontSize: 12, fontWeight: "800", color: "#3f3f46" }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.nome}>{t.nome}</Text>
                    <Text style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>
                      {t.quantidade} vendido{t.quantidade !== 1 ? "s" : ""}
                    </Text>
                    <Text style={s.preco}>R$ {Number(t.preco).toFixed(2)}</Text>
                  </View>
                  <View style={s.qtyRow}>
                    {qty > 0 && (
                      <>
                        <Pressable style={s.qtyBtn} onPress={() => removeFromCart(t.id)}>
                          <Text style={s.qtyBtnText}>−</Text>
                        </Pressable>
                        <Text style={s.qtyNum}>{qty}</Text>
                      </>
                    )}
                    <Pressable style={s.addBtn} onPress={() => addToCart(asPastel)}>
                      <Text style={s.addBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {[{ label: "🧂 Salgados", list: salgados }, { label: "🍫 Doces", list: doces }].map(({ label, list }) =>
          list.length > 0 ? (
            <View key={label}>
              <Text style={s.section}>{label}</Text>
              {list.map((p) => {
                const qty = cartQty(p.id);
                return (
                  <View key={p.id} style={s.card}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.nome}>{p.nome}</Text>
                      {p.descricao ? <Text style={s.desc}>{p.descricao}</Text> : null}
                      <Text style={s.preco}>R$ {Number(p.preco).toFixed(2)}</Text>
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
            </View>
          ) : null
        )}
      </ScrollView>

      {/* Carrinho flutuante */}
      {cart.length > 0 && (
        <Pressable style={s.cartBar} onPress={() => setCheckout(true)}>
          <View style={s.cartBadge}><Text style={s.cartBadgeText}>{totalItens}</Text></View>
          <Text style={s.cartText}>Ver pedido</Text>
          <Text style={s.cartTotal}>R$ {total.toFixed(2)}</Text>
        </Pressable>
      )}

      {/* Modal checkout */}
      <Modal visible={checkout} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Seu pedido</Text>
            <Pressable onPress={() => setCheckout(false)} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
            {cart.map((i) => (
              <View key={i.pastel.id} style={s.cartItem}>
                <Text style={s.cartItemNome}>{i.qty}× {i.pastel.nome}</Text>
                <Text style={s.cartItemPreco}>R$ {(Number(i.pastel.preco) * i.qty).toFixed(2)}</Text>
              </View>
            ))}

            <View style={s.divider} />

            <Text style={s.label}>Seu nome</Text>
            <TextInput
              style={s.input} value={nome} onChangeText={setNome}
              placeholder="Ex: Maria" placeholderTextColor="#3f3f46"
            />

            <Text style={[s.label, { marginTop: 14 }]}>Pagamento</Text>
            <View style={{ gap: 6 }}>
              {METODOS.map((m) => (
                <Pressable
                  key={m.key}
                  style={[s.metodoBtn, metodo === m.key && s.metodoBtnActive]}
                  onPress={() => setMetodo(m.key)}
                >
                  <Text style={[s.metodoBtnText, metodo === m.key && { color: "#f4f4f5", fontWeight: "600" }]}>{m.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[s.label, { marginTop: 14 }]}>Observação <Text style={{ color: "#3f3f46" }}>(opcional)</Text></Text>
            <TextInput
              style={[s.input, { height: 56 }]} value={obs} onChangeText={setObs}
              placeholder="Ex: sem cebola" placeholderTextColor="#3f3f46" multiline
            />

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>R$ {total.toFixed(2)}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [s.confirmarBtn, pressed && { opacity: 0.85 }, submitting && { opacity: 0.6 }]}
              onPress={fazerPedido} disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.confirmarText}>Confirmar Pedido</Text>
              }
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
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
  body: { padding: 16, paddingBottom: 100 },
  section: {
    fontSize: 13, fontWeight: "700", color: "#71717a",
    marginTop: 16, marginBottom: 10,
  },
  card: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#111113",
    borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: "#1e1e22",
  },
  nome: { fontSize: 15, fontWeight: "700", color: "#f4f4f5" },
  desc: { fontSize: 12, color: "#52525b", marginTop: 2 },
  preco: { fontSize: 14, fontWeight: "700", color: "#eab308", marginTop: 4 },
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
  cartBar: {
    position: "absolute", bottom: 20, left: 16, right: 16,
    backgroundColor: "#dc2626", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#dc2626", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12,
  },
  cartBadge: {
    backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 99,
    width: 26, height: 26, alignItems: "center", justifyContent: "center",
  },
  cartBadgeText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  cartText: { flex: 1, color: "#fff", fontWeight: "700", fontSize: 15 },
  cartTotal: { color: "#fff", fontWeight: "800", fontSize: 16 },
  modal: { flex: 1, backgroundColor: "#09090b" },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "#1e1e22",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#f4f4f5" },
  closeBtn: { backgroundColor: "#1e1e22", borderRadius: 99, width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  closeBtnText: { color: "#71717a", fontSize: 14 },
  cartItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  cartItemNome: { fontSize: 14, color: "#d4d4d8" },
  cartItemPreco: { fontSize: 14, fontWeight: "600", color: "#eab308" },
  divider: { height: 1, backgroundColor: "#1e1e22", marginVertical: 12 },
  label: { fontSize: 12, fontWeight: "600", color: "#71717a", marginBottom: 6 },
  input: {
    backgroundColor: "#1a1a1e", borderWidth: 1, borderColor: "#2a2a30",
    borderRadius: 10, padding: 12, color: "#f4f4f5", fontSize: 14,
  },
  metodoBtn: {
    backgroundColor: "#1a1a1e", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#2a2a30",
  },
  metodoBtnActive: { backgroundColor: "rgba(220,38,38,0.1)", borderColor: "#dc2626" },
  metodoBtnText: { fontSize: 14, color: "#52525b" },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 16,
  },
  totalLabel: { fontSize: 14, color: "#52525b" },
  totalValue: { fontSize: 24, fontWeight: "900", color: "#eab308" },
  confirmarBtn: {
    marginTop: 16, backgroundColor: "#dc2626", borderRadius: 12,
    padding: 16, alignItems: "center",
  },
  confirmarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
