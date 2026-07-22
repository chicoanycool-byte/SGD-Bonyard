'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Home,
  FileText,
  FilePlus2,
  FileEdit,
  ClipboardCheck,
  MessageSquareWarning,
  Wrench,
  BarChart3,
  Users2,
  Building2,
  Truck,
  ClipboardList,
  ScaleIcon,
  PackageX,
  ListChecks,
  UserCog,
  Activity,
  Bot,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { cerrarSesion } from '@/lib/sesion/actions'

type Item = { href: string; label: string }

const ICONOS: Record<string, LucideIcon> = {
  '/inicio': Home,
  '/documentos': FileText,
  '/documentos-alta': FilePlus2,
  '/solicitudes': FileEdit,
  '/auditorias': ClipboardCheck,
  '/quejas': MessageSquareWarning,
  '/ac-ap': Wrench,
  '/indicadores': BarChart3,
  '/reunion-haccp': Users2,
  '/revision-direccion': Building2,
  '/proveedores': Truck,
  '/recorridos-bpa': ClipboardList,
  '/verificacion-sgi': ScaleIcon,
  '/matriz-legal': ScaleIcon,
  '/pnc': PackageX,
  '/pendientes': ListChecks,
  '/usuarios': UserCog,
  '/metricas-acceso': Activity,
  '/asesor': Bot,
}

export default function MenuLateral({ items, activo }: { items: Item[]; activo: string }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      {/* Botón hamburguesa: solo visible en móvil / tablet */}
      <button
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
        className="fixed left-2 top-2 z-50 flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white md:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      {/* Fondo oscuro al abrir en móvil */}
      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <nav
        className={
          'fixed inset-y-0 left-0 z-40 flex w-[252px] shrink-0 flex-col bg-by-primary transition-transform duration-200 md:static md:translate-x-0 ' +
          (abierto ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="flex-1 overflow-y-auto py-3">
          {items.map((item) => {
            const activa = item.href === activo
            const Icono = ICONOS[item.href] ?? FileText
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className={
                  'mx-2 mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] leading-tight transition-colors ' +
                  (activa
                    ? 'bg-white/10 font-medium text-white'
                    : 'text-white/65 hover:bg-white/5 hover:text-white')
                }
              >
                <Icono size={16} strokeWidth={1.8} className="shrink-0" />
                <span className="min-w-0 flex-1">{item.label}</span>
                {activa && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-by-accent" />}
              </Link>
            )
          })}
        </div>
        <div className="border-t border-white/10 p-2">
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-white/65 transition-colors hover:bg-white/5 hover:text-white"
            >
              <LogOut size={16} strokeWidth={1.8} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </nav>
    </>
  )
}
