"use client";

import { useRouter } from "next/navigation";
import { LuLogOut } from "react-icons/lu";

export default function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      title={collapsed ? "Sair" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: collapsed ? 0 : "0.625rem",
        width: "100%",
        padding: collapsed ? "0.5rem" : "0.5rem 0.625rem",
        borderRadius: "0.5rem",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "0.8125rem",
        fontWeight: 400,
        color: "#71717a",
        whiteSpace: "nowrap",
        overflow: "hidden",
        transition: "background-color 0.15s, color 0.15s",
      }}
    >
      <LuLogOut size={16} style={{ opacity: 0.55, flexShrink: 0 }} />
      {!collapsed && "Sair"}
    </button>
  );
}
