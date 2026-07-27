'use client'

import { useState, useTransition } from 'react'
import {
  crearObjetivo,
  actualizarEstatusObjetivo,
  eliminarObjetivo,
  crearActividadObjetivo,
  eliminarActividadObjetivo,
  crearSeguimientoObjetivo,
  eliminarSeguimientoObjetivo,
} from '../actions'

type Actividad = {
  id: string
  orden: number
  actividad: string
  fecha_programada: string | null
  fecha_real: string | null
  responsable: string | null
  recursos: string | null
  inversion: string | null
  seguimiento: string | null
}
type Seguimiento = { id: string; fecha_revision: string | null; actividad: string; responsable: string | null }
type Objetivo = {
  id: string
  periodo: string | null
  descripcion: string
  lider_equipo: string | null
  fecha_cumplimiento: string | null
  metrico_indicador: string | null
  estatus: string
  indicador_nombre: string | null
  actividades: Actividad[]
  seguimientos: Seguimiento[]
}
type Indicador = { id: string; nombre: string }
type Usuario = { id: string; nombre: string }

const ESTATUS_STYLE: Record<string, string> = {
  en_proceso: 'bg-[#fdf3e3] text-[#9a6b1c]',
  cumplido: 'bg-[#eaf5f0] text-[#3d6b53]',
  reprogramado: 'bg-[#eaf1fa] text-[#3c6ba1]',
}
const ESTATUS_LABEL: Record<string, string> = {
  en_proceso: 'En proceso',
  cumplido: 'Cumplido',
  reprogramado: 'Reprogramado',
}

