"use client";

import Link from "next/link";

export default function NavLinks() {
  return (
    <Link
      href="/cardapio"
      style={{
        display: "flex", alignItems: "center", gap: "0.375rem",
        backgroundColor: "#dc2626", color: "white",
        borderRadius: "0.5rem", padding: "0.45rem 1rem",
        fontSize: "0.875rem", fontWeight: 600,
        textDecoration: "none", letterSpacing: "0.01em",
      }}
    >
      🥟 Cardápio
    </Link>
  );
}
