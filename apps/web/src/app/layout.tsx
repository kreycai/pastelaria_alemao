import type { Metadata } from "next";
import Link from "next/link";
import NavLinks from "./NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pastelaria Alemão",
  description: "Os melhores pastéis da cidade",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ backgroundColor: "#09090b", color: "#f4f4f5", minHeight: "100vh" }}>
        <nav style={{
          backgroundColor: "#0c0c0f",
          borderBottom: "1px solid #18181c",
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{
            maxWidth: "80rem", margin: "0 auto",
            padding: "0 1.5rem", height: "3.5rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            {/* Logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", flexShrink: 0 }}>
              <div style={{
                height: "2rem", width: "2rem", borderRadius: "0.5rem",
                background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.9rem", fontWeight: 900, color: "white",
                boxShadow: "0 2px 8px rgba(220,38,38,0.3)",
              }}>P</div>
              <span style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#f4f4f5" }}>
                Pastelaria <span style={{ color: "#dc2626" }}>Alemão</span>
              </span>
            </Link>

            {/* Links */}
            <NavLinks />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
