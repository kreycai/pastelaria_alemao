import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getAdminSession } from "@/lib/store";

export default function IndexScreen() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getAdminSession().then((isAdmin) => {
      if (isAdmin) router.replace("/(admin)/(tabs)/pedidos");
      else setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View style={[s.container, { justifyContent: "center" }]}>
        <ActivityIndicator color="#dc2626" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.hero}>
        <Text style={s.emoji}>🥟</Text>
        <Text style={s.title}>Pastelaria{"\n"}<Text style={s.titleRed}>Alemão</Text></Text>
        <Text style={s.subtitle}>Bem-vindo! Como deseja continuar?</Text>
      </View>

      <View style={s.buttons}>
        <Pressable
          style={({ pressed }) => [s.btnPrimary, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/(cliente)/cardapio")}
        >
          <Text style={s.btnPrimaryIcon}>🛒</Text>
          <View>
            <Text style={s.btnPrimaryLabel}>Sou Cliente</Text>
            <Text style={s.btnPrimaryDesc}>Ver cardápio, fazer pedido, ver fiado</Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [s.btnSecondary, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/(admin)/login")}
        >
          <Text style={s.btnSecondaryIcon}>🔐</Text>
          <View>
            <Text style={s.btnSecondaryLabel}>Admin / Funcionário</Text>
            <Text style={s.btnSecondaryDesc}>Pedidos, caixa, estoque</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b", padding: 24 },
  hero: { flex: 1, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 34, fontWeight: "800", color: "#f4f4f5", textAlign: "center", lineHeight: 40 },
  titleRed: { color: "#dc2626" },
  subtitle: { marginTop: 8, fontSize: 14, color: "#52525b", textAlign: "center" },
  buttons: { gap: 12, paddingBottom: 16 },
  btnPrimary: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#dc2626", borderRadius: 14, padding: 18,
  },
  btnPrimaryIcon: { fontSize: 28 },
  btnPrimaryLabel: { fontSize: 16, fontWeight: "700", color: "#fff" },
  btnPrimaryDesc: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  btnSecondary: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#111113", borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: "#1e1e22",
  },
  btnSecondaryIcon: { fontSize: 28 },
  btnSecondaryLabel: { fontSize: 16, fontWeight: "700", color: "#f4f4f5" },
  btnSecondaryDesc: { fontSize: 12, color: "#52525b", marginTop: 2 },
});