export default function ObjetivosClient({
  esCoordinador,
  objetivos,
  indicadores,
  usuarios,
}: {
  esCoordinador: boolean
  objetivos: Objetivo[]
  indicadores: Indicador[]
  usuarios: Usuario[]
}) {
  const [pendiente, startTransition] = useTransition()
  const [expandido, setExpandido] = useState<string | null>(objetivos[0]?.id ?? null)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">
        Objetivos de calidad — Plan de trabajo (FSG-61)
      </p>

      {objetivos.map((o) => {
        const abierto = expandido === o.id
        return (
          <div key={o.id} className="overflow-hidden rounded-xl border border-black/5 bg-white">
            <button
              onClick={() => setExpandido(abierto ? null : o.id)}
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
            >
              <div className="flex-1">
                <p className="text-[13px] font-medium text-by-gray-dark">{o.descripcion}</p>
                <p className="mt-0.5 text-[11px] text-by-gray-light">
                  Periodo {o.periodo ?? '—'} · Líder: {o.lider_equipo ?? '—'} · Cumplimiento:{' '}
                  {o.fecha_cumplimiento ? new Date(o.fecha_cumplimiento).toLocaleDateString('es-MX') : '—'}
                  {o.indicador_nombre ? ` · Indicador: ${o.indicador_nombre}` : ''}
                </p>
              </div>
              <span className={'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ' + (ESTATUS_STYLE[o.estatus] ?? '')}>
                {ESTATUS_LABEL[o.estatus] ?? o.estatus}
              </span>
            </button>

            {abierto && (
              <div className="border-t border-black/5 p-4">
                {esCoordinador && (
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-[11px] text-by-gray-light">Cambiar estatus:</span>
                    <select
                      defaultValue={o.estatus}
                      onChange={(e) => startTransition(() => actualizarEstatusObjetivo(o.id, e.target.value))}
                      className="h-7 rounded-md border border-black/10 px-1.5 text-[11.5px]"
                    >
                      <option value="en_proceso">En proceso</option>
                      <option value="cumplido">Cumplido</option>
                      <option value="reprogramado">Reprogramado</option>
                    </select>
                    <button
                      onClick={() => {
                        if (!confirm('¿Eliminar este objetivo por completo?')) return
                        startTransition(() => eliminarObjetivo(o.id))
                      }}
                      disabled={pendiente}
                      className="ml-auto text-[11px] text-red-500 hover:underline"
                    >
                      Eliminar objetivo
                    </button>
                  </div>
                )}

                <p className="mb-2 text-[12px] font-medium text-by-gray-dark">Plan de tareas</p>
                <div className="mb-4 overflow-hidden rounded-lg border border-black/5">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
                        <th className="px-3 py-2 font-normal">#</th>
                        <th className="px-3 py-2 font-normal">Actividad</th>
                        <th className="px-3 py-2 font-normal">Prog.</th>
                        <th className="px-3 py-2 font-normal">Real</th>
                        <th className="px-3 py-2 font-normal">Responsable</th>
                        <th className="px-3 py-2 font-normal">Seguimiento</th>
                        {esCoordinador && <th className="px-3 py-2 font-normal"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {o.actividades.map((a) => (
                        <tr key={a.id} className="border-b border-black/5 last:border-0 align-top">
                          <td className="px-3 py-2 text-by-gray-light">{a.orden}</td>
                          <td className="px-3 py-2 text-by-gray-dark">{a.actividad}</td>
                          <td className="px-3 py-2 text-by-gray-light">{a.fecha_programada ?? '—'}</td>
                          <td className="px-3 py-2 text-by-gray-light">{a.fecha_real ?? '—'}</td>
                          <td className="px-3 py-2 text-by-gray-light">{a.responsable ?? '—'}</td>
                          <td className="px-3 py-2 text-by-gray-light">{a.seguimiento ?? '—'}</td>
                          {esCoordinador && (
                            <td className="px-3 py-2">
                              <button
                                onClick={() => startTransition(() => eliminarActividadObjetivo(a.id))}
                                disabled={pendiente}
                                className="text-[11px] text-red-500 hover:underline"
                              >
                                Eliminar
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {o.actividades.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-3 text-center text-[11.5px] text-by-gray-light">
                            Sin tareas capturadas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {esCoordinador && (
                    <form
                      action={(fd) => startTransition(() => crearActividadObjetivo(fd))}
                      className="grid grid-cols-3 gap-2 border-t border-black/5 p-3"
                    >
                      <input type="hidden" name="objetivo_id" value={o.id} />
                      <input name="actividad" placeholder="Actividad / tarea" required className="col-span-3 h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
                      <input name="fecha_programada" placeholder="Fecha prog." className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
                      <input name="fecha_real" placeholder="Fecha real" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
                      <input name="responsable" placeholder="Responsable" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
                      <input name="recursos" placeholder="Recursos" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
                      <input name="inversion" placeholder="Inversión" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
                      <input name="seguimiento" placeholder="Seguimiento" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
                      <button className="col-span-3 h-7 w-fit rounded-md border border-by-accent px-3 text-[11.5px] text-by-accent">
                        Agregar tarea
                      </button>
                    </form>
                  )}
                </div>

                <p className="mb-2 text-[12px] font-medium text-by-gray-dark">Bitácora de seguimiento</p>
                <div className="overflow-hidden rounded-lg border border-black/5">
                  <table className="w-full text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
                        <th className="px-3 py-2 font-normal">Fecha</th>
                        <th className="px-3 py-2 font-normal">Actividad</th>
                        <th className="px-3 py-2 font-normal">Responsable</th>
                        {esCoordinador && <th className="px-3 py-2 font-normal"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {o.seguimientos.map((s) => (
                        <tr key={s.id} className="border-b border-black/5 last:border-0 align-top">
                          <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">
                            {s.fecha_revision ? new Date(s.fecha_revision).toLocaleDateString('es-MX') : '—'}
                          </td>
                          <td className="px-3 py-2 text-by-gray-dark">{s.actividad}</td>
                          <td className="px-3 py-2 text-by-gray-light">{s.responsable ?? '—'}</td>
                          {esCoordinador && (
                            <td className="px-3 py-2">
                              <button
                                onClick={() => startTransition(() => eliminarSeguimientoObjetivo(s.id))}
                                disabled={pendiente}
                                className="text-[11px] text-red-500 hover:underline"
                              >
                                Eliminar
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {o.seguimientos.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-3 text-center text-[11.5px] text-by-gray-light">
                            Sin revisiones registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {esCoordinador && (
                    <form
                      action={(fd) => startTransition(() => crearSeguimientoObjetivo(fd))}
                      className="flex flex-wrap gap-2 border-t border-black/5 p-3"
                    >
                      <input type="hidden" name="objetivo_id" value={o.id} />
                      <input type="date" name="fecha_revision" required className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
                      <input name="actividad" placeholder="Comentario de seguimiento" required className="h-7 flex-1 rounded-md border border-black/10 px-2 text-[11.5px]" />
                      <input name="responsable" placeholder="Responsable" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
                      <button className="h-7 rounded-md border border-by-accent px-3 text-[11.5px] text-by-accent">
                        Agregar revisión
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {esCoordinador && (
        <form
          action={(fd) => startTransition(() => crearObjetivo(fd))}
          className="rounded-xl border border-black/5 bg-white p-4"
        >
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Nuevo objetivo</p>
          <div className="grid grid-cols-3 gap-2">
            <input name="descripcion" placeholder="Descripción del objetivo" required className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="periodo" placeholder="Periodo (ej. 2026)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="lider_equipo" placeholder="Líder del equipo" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="fecha_cumplimiento" type="date" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="metrico_indicador" placeholder="Métrico indicador" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <select name="indicador_id" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="">Sin indicador ligado</option>
              {indicadores.map((i) => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </select>
            <select name="responsable_id" defaultValue="" className="col-span-3 h-8 w-fit rounded-md border border-black/10 px-2 text-[12px]">
              <option value="">Sin responsable asignado</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
            <button className="col-span-3 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Agregar objetivo
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
