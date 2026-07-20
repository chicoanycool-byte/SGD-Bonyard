'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { cancelarAuditoria } from './actions'

type Auditoria = {
  id: string
  fecha: string
  norma: 'iso_9001' | 'sqf'
  tipo: 'interna' | 'cliente'
  proceso: string | null
  cliente_nombre: string | null
  nave: string | null
  estatus: string
  auditor_lider_nombre: string | null
  auditado_nombre: string | null
}

const NORMA_LABEL: Record<string, string> = {
  iso_9001: 'ISO 9001:2015',
  sqf: 'SQF',
  ambas: 'ISO 9001:2015 + SQF',
}

const ESTATUS_ESTILO: Record<string, string> = {
  programada: 'bg-[#e6f0fa] text-[#2d5f8a]',
  en_proceso: 'bg-[#fdf3e3] text-[#9a6b1c]',
  cerrada: 'bg-[#eaf5f0] text-[#3d6b53]',
  cancelada: 'bg-[#f1efe8] text-[#5f5e5a]',
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function ProgramaAuditorias({
  auditorias,
  puedeGestionar,
}: {
  auditorias: Auditoria[]
  puedeGestionar: boolean
}) {
  const [pending, startTransition] = useTransition()

  const grupos = new Map<string, Auditoria[]>()
  for (const a of auditorias) {
    const d = new Date(a.fecha + 'T00:00:00')
    const clave = `${MESES[d.getMonth()]} ${d.getFullYear()}`
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave)!.push(a)
  }

  return (
    <div className="flex flex-col gap-4">
      {[...grupos.entries()].map(([mes, lista]) => (
        <div key={mes} className="rounded-xl border border-black/5 bg-white">
          <div className="border-b border-black/5 px-4 py-2">
            <p className="text-[12px] font-medium text-by-gray-dark">{mes}</p>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
                <th className="px-4 py-2 font-normal">Fecha</th>
                <th className="px-4 py-2 font-normal">Norma</th>
                <th className="px-4 py-2 font-normal">Tipo</th>
                <th className="px-4 py-2 font-normal">Proceso</th>
                <th className="px-4 py-2 font-normal">Cliente</th>
                <th className="px-4 py-2 font-normal">Nave</th>
                <th className="px-4 py-2 font-normal">Auditor líder</th>
                <th className="px-4 py-2 font-normal">Auditado</th>
                <th className="px-4 py-2 font-normal">Estatus</th>
                {puedeGestionar && <th className="px-4 py-2 font-normal">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {lista.map((a) => (
                <tr key={a.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-2 text-by-gray-dark">
                    <Link
                      href={`/auditorias/${a.id}`}
                      className="text-by-accent hover:underline"
                    >
                      {new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short',
                      })}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {NORMA_LABEL[a.norma]}
                  </td>
                  <td className="px-4 py-2 capitalize text-by-gray-light">
                    {a.tipo}
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {a.proceso ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {a.cliente_nombre ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {a.nave ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {a.auditor_lider_nombre ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {a.auditado_nombre ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-[11px] ' +
                        (ESTATUS_ESTILO[a.estatus] ?? '')
                      }
                    >
                      {a.estatus.replace('_', ' ')}
                    </span>
                  </td>
                  {puedeGestionar && (
                    <td className="px-4 py-2">
                      {a.estatus === 'programada' && (
                        <button
                          disabled={pending}
                          onClick={() =>
                            startTransition(() => cancelarAuditoria(a.id))
                          }
                          className="text-[12px] text-red-600 hover:underline disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {auditorias.length === 0 && (
        <div className="rounded-xl border border-black/5 bg-white px-4 py-6 text-center text-[12px] text-by-gray-light">
          No hay auditorías programadas todavía.
        </div>
      )}
    </div>
  )
}
