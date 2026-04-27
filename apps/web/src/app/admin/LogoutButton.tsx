"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="admin-sidebar-link"
      style={{ width: "100%", textAlign: "left", background: "none", border: "1px solid transparent", cursor: "pointer" }}
    >
      <span style={{ fontSize: "1rem", opacity: 0.5 }}>🚪</span>
      Sair
    </button>
  );
}
