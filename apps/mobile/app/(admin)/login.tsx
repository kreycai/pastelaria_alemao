import { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { apiFetch } from "@/lib/api";
import { saveAdminSession } from "@/lib/store";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      await saveAdminSession();
      router.replace("/(admin)/(tabs)/pedidos");
    } catch {
      setError("Usuário ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.container}>
      <View style={s.inner}>
        <View style={s.hero}>
          <View style={s.logoBox}><Text style={s.logoText}>P</Text></View>
          <Text style={s.title}>Admin</Text>
          <Text style={s.subtitle}>Pastelaria Alemão</Text>
        </View>

        <View style={s.card}>
          <Text style={s.label}>Usuário</Text>
          <TextInput
            style={s.input} value={username} onChangeText={setUsername}
            placeholder="admin" placeholderTextColor="#3f3f46"
            autoCapitalize="none" autoCorrect={false}
          />

          <Text style={[s.label, { marginTop: 14 }]}>Senha</Text>
          <TextInput
            style={s.input} value={password} onChangeText={setPassword}
            placeholder="••••••••" placeholderTextColor="#3f3f46"
            secureTextEntry
          />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [s.btn, pressed && { opacity: 0.8 }, loading && { opacity: 0.6 }]}
            onPress={handleLogin} disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Entrar</Text>
            }
          </Pressable>
        </View>

        <Pressable onPress={() => router.replace("/")} style={s.backBtn}>
          <Text style={s.backText}>← Voltar ao início</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#09090b" },
  inner: { flex: 1, padding: 24, justifyContent: "center" },
  hero: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 56, height: 56, borderRadius: 14, backgroundColor: "#dc2626",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  logoText: { fontSize: 24, fontWeight: "900", color: "#fff" },
  title: { fontSize: 22, fontWeight: "800", color: "#f4f4f5" },
  subtitle: { fontSize: 13, color: "#52525b", marginTop: 2 },
  card: {
    backgroundColor: "#111113", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#1e1e22",
  },
  label: { fontSize: 12, fontWeight: "600", color: "#71717a", marginBottom: 6 },
  input: {
    backgroundColor: "#1a1a1e", borderWidth: 1, borderColor: "#2a2a30",
    borderRadius: 10, padding: 12, color: "#f4f4f5", fontSize: 15,
  },
  error: {
    marginTop: 10, padding: 10, backgroundColor: "rgba(220,38,38,0.08)",
    borderRadius: 8, color: "#f87171", fontSize: 13,
    borderWidth: 1, borderColor: "rgba(220,38,38,0.2)",
  },
  btn: {
    marginTop: 18, backgroundColor: "#dc2626", borderRadius: 10,
    padding: 14, alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  backBtn: { marginTop: 20, alignItems: "center" },
  backText: { color: "#3f3f46", fontSize: 13 },
});
