"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuLayoutDashboard, LuReceipt, LuNotebook, LuChefHat,
  LuPackage, LuShoppingCart, LuMonitor, LuSmartphone,
} from "react-icons/lu";
import type { IconType } from "react-icons";

const navItems: { href: string; label: string; icon: IconType; exact: boolean }[] = [
  { href: "/admin",                 label: "Dashboard",         icon: LuLayoutDashboard, exact: true  },
  { href: "/admin/pedidos",         label: "Caixa / Pedidos",   icon: LuReceipt,         exact: false },
  { href: "/admin/fiados",          label: "Fiados",            icon: LuNotebook,        exact: false },
  { href: "/admin/pasteis",         label: "Pastéis",           icon: LuChefHat,         exact: false },
  { href: "/admin/materias-primas", label: "Matérias-primas",   icon: LuPackage,         exact: false },
  { href: "/admin/estoque",         label: "Estoque / Compras", icon: LuShoppingCart,    exact: false },
];

const externalItems: { href: string; label: string; icon: IconType }[] = [
  { href: "/cozinha",      label: "Tela da Cozinha", icon: LuMonitor    },
  { href: "/admin/mobile", label: "App Mobile",      icon: LuSmartphone },
];

export default function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "flex-start",
    gap: collapsed ? 0 : "0.625rem",
    padding: collapsed ? "0.5rem" : "0.5rem 0.625rem",
    borderRadius: "0.5rem",
    fontSize: "0.8125rem",
    fontWeight: active ? 600 : 400,
    color: active ? "#f4f4f5" : "#71717a",
    backgroundColor: active ? "#18181c" : "transparent",
    textDecoration: "none",
    transition: "background-color 0.15s, color 0.15s",
    whiteSpace: "nowrap",
    overflow: "hidden",
  });

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
      {navItems.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} style={linkStyle(active)} title={collapsed ? item.label : undefined}>
            <Icon size={16} style={{ opacity: active ? 1 : 0.55, flexShrink: 0 }} />
            {!collapsed && item.label}
          </Link>
        );
      })}

      <div style={{ height: "1px", backgroundColor: "#1e1e22", margin: "0.375rem 0" }} />

      {externalItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} target="_blank" style={linkStyle(false)} title={collapsed ? item.label : undefined}>
            <Icon size={16} style={{ opacity: 0.55, flexShrink: 0 }} />
            {!collapsed && (
              <>
                {item.label}
                <span style={{ fontSize: "0.6rem", color: "#3f3f46", marginLeft: "auto" }}>↗</span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
