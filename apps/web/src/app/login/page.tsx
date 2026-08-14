"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Usuário ou senha incorretos");
        return;
      }
      router.push(from);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#09090b",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.06) 0%, transparent 60%)",
    }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "4rem", height: "4rem",
            borderRadius: "1rem",
            background: "linear-gradient(135deg, #dc2626, #b91c1c)",
            fontSize: "1.75rem",
            marginBottom: "1rem",
            boxShadow: "0 8px 24px rgba(220,38,38,0.3)",
          }}>🥟</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f4f4f5", margin: 0, letterSpacing: "-0.02em" }}>
            Pastelaria <span style={{ color: "#dc2626" }}>Alemão</span>
          </h1>
          <p style={{ marginTop: "0.375rem", fontSize: "0.875rem", color: "#52525b" }}>
            Área administrativa
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: "#111113",
          border: "1px solid #1e1e22",
          borderRadius: "1rem",
          padding: "2rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.5rem", color: "#f4f4f5" }}>
            Entrar na conta
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.75rem", fontWeight: 500, color: "#71717a" }}>
                Usuário
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "0.75rem", fontWeight: 500, color: "#71717a" }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                borderRadius: "0.5rem", padding: "0.625rem 0.75rem",
                backgroundColor: "rgba(220,38,38,0.08)",
                border: "1px solid rgba(220,38,38,0.2)",
                fontSize: "0.8125rem", color: "#f87171",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "0.5rem",
                borderRadius: "0.625rem",
                padding: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                backgroundColor: loading ? "#991b1b" : "#dc2626",
                color: "white",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "background-color 0.15s, opacity 0.15s",
                width: "100%",
              }}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
