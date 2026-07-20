'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cerrarSesion } from '@/lib/sesion/actions'

type Item = { href: string; label: string }

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
          'fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col bg-[#0a3244] transition-transform duration-200 md:static md:translate-x-0 ' +
          (abierto ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="flex-1 overflow-y-auto py-3">
          {items.map((item) => {
            const activa = item.href === activo
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className={
                  'mx-2 mb-0.5 flex items-center gap-2.5 rounded-lg border-l-4 px-3 py-2.5 text-[13.5px] leading-tight transition-colors ' +
                  (activa
                    ? 'border-by-accent bg-white/10 font-semibold text-white'
                    : 'border-transparent text-white/70 hover:border-by-accent/40 hover:bg-white/5 hover:text-white')
                }
              >
                <span
                  className={
                    'h-1.5 w-1.5 shrink-0 rounded-full ' +
                    (activa ? 'bg-by-accent' : 'bg-white/30')
                  }
                />
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="border-t border-white/10 p-2">
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      </nav>
    </>
  )
}
