import Link from "next/link";
import type { ReactNode } from "react";
import SidebarNav from "./SidebarNav";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
      <aside style={{
        width: "15rem",
        flexShrink: 0,
        backgroundColor: "#0c0c0f",
        borderRight: "1px solid #18181c",
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem 0.75rem",
      }}>
        {/* Brand */}
        <div style={{ padding: "0 0.5rem", marginBottom: "1.5rem" }}>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
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
        </div>

        <div style={{ height: "1px", backgroundColor: "#18181c", marginBottom: "1rem" }} />

        <p style={{
          padding: "0 0.5rem", marginBottom: "0.5rem",
          fontSize: "0.65rem", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.12em", color: "#2e2e34",
        }}>Menu</p>

        <div style={{ flex: 1 }}>
          <SidebarNav />
        </div>

        <div style={{ borderTop: "1px solid #18181c", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
          <LogoutButton />
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto", padding: "2.5rem 2.5rem" }}>
        {children}
      </main>
    </div>
  );
}
