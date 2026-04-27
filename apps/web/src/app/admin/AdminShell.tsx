"use client";

import Link from "next/link";
import { useState } from "react";
import { LuMenu, LuX } from "react-icons/lu";
import SidebarNav from "./SidebarNav";
import LogoutButton from "./LogoutButton";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 65px)", position: "relative" }}>

      {/* Overlay para fechar no mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            backgroundColor: "rgba(0,0,0,0.6)",
          }}
        />
      )}

      {/* Botão hamburger (mobile) */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed", top: "calc(65px + 0.75rem)", left: "0.75rem",
          zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36, borderRadius: "0.5rem",
          backgroundColor: "#18181c", border: "1px solid #27272a",
          color: "#f4f4f5", cursor: "pointer",
        }}
        aria-label="Menu"
      >
        {open ? <LuX size={18} /> : <LuMenu size={18} />}
      </button>

      {/* Sidebar */}
      <aside style={{
        position: "fixed",
        top: 65,
        left: 0,
        height: "calc(100vh - 65px)",
        width: "15rem",
        flexShrink: 0,
        backgroundColor: "#0c0c0f",
        borderRight: "1px solid #18181c",
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem 0.75rem",
        zIndex: 50,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.2s ease",
        overflowY: "auto",
      }}>
        {/* Brand + fechar */}
        <div style={{ padding: "0 0.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/admin" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
            <div style={{
              height: "2rem", width: "2rem", borderRadius: "0.5rem",
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.875rem", fontWeight: 900, color: "white",
              boxShadow: "0 2px 8px rgba(220,38,38,0.35)",
            }}>P</div>
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f4f4f5", lineHeight: 1.2 }}>Pastelaria</div>
              <div style={{ fontSize: "0.65rem", color: "#52525b", lineHeight: 1.2 }}>Alemão · Admin</div>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: "0.375rem",
              backgroundColor: "transparent", border: "none",
              color: "#52525b", cursor: "pointer",
            }}
          >
            <LuX size={16} />
          </button>
        </div>

        <div style={{ height: "1px", backgroundColor: "#18181c", marginBottom: "1rem" }} />

        <p style={{
          padding: "0 0.5rem", marginBottom: "0.5rem",
          fontSize: "0.65rem", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.12em", color: "#2e2e34",
        }}>Menu</p>

        <div style={{ flex: 1 }} onClick={() => setOpen(false)}>
          <SidebarNav />
        </div>

        <div style={{ borderTop: "1px solid #18181c", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
          <LogoutButton />
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main style={{ flex: 1, overflow: "auto", padding: "2.5rem 1rem 2.5rem 3.5rem" }}>
        {children}
      </main>
    </div>
  );
}
