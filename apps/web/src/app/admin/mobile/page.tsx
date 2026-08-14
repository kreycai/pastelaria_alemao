"use client";

import { LuSmartphone, LuDownload, LuRefreshCw } from "react-icons/lu";

const APK_URL = "/app.apk";
const APK_VERSION = "1.0.0";

export default function MobilePage() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "0.625rem",
          background: "linear-gradient(135deg, #dc2626, #b91c1c)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <LuSmartphone size={20} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f4f4f5", margin: 0 }}>App Mobile</h1>
          <p style={{ fontSize: "0.75rem", color: "#71717a", margin: 0 }}>Pastelaria Alemão</p>
        </div>
      </div>

      {/* Android */}
      <div style={{
        backgroundColor: "#111113", border: "1px solid #1e1e22",
        borderRadius: "1rem", padding: "1.5rem", marginBottom: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.25rem" }}>🤖</span>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#f4f4f5", margin: 0 }}>Android</h2>
          <span style={{
            fontSize: "0.7rem", backgroundColor: "#1e1e22", color: "#a1a1aa",
            borderRadius: "9999px", padding: "0.125rem 0.5rem",
          }}>v{APK_VERSION}</span>
        </div>
        <p style={{ fontSize: "0.875rem", color: "#71717a", marginBottom: "1rem" }}>
          Baixe e instale o APK diretamente no seu dispositivo Android.
          Habilite "Fontes desconhecidas" nas configurações caso necessário.
        </p>
        <a
          href={APK_URL}
          download
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            backgroundColor: "#dc2626", color: "white",
            borderRadius: "0.5rem", padding: "0.625rem 1.25rem",
            fontSize: "0.875rem", fontWeight: 600, textDecoration: "none",
            opacity: APK_URL === "#" ? 0.5 : 1,
            pointerEvents: APK_URL === "#" ? "none" : "auto",
          }}
        >
          <LuDownload size={16} />
          Baixar APK
        </a>
      </div>

      {/* iOS */}
      <div style={{
        backgroundColor: "#111113", border: "1px solid #1e1e22",
        borderRadius: "1rem", padding: "1.5rem", marginBottom: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.25rem" }}>🍎</span>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#f4f4f5", margin: 0 }}>iOS</h2>
        </div>
        <p style={{ fontSize: "0.875rem", color: "#71717a", marginBottom: "0.75rem" }}>
          No iPhone, instale o <strong style={{ color: "#d4d4d8" }}>Expo Go</strong> pela App Store e acesse o app pelo link abaixo.
        </p>
        <p style={{
          backgroundColor: "#0c0c0f", borderRadius: "0.5rem", padding: "0.75rem",
          fontSize: "0.8rem", fontFamily: "monospace", color: "#a1a1aa",
          wordBreak: "break-all",
        }}>
          exp://exp.host/@seu-usuario/pastelaria_alemao
        </p>
      </div>

      {/* Atualização */}
      <div style={{
        backgroundColor: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.15)",
        borderRadius: "0.75rem", padding: "1rem",
        display: "flex", alignItems: "flex-start", gap: "0.75rem",
      }}>
        <LuRefreshCw size={16} style={{ color: "#eab308", marginTop: 2, flexShrink: 0 }} />
        <p style={{ fontSize: "0.8rem", color: "#a1a1aa", margin: 0 }}>
          Quando houver uma nova versão do app, o link de download será atualizado automaticamente aqui.
        </p>
      </div>
    </div>
  );
}
