'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { actualizarPlanHaccp } from '../actions'

type Plan = {
  id: string
  alcance: string | null
  resumen: string | null
  fecha_elaboracion: string | null
  fecha_ultima_validacion: string | null
} | null

export default function PlanHaccpClient({
  esCoordinador,
  plan,
  equipo,
  procesos,
  productos,
}: {
  esCoordinador: boolean
  plan: Plan
  equipo: { id: string; nombre: string; rol_equipo: string }[]
  procesos: { id: string; proceso: string; es_pcc: boolean }[]
  productos: { id: string; categoria_producto: string }[]
}) {
  const [pendiente, startTransition] = useTransition()
  const pccs = procesos.filter((p) => p.es_pcc)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Plan HACCP (PSG-14)</p>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/plan-haccp/equipo" className="rounded-lg bg-[#f4f6f6] px-4 py-3 transition hover:bg-[#e9ecec]">
          <p className="mb-1 text-[11px] text-by-gray-light">Equipo HACCP</p>
          <p className="text-[22px] font-medium text-by-primary">{equipo.length}</p>
          <p className="text-[10.5px] text-by-gray-light">integrante(s)</p>
        </Link>
        <Link href="/plan-haccp/procesos" className="rounded-lg bg-[#fdecea] px-4 py-3 transition hover:bg-[#fbe1de]">
          <p className="mb-1 text-[11px] text-[#a13c33] opacity-80">Puntos Críticos de Control</p>
          <p className="text-[22px] font-medium text-[#a13c33]">{pccs.length}</p>
          <p className="text-[10.5px] text-[#a13c33] opacity-70">de {procesos.length} proceso(s) analizados</p>
        </Link>
        <Link href="/plan-haccp/productos" className="rounded-lg bg-[#eaf5f0] px-4 py-3 transition hover:bg-[#dff0e7]">
          <p className="mb-1 text-[11px] text-[#3d6b53] opacity-80">Categorías de producto</p>
          <p className="text-[22px] font-medium text-[#3d6b53]">{productos.length}</p>
          <p className="text-[10.5px] text-[#3d6b53] opacity-70">analizadas</p>
        </Link>
      </div>

      {pccs.length > 0 && (
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Puntos Críticos de Control identificados</p>
          <ul className="flex flex-col gap-1">
            {pccs.map((p) => (
              <li key={p.id} className="text-[12.5px] text-by-gray-dark">
                • {p.proceso}
              </li>
            ))}
          </ul>
          <Link href="/plan-haccp/procesos" className="mt-2 inline-block text-[11.5px] text-by-accent hover:underline">
            Ver detalle en Análisis de Procesos →
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-3 text-[12.5px] font-medium text-by-gray-dark">Documento del plan</p>
        {esCoordinador ? (
          <form action={(fd) => startTransition(() => actualizarPlanHaccp(fd))} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={plan?.id ?? ''} />
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">Alcance del plan</label>
              <textarea
                name="alcance"
                defaultValue={plan?.alcance ?? ''}
                rows={2}
                className="w-full rounded-md border border-black/10 px-2 py-1.5 text-[12.5px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">Resumen / justificación</label>
              <textarea
                name="resumen"
                defaultValue={plan?.resumen ?? ''}
                rows={3}
                className="w-full rounded-md border border-black/10 px-2 py-1.5 text-[12.5px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha de elaboración</label>
                <input
                  type="date"
                  name="fecha_elaboracion"
                  defaultValue={plan?.fecha_elaboracion ?? ''}
                  className="h-8 w-full rounded-md border border-black/10 px-2 text-[12.5px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Última validación</label>
                <input
                  type="date"
                  name="fecha_ultima_validacion"
                  defaultValue={plan?.fecha_ultima_validacion ?? ''}
                  className="h-8 w-full rounded-md border border-black/10 px-2 text-[12.5px]"
                />
              </div>
            </div>
            <button disabled={pendiente} className="h-8 w-fit rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-50">
              {pendiente ? 'Guardando…' : 'Guardar plan'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-2 text-[12.5px]">
            <p><span className="text-by-gray-light">Alcance: </span><span className="text-by-gray-dark">{plan?.alcance ?? '—'}</span></p>
            <p><span className="text-by-gray-light">Resumen: </span><span className="text-by-gray-dark">{plan?.resumen ?? '—'}</span></p>
            <p>
              <span className="text-by-gray-light">Última validación: </span>
              <span className="text-by-gray-dark">
                {plan?.fecha_ultima_validacion ? new Date(plan.fecha_ultima_validacion).toLocaleDateString('es-MX') : '—'}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
