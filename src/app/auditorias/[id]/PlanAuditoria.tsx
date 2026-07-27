'use client'

import { useTransition } from 'react'
import { actualizarPlanAuditoria, crearAgendaItem, eliminarAgendaItem } from './actions'

type AgendaItem = {
  id: string
  orden: number
  fecha: string | null
  horario: string | null
  area_proceso: string | null
  responsable_auditado: string | null
  requisitos_auditar: string | null
  lugar: string | null
  auditor: string | null
}

export default function PlanAuditoria({
  auditoriaId,
  alcance,
  objetivo,
  agenda,
  puedeEditar,
}: {
  auditoriaId: string
  alcance: string | null
  objetivo: string | null
  agenda: AgendaItem[]
  puedeEditar: boolean
}) {
  const [pendiente, startTransition] = useTransition()

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Plan de auditoría (FSG-56)</p>

      {puedeEditar ? (
        <form
          action={(fd) => startTransition(() => actualizarPlanAuditoria(auditoriaId, fd))}
          className="mb-4 grid grid-cols-2 gap-3"
        >
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Alcance</label>
            <textarea
              name="alcance"
              defaultValue={alcance ?? ''}
              rows={2}
              className="w-full rounded-md border border-black/10 px-2 py-1.5 text-[12.5px]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Objetivo de la auditoría</label>
            <textarea
              name="objetivo"
              defaultValue={objetivo ?? ''}
              rows={2}
              className="w-full rounded-md border border-black/10 px-2 py-1.5 text-[12.5px]"
            />
          </div>
          <button disabled={pendiente} className="col-span-2 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
            Guardar alcance / objetivo
          </button>
        </form>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-3 text-[12.5px]">
          <div>
            <p className="text-by-gray-light">Alcance</p>
            <p className="text-by-gray-dark">{alcance ?? '—'}</p>
          </div>
          <div>
            <p className="text-by-gray-light">Objetivo</p>
            <p className="text-by-gray-dark">{objetivo ?? '—'}</p>
          </div>
        </div>
      )}

      <p className="mb-2 text-[12px] font-medium text-by-gray-dark">Agenda</p>
      <div className="overflow-x-auto rounded-lg border border-black/5">
        <table className="w-full text-left text-[11.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
              <th className="px-2 py-2 font-normal">Fecha</th>
              <th className="px-2 py-2 font-normal">Horario</th>
              <th className="px-2 py-2 font-normal">Área / Proceso</th>
              <th className="px-2 py-2 font-normal">Responsable (auditado)</th>
              <th className="px-2 py-2 font-normal">Requisitos a auditar</th>
              <th className="px-2 py-2 font-normal">Lugar</th>
              <th className="px-2 py-2 font-normal">Auditor</th>
              {puedeEditar && <th className="px-2 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {agenda.map((a) => (
              <tr key={a.id} className="border-b border-black/5 last:border-0 align-top">
                <td className="whitespace-nowrap px-2 py-2 text-by-gray-light">{a.fecha ?? '—'}</td>
                <td className="whitespace-nowrap px-2 py-2 text-by-gray-light">{a.horario ?? '—'}</td>
                <td className="px-2 py-2 text-by-gray-dark">{a.area_proceso ?? '—'}</td>
                <td className="whitespace-pre-line px-2 py-2 text-by-gray-light">{a.responsable_auditado ?? '—'}</td>
                <td className="whitespace-pre-line px-2 py-2 text-by-gray-light">{a.requisitos_auditar ?? '—'}</td>
                <td className="px-2 py-2 text-by-gray-light">{a.lugar ?? '—'}</td>
                <td className="px-2 py-2 text-by-gray-light">{a.auditor ?? '—'}</td>
                {puedeEditar && (
                  <td className="px-2 py-2">
                    <button
                      onClick={() => startTransition(() => eliminarAgendaItem(a.id, auditoriaId))}
                      disabled={pendiente}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {agenda.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-4 text-center text-[11.5px] text-by-gray-light">
                  Sin agenda capturada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {puedeEditar && (
        <form
          action={(fd) => startTransition(() => crearAgendaItem(fd))}
          className="mt-3 grid grid-cols-4 gap-2"
        >
          <input type="hidden" name="auditoria_id" value={auditoriaId} />
          <input name="fecha" placeholder="Fecha" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
          <input name="horario" placeholder="Horario" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
          <input name="area_proceso" placeholder="Área / proceso" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
          <input name="responsable_auditado" placeholder="Responsable (auditado)" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
          <input name="requisitos_auditar" placeholder="Requisitos a auditar" className="col-span-2 h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
          <input name="lugar" placeholder="Lugar" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
          <input name="auditor" placeholder="Auditor" className="h-7 rounded-md border border-black/10 px-2 text-[11.5px]" />
          <button className="col-span-4 h-7 w-fit rounded-md border border-by-accent px-3 text-[11.5px] text-by-accent">
            Agregar a la agenda
          </button>
        </form>
      )}
    </div>
  )
}
