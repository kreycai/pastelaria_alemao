"use client";

import Link from "next/link";
import { useState } from "react";
import { LuChevronLeft, LuMenu } from "react-icons/lu";
import SidebarNav from "./SidebarNav";
import LogoutButton from "./LogoutButton";

const FULL = "15rem";
const RAIL = "3.5rem";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>

      {/* Sidebar */}
      <aside style={{
        position: "fixed",
        top: 65,
        left: 0,
        height: "calc(100vh - 65px)",
        width: open ? FULL : RAIL,
        backgroundColor: "#0c0c0f",
        borderRight: "1px solid #18181c",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        transition: "width 0.22s ease",
        overflowX: "hidden",
        overflowY: "auto",
        flexShrink: 0,
      }}>

        {/* Cabeçalho */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
          padding: "1.125rem 0.75rem 1rem",
          flexShrink: 0,
          minWidth: 0,
        }}>
          {open && (
            <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", overflow: "hidden" }}>
              <div style={{
                height: "2rem", width: "2rem", borderRadius: "0.5rem", flexShrink: 0,
                background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.875rem", fontWeight: 900, color: "white",
                boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
              }}>P</div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#f4f4f5", lineHeight: 1.2, whiteSpace: "nowrap" }}>Pastelaria</div>
                <div style={{ fontSize: "0.65rem", color: "#52525b", lineHeight: 1.2, whiteSpace: "nowrap" }}>Alemão · Admin</div>
              </div>
            </Link>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: "0.375rem",
              backgroundColor: "transparent", border: "none",
              color: "#71717a", cursor: "pointer", flexShrink: 0,
              transition: "color 0.15s",
            }}
          >
            {open ? <LuChevronLeft size={16} /> : <LuMenu size={18} />}
          </button>
        </div>

        <div style={{ height: "1px", backgroundColor: "#18181c", margin: "0 0.5rem 0.875rem" }} />

        {open && (
          <p style={{
            padding: "0 1.125rem", marginBottom: "0.375rem",
            fontSize: "0.6rem", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.14em", color: "#2e2e34",
            whiteSpace: "nowrap",
          }}>Menu</p>
        )}

        <div style={{ flex: 1, padding: "0 0.5rem" }}>
          <SidebarNav collapsed={!open} />
        </div>

        <div style={{ borderTop: "1px solid #18181c", padding: "0.625rem 0.5rem", marginTop: "0.5rem" }}>
          <LogoutButton collapsed={!open} />
        </div>
      </aside>

      {/* Conteúdo */}
      <main style={{
        flex: 1,
        overflow: "auto",
        padding: "2.5rem 2.5rem",
        marginLeft: open ? FULL : RAIL,
        transition: "margin-left 0.22s ease",
        minWidth: 0,
      }}>
        {children}
      </main>
    </div>
  );
}
