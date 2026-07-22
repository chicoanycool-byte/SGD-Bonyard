"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  ScrollText,
  Truck,
  BarChart3,
  MessageSquareText,
  Settings,
  Star,
} from "lucide-react";

// Ajusta este arreglo a tus módulos reales / permisos por rol.
// href debe coincidir con tus rutas actuales del App Router.
const NAV_ITEMS = [
  { label: "Inicio", href: "/inicio", icon: Home },
  { label: "Control Documental", href: "/documentos", icon: FileText },
  { label: "Recorridos BPA", href: "/recorridos", icon: ClipboardCheck },
  { label: "Matriz Requisitos Legales", href: "/requisitos-legales", icon: ScrollText },
  { label: "No Conformidades (PNC)", href: "/pnc", icon: AlertTriangle },
  { label: "Acciones Correctivas (AC/AP)", href: "/ac-ap", icon: ClipboardCheck },
  { label: "Proveedores Críticos", href: "/proveedores", icon: Truck },
  { label: "Indicadores", href: "/indicadores", icon: BarChart3 },
  { label: "Tu Asesor", href: "/asesor", icon: MessageSquareText },
  { label: "Administración", href: "/admin", icon: Settings },
];

const QUICK_ACCESS = [
  { label: "Mis Documentos Favoritos", href: "/documentos?filtro=favoritos" },
  { label: "Recorridos BPA", href: "/recorridos" },
  { label: "Matriz de Requisitos Legales", href: "/requisitos-legales" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-brand-900 text-white min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <Image
          src="/logobonyard.png"
          alt="Bon Yard"
          width={36}
          height={36}
          className="rounded bg-white/95 p-1"
        />
        <div className="leading-tight">
          <p className="font-semibold text-sm tracking-wide">BON YARD</p>
          <p className="text-[11px] text-white/60">SGD · Sistema de Gestión</p>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full brand-gradient" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Accesos rápidos */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-[11px] uppercase tracking-wider text-white/40 mb-2 px-1">
          Accesos rápidos
        </p>
        <ul className="space-y-1.5">
          {QUICK_ACCESS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-2 text-xs text-white/60 hover:text-white px-1 py-1"
              >
                <Star size={12} className="text-brand-green-light" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
