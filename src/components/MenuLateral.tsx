'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Home,
  FileText,
  Building2,
  MessageSquareWarning,
  Wrench,
  ClipboardCheck,
  ClipboardList,
  ScaleIcon,
  PackageX,
  Truck,
  Users2,
  ListChecks,
  UserCog,
  Activity,
  Bot,
  ChevronDown,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { cerrarSesion } from '@/lib/sesion/actions'

type SubItem = { href: string; label: string }
type Item = { href: string; label: string; children?: undefined } | { label: string; href?: undefined; children: SubItem[] }

const ICONOS: Record<string, LucideIcon> = {
  '/inicio': Home,
  '/recursos-humanos': Users2,
  'Documentos del Sistema de Gestión': FileText,
  Dirección: Building2,
  Quejas: MessageSquareWarning,
  'Acciones Correctivas y Preventivas': Wrench,
  'Recorridos BPAs': ClipboardList,
  'Verificación del SGI': ScaleIcon,
  'Producto y Equipo No Conforme': PackageX,
  Compras: Truck,
  Auditorías: ClipboardCheck,
  'Plan HACCP': Users2,
  EHS: ScaleIcon,
  '/pendientes': ListChecks,
  '/usuarios': UserCog,
  '/metricas-acceso': Activity,
  '/asesor': Bot,
}

export default function MenuLateral({ items, activo }: { items: Item[]; activo: string }) {
  const [abierto, setAbierto] = useState(false)
  const pathname = usePathname()

  // El grupo que contiene la ruta activa empieza expandido
  const grupoActivo = items.find(
    (i) => i.children && i.children.some((c) => c.href === activo)
  )?.label
  const [expandido, setExpandido] = useState<string | null>(grupoActivo ?? null)

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
        className="fixed left-2 top-2 z-50 flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white md:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      {abierto && (
        <div onClick={() => setAbierto(false)} className="fixed inset-0 z-40 bg-black/40 md:hidden" />
      )}

      <nav
        className={
          'fixed inset-y-0 left-0 z-40 flex w-[264px] shrink-0 flex-col bg-by-primary transition-transform duration-200 md:static md:translate-x-0 ' +
          (abierto ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="flex-1 overflow-y-auto py-3">
          {items.map((item) => {
            if (!item.children) {
              const activa = item.href === activo
              const Icono = ICONOS[item.href] ?? FileText
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAbierto(false)}
                  className={
                    'mx-2 mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] leading-tight transition-colors ' +
                    (activa ? 'bg-white/10 font-medium text-white' : 'text-white/65 hover:bg-white/5 hover:text-white')
                  }
                >
                  <Icono size={16} strokeWidth={1.8} className="shrink-0" />
                  <span className="min-w-0 flex-1 uppercase tracking-wide">{item.label}</span>
                  {activa && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-by-accent" />}
                </Link>
              )
            }

            const IconoGrupo = ICONOS[item.label] ?? FileText
            const estaExpandido = expandido === item.label
            const contieneActivo = item.children.some((c) => c.href === activo)

            return (
              <div key={item.label} className="mx-2 mb-0.5">
                <button
                  onClick={() => setExpandido(estaExpandido ? null : item.label)}
                  className={
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] leading-tight transition-colors ' +
                    (contieneActivo && !estaExpandido
                      ? 'text-white'
                      : 'text-white/65 hover:bg-white/5 hover:text-white')
                  }
                >
                  <IconoGrupo size={16} strokeWidth={1.8} className="shrink-0" />
                  <span className="min-w-0 flex-1 uppercase tracking-wide">{item.label}</span>
                  <ChevronDown
                    size={14}
                    className={'shrink-0 transition-transform ' + (estaExpandido ? 'rotate-180' : '')}
                  />
                </button>
                {estaExpandido && (
                  <div className="ml-[26px] mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                    {item.children.map((sub) => {
                      const activa = sub.href === activo
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setAbierto(false)}
                          className={
                            'flex items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] leading-tight transition-colors ' +
                            (activa ? 'bg-white/10 font-medium text-white' : 'text-white/60 hover:bg-white/5 hover:text-white')
                          }
                        >
                          <span className="min-w-0 flex-1">{sub.label}</span>
                          {activa && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-by-accent" />}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
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

        <div className="border-t border-white/10 px-4 py-4">
          <div className="mb-1.5 flex w-fit items-center gap-1.5 rounded-md bg-white/95 px-2 py-1">
            <Image src="/logo-bonyard.png" alt="Bonyard" width={64} height={21} className="h-4 w-auto" />
          </div>
          <p className="text-[10px] text-white/50">3PL Warehousing &amp; Logistics</p>
          <p className="mt-1.5 text-[9.5px] leading-snug text-white/35">
            © 2026 Bonyard Servicios.
            <br />
            Todos los derechos reservados.
          </p>
        </div>
      </nav>
    </>
  )
}
