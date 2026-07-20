'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { cerrarPendiente } from './actions'

type Pendiente = {
  id: string
  modulo: string
  descripcion: string | null
  estatus: string
  fecha_limite: string | null
  creado_en: string
  usuario_id: string
  usuario_nombre: string | null
  ruta: string | null
}

const ESTATUS_ESTILO: Record<string, string> = {
  abierto: 'bg-[#fdf3e3] text-[#9a6b1c]',
  en_proceso: 'bg-[#e6f0fa] text-[#2d5f8a]',
  en_validacion: 'bg-[#f0eafa] text-[#6b4fa0]',
  cerrado: 'bg-[#eaf5f0] text-[#3d6b53]',
}

const MODULO_LABEL: Record<string, string> = {
  solicitudes: 'Solicitud de cambio de documentos',
  ac_ap: 'Acciones Correctivas y Preventivas',
  quejas: 'Quejas',
  indicadores: 'Tablero de indicadores',
  proveedores: 'Proveedores',
  auditorias: 'Auditorías',
  recorridos_bpa: 'Recorridos BPAs',
  'matriz-legal': 'Matriz de Requisitos Legales',
  reuniones: 'Reuniones SGI',
  pnc: 'Producto y Equipo No Conforme',
  usuarios: 'Usuarios',
}

export default function PendientesTabla({
  pendientes,
  mostrarUsuario,
  usuarioActualId,
  puedeCerrarTodo,
}: {
  pendientes: Pendiente[]
  mostrarUsuario: boolean
  usuarioActualId: string
  puedeCerrarTodo: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set())

  const porModulo = new Map<string, Pendiente[]>()
  for (const p of pendientes) {
    const lista = porModulo.get(p.modulo) ?? []
    lista.push(p)
    porModulo.set(p.modulo, lista)
  }

  function alternar(modulo: string) {
    setAbiertos((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(modulo)) nuevo.delete(modulo)
      else nuevo.add(modulo)
      return nuevo
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {[...porModulo.entries()].map(([modulo, lista]) => {
        const pendientesAbiertos = lista.filter((p) => p.estatus !== 'cerrado').length
        const expandido = abiertos.has(modulo)
        return (
          <div key={modulo} className="overflow-hidden rounded-xl border border-black/5 bg-white">
            <button
              onClick={() => alternar(modulo)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-black/[0.02]"
            >
              <span className="flex items-center gap-2 text-[13.5px] font-medium text-by-gray-dark">
                {MODULO_LABEL[modulo] ?? modulo}
                <span className="rounded-full bg-[#f4f6f6] px-2 py-0.5 text-[11px] font-normal text-by-gray-light">
                  {lista.length}
                </span>
                {pendientesAbiertos > 0 && (
                  <span className="rounded-full bg-[#fdf3e3] px-2 py-0.5 text-[11px] font-normal text-[#9a6b1c]">
                    {pendientesAbiertos} sin cerrar
                  </span>
                )}
              </span>
              <span className="text-[11px] text-by-gray-light">{expandido ? '▲' : '▼'}</span>
            </button>
            {expandido && (
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-t border-black/5 text-[11px] uppercase text-by-gray-light">
                    {mostrarUsuario && <th className="px-4 py-2 font-normal">Usuario</th>}
                    <th className="px-4 py-2 font-normal">Descripción</th>
                    <th className="px-4 py-2 font-normal">Estatus</th>
                    <th className="px-4 py-2 font-normal">Fecha</th>
                    <th className="px-4 py-2 font-normal">Ir a</th>
                    {(puedeCerrarTodo || lista.some((p) => p.usuario_id === usuarioActualId)) && (
                      <th className="px-4 py-2 font-normal">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((p) => (
                    <tr key={p.id} className="border-b border-black/5 last:border-0">
                      {mostrarUsuario && (
                        <td className="px-4 py-2 text-by-gray-light">{p.usuario_nombre ?? '—'}</td>
                      )}
                      <td className="max-w-[320px] px-4 py-2 text-by-gray-light">
                        {p.descripcion ?? '—'}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={
                            'rounded-full px-2 py-0.5 text-[11px] ' + (ESTATUS_ESTILO[p.estatus] ?? '')
                          }
                        >
                          {p.estatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-by-gray-light">
                        {new Date(p.creado_en).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-4 py-2">
                        {p.ruta ? (
                          <Link href={p.ruta} className="text-[12px] text-by-accent hover:underline">
                            Ver →
                          </Link>
                        ) : (
                          <span className="text-[12px] text-by-gray-light">—</span>
                        )}
                      </td>
                      {(puedeCerrarTodo || lista.some((x) => x.usuario_id === usuarioActualId)) && (
                        <td className="px-4 py-2">
                          {p.estatus !== 'cerrado' && (puedeCerrarTodo || p.usuario_id === usuarioActualId) && (
                            <button
                              disabled={pending}
                              onClick={() => startTransition(() => cerrarPendiente(p.id))}
                              className="text-[12px] text-by-accent hover:underline disabled:opacity-50"
                            >
                              Cerrar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
      {pendientes.length === 0 && (
        <div className="rounded-xl border border-black/5 bg-white px-4 py-6 text-center text-[12px] text-by-gray-light">
          No hay pendientes.
        </div>
      )}
    </div>
  )
}
