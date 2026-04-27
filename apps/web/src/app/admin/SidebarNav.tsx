"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuLayoutDashboard, LuReceipt, LuNotebook, LuChefHat,
  LuPackage, LuShoppingCart, LuMonitor,
} from "react-icons/lu";
import type { IconType } from "react-icons";

const navItems: { href: string; label: string; icon: IconType; exact: boolean }[] = [
  { href: "/admin",                label: "Dashboard",        icon: LuLayoutDashboard, exact: true  },
  { href: "/admin/pedidos",        label: "Caixa / Pedidos",  icon: LuReceipt,         exact: false },
  { href: "/admin/fiados",         label: "Fiados",           icon: LuNotebook,        exact: false },
  { href: "/admin/pasteis",        label: "Pastéis",          icon: LuChefHat,         exact: false },
  { href: "/admin/materias-primas",label: "Matérias-primas",  icon: LuPackage,         exact: false },
  { href: "/admin/estoque",        label: "Estoque / Compras",icon: LuShoppingCart,    exact: false },
];

const externalItems: { href: string; label: string; icon: IconType }[] = [
  { href: "/cozinha", label: "Tela da Cozinha", icon: LuMonitor },
];

export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      {navItems.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="admin-sidebar-link" data-active={active || undefined}>
            <Icon size={16} style={{ opacity: active ? 1 : 0.5, flexShrink: 0 }} />
            {item.label}
          </Link>
        );
      })}

      <div style={{ height: "1px", backgroundColor: "#1e1e22", margin: "0.5rem 0" }} />

      {externalItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} target="_blank" className="admin-sidebar-link">
            <Icon size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
            {item.label}
            <span style={{ fontSize: "0.65rem", color: "#3f3f46", marginLeft: "auto" }}>↗</span>
          </Link>
        );
      })}
    </nav>
  );
}
