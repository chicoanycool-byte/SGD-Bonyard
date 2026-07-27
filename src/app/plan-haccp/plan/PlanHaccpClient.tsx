'use client'

import Link from 'next/link'
import { Fragment, useMemo, useState, useTransition } from 'react'
import { crearPccPlan, eliminarPccPlan, actualizarEncabezadoPlan } from '../actions'

type Fila = {
  id: string
  nave: string
  proceso: string | null
  etapa_material: string | null
  pcc: string | null
  descripcion_peligro: string | null
  limites_criticos: string | null
  muestra: string | null
  frecuencia: string | null
  metodo_monitoreo: string | null
  medidas_correctoras: string | null
  registros: string | null
  documentos_referencia: string | null
  responsable_monitoreo: string | null
  responsable_verificacion: string | null
}
type Encabezado = {
  nave: string
  participantes: string | null
  fecha_actualizacion: string | null
  responsable_sgi: string | null
}

export default function PlanHaccpClient({
  esCoordinador,
  plan,
  encabezados,
}: {
  esCoordinador: boolean
  plan: Fila[]
  encabezados: Encabezado[]
}) {
  const [pendiente, startTransition] = useTransition()
  const [expandido, setExpandido] = useState<string | null>(null)

  const naves = useMemo(() => [...new Set(plan.map((p) => p.nave))].sort(), [plan])
  const [nave, setNave] = useState(naves[0] ?? 'Nave 1')
  const filtrado = plan.filter((p) => p.nave === nave)
  const encabezado = encabezados.find((e) => e.nave === nave) ?? null
  const totalPcc = new Set(filtrado.filter((f) => f.pcc).map((f) => f.pcc)).size

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">Plan HACCP (FSG-51)</p>
        <div className="flex gap-2">
          {[...naves, ...(naves.includes('Nave 2') ? [] : ['Nave 2'])].map((n) => (
            <button
              key={n}
              onClick={() => setNave(n)}
              className={
                'rounded-md px-3 py-1.5 text-[12px] ' +
                (nave === n ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')
              }
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/plan-haccp/equipo" className="rounded-lg bg-[#f4f6f6] px-4 py-3 transition hover:bg-[#e9ecec]">
          <p className="mb-1 text-[11px] text-by-gray-light">Equipo HACCP</p>
          <p className="text-[12px] font-medium text-by-primary">Ver equipo →</p>
        </Link>
        <div className="rounded-lg bg-[#fdecea] px-4 py-3">
          <p className="mb-1 text-[11px] text-[#a13c33] opacity-80">Puntos Críticos de Control</p>
          <p className="text-[22px] font-medium text-[#a13c33]">{totalPcc}</p>
        </div>
        <Link href="/plan-haccp/diagramas" className="rounded-lg bg-[#eaf5f0] px-4 py-3 transition hover:bg-[#dff0e7]">
          <p className="mb-1 text-[11px] text-[#3d6b53] opacity-80">Diagramas de flujo</p>
          <p className="text-[12px] font-medium text-[#3d6b53]">Ver diagramas →</p>
        </Link>
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-3 text-[12.5px] font-medium text-by-gray-dark">Encabezado del plan — {nave}</p>
        {esCoordinador ? (
          <form action={(fd) => startTransition(() => actualizarEncabezadoPlan(fd))} className="grid grid-cols-3 gap-2">
            <input type="hidden" name="nave" value={nave} />
            <input name="participantes" defaultValue={encabezado?.participantes ?? ''} placeholder="Participantes" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="fecha_actualizacion" type="date" defaultValue={encabezado?.fecha_actualizacion ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="responsable_sgi" defaultValue={encabezado?.responsable_sgi ?? ''} placeholder="Responsable SGI" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="col-span-3 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">Guardar encabezado</button>
          </form>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-[12px]">
            <p><span className="text-by-gray-light">Participantes: </span>{encabezado?.participantes ?? '—'}</p>
            <p><span className="text-by-gray-light">Actualización: </span>{encabezado?.fecha_actualizacion ? new Date(encabezado.fecha_actualizacion).toLocaleDateString('es-MX') : '—'}</p>
            <p><span className="text-by-gray-light">Responsable SGI: </span>{encabezado?.responsable_sgi ?? '—'}</p>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[11.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">PCC</th>
              <th className="px-3 py-2 font-normal">Proceso / Etapa</th>
              <th className="px-3 py-2 font-normal">Descripción del peligro</th>
              <th className="px-3 py-2 font-normal">Frecuencia</th>
              <th className="px-3 py-2 font-normal">Responsable</th>
              {esCoordinador && <th className="px-3 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {filtrado.map((f) => {
              const abierto = expandido === f.id
              return (
                <Fragment key={f.id}>
                  <tr onClick={() => setExpandido(abierto ? null : f.id)} className="cursor-pointer border-b border-black/5 last:border-0 hover:bg-black/[0.015]">
                    <td className="px-3 py-2">
                      {f.pcc && (
                        <span className="rounded-full bg-[#f0eafa] px-2 py-0.5 text-[10.5px] font-medium text-[#6b4fa0]">{f.pcc}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-by-gray-dark">
                      {f.proceso}
                      {f.etapa_material && <span className="block text-[10.5px] text-by-gray-light">{f.etapa_material}</span>}
                    </td>
                    <td className="max-w-[280px] truncate px-3 py-2 text-by-gray-light">{f.descripcion_peligro}</td>
                    <td className="px-3 py-2 text-by-gray-light">{f.frecuencia ?? '—'}</td>
                    <td className="px-3 py-2 text-by-gray-light">{f.responsable_monitoreo ?? '—'}</td>
                    {esCoordinador && (
                      <td className="px-3 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startTransition(() => eliminarPccPlan(f.id))
                          }}
                          disabled={pendiente}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                  {abierto && (
                    <tr className="border-b border-black/5 bg-[#fafbfa]">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-3 text-[11.5px]">
                          <div>
                            <p className="mb-1 text-[10px] uppercase text-by-gray-light">Límites críticos</p>
                            <p className="whitespace-pre-line text-by-gray-dark">{f.limites_criticos ?? '—'}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] uppercase text-by-gray-light">Muestra</p>
                            <p className="text-by-gray-dark">{f.muestra ?? '—'}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] uppercase text-by-gray-light">Método de monitoreo</p>
                            <p className="whitespace-pre-line text-by-gray-dark">{f.metodo_monitoreo ?? '—'}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] uppercase text-by-gray-light">Medidas correctoras</p>
                            <p className="whitespace-pre-line text-by-gray-dark">{f.medidas_correctoras ?? '—'}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] uppercase text-by-gray-light">Registros</p>
                            <p className="whitespace-pre-line text-by-gray-dark">{f.registros ?? '—'}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-[10px] uppercase text-by-gray-light">Documentos de referencia</p>
                            <p className="whitespace-pre-line text-by-gray-dark">{f.documentos_referencia ?? '—'}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="mb-1 text-[10px] uppercase text-by-gray-light">Verificación</p>
                            <p className="text-by-gray-dark">{f.responsable_verificacion ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {filtrado.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin PCCs capturados para {nave}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {esCoordinador && (
        <form action={(fd) => startTransition(() => crearPccPlan(fd))} className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Agregar fila al plan</p>
          <div className="grid grid-cols-3 gap-2">
            <select name="nave" defaultValue={nave} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="Nave 1">Nave 1</option>
              <option value="Nave 2">Nave 2</option>
            </select>
            <input name="proceso" placeholder="Proceso" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="pcc" placeholder="PCC (ej. PCC 1)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="etapa_material" placeholder="Etapa / material" className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <textarea name="descripcion_peligro" placeholder="Descripción del peligro" required rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <textarea name="limites_criticos" placeholder="Límites críticos" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <input name="muestra" placeholder="Muestra" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="frecuencia" placeholder="Frecuencia" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <textarea name="metodo_monitoreo" placeholder="Método de monitoreo" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <textarea name="medidas_correctoras" placeholder="Medidas correctoras" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <input name="registros" placeholder="Registros" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="documentos_referencia" placeholder="Documentos de referencia" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="responsable_monitoreo" placeholder="Responsable monitoreo" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="responsable_verificacion" placeholder="Responsable verificación" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="col-span-3 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">Agregar</button>
          </div>
        </form>
      )}
    </div>
  )
}
