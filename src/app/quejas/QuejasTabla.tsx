'use client'

import { useState, useTransition } from 'react'
import { marcarQuejaResuelta, validarCierreQueja } from './actions'

type Queja = {
  id: string
  folio: string | null
  tipo: string | null
  criticidad: string | null
  nombre_cliente: string
  correo_cliente: string | null
  tipo_queja: string
  servicio: string
  descripcion: string
  escalada_ac: boolean
  justificacion_ia: string | null
  estatus: string
  evidencia_cierre: string | null
  correccion: string | null
  respuesta_cliente: string | null
  fecha_limite: string | null
  fecha_cierre: string | null
  creado_en: string
  responsable_id: string | null
  responsable_nombre: string | null
}

const SERVICIO_LABEL: Record<string, string> = {
  almacenaje: 'Almacenaje',
  transporte: 'Transporte',
  seguro_mercancia: 'Seguro de mercancía',
}

const TIPO_LABEL: Record<string, string> = {
  inocuidad: 'Inocuidad',
  calidad: 'Calidad',
}

const ESTATUS_LABEL: Record<string, string> = {
  abierta: 'Abierta',
  en_atencion: 'En atención',
  en_validacion: 'En validación',
  cerrada: 'Cerrada',
  no_procede: 'No procede',
}

const ESTATUS_ESTILO: Record<string, string> = {
  abierta: 'bg-[#fdecea] text-[#a13c33]',
  en_atencion: 'bg-[#e6f0fa] text-[#2d5f8a]',
  en_validacion: 'bg-[#f0eafa] text-[#6b4fa0]',
  cerrada: 'bg-[#eaf5f0] text-[#3d6b53]',
  no_procede: 'bg-[#f1efe8] text-[#5f5e5a]',
}

export default function QuejasTabla({
  quejas,
  usuarioActualId,
  esCoordinador,
}: {
  quejas: Queja[]
  usuarioActualId: string
  esCoordinador: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState<Record<string, { evidencia: string; correccion: string; respuesta: string }>>({})

  function actualizarCampo(id: string, campo: 'evidencia' | 'correccion' | 'respuesta', valor: string) {
    setForm((prev) => {
      const base = prev[id] ?? { evidencia: '', correccion: '', respuesta: '' }
      return { ...prev, [id]: Object.assign({}, base, { [campo]: valor }) }
    })
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
      <table className="w-full text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
            <th className="whitespace-nowrap px-3 py-2 font-normal">Folio</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">Tipo</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">Fecha</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">Cliente</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">Contacto</th>
            <th className="min-w-[180px] px-3 py-2 font-normal">Descripción</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">Servicio</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">Criticidad</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">Tipo de queja</th>
            <th className="min-w-[140px] px-3 py-2 font-normal">Respuesta al cliente</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">Req. AC</th>
            <th className="min-w-[140px] px-3 py-2 font-normal">Corrección</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">Responsable</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">F. programada</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">F. real de cierre</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">Estatus</th>
            <th className="whitespace-nowrap px-3 py-2 font-normal">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {quejas.map((q) => {
            const datos = form[q.id] ?? { evidencia: '', correccion: '', respuesta: '' }
            return (
              <tr key={q.id} className="border-b border-black/5 last:border-0 align-top">
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{q.folio ?? '—'}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">
                  {q.tipo ? TIPO_LABEL[q.tipo] ?? q.tipo : '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">
                  {new Date(q.creado_en).toLocaleDateString('es-MX')}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-dark">{q.nombre_cliente}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">
                  {q.correo_cliente ?? '—'}
                </td>
                <td className="min-w-[180px] px-3 py-2 text-by-gray-light">
                  {q.descripcion}
                  {q.justificacion_ia && (
                    <p className="mt-0.5 text-[10px] italic text-by-gray-light">
                      IA: {q.justificacion_ia}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">
                  {SERVICIO_LABEL[q.servicio] ?? q.servicio}
                </td>
                <td className="whitespace-nowrap px-3 py-2 capitalize text-by-gray-light">
                  {q.criticidad ?? '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{q.tipo_queja}</td>
                <td className="min-w-[140px] px-3 py-2 text-by-gray-light">
                  {q.estatus === 'en_atencion' && q.responsable_id === usuarioActualId
                    ? datos.respuesta || '—'
                    : q.respuesta_cliente ?? '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {q.escalada_ac ? (
                    <span className="rounded-full bg-[#f0eafa] px-2 py-0.5 text-[11px] text-[#6b4fa0]">Sí</span>
                  ) : (
                    <span className="text-[12px] text-by-gray-light">No</span>
                  )}
                </td>
                <td className="min-w-[140px] px-3 py-2 text-by-gray-light">
                  {q.estatus === 'en_atencion' && q.responsable_id === usuarioActualId
                    ? datos.correccion || '—'
                    : q.correccion ?? '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">
                  {q.responsable_nombre ?? '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">
                  {q.fecha_limite ? new Date(q.fecha_limite + 'T00:00:00').toLocaleDateString('es-MX') : '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">
                  {q.fecha_cierre ? new Date(q.fecha_cierre).toLocaleDateString('es-MX') : '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-[11px] ' + (ESTATUS_ESTILO[q.estatus] ?? '')
                    }
                  >
                    {ESTATUS_LABEL[q.estatus] ?? q.estatus}
                  </span>
                </td>
                <td className="min-w-[180px] px-3 py-2">
                  {q.estatus === 'en_atencion' && q.responsable_id === usuarioActualId && (
                    <div className="flex w-52 flex-col gap-1">
                      <textarea
                        placeholder="Corrección / actividades realizadas"
                        value={datos.correccion}
                        onChange={(e) => actualizarCampo(q.id, 'correccion', e.target.value)}
                        className="h-12 w-full rounded-md border border-black/10 px-2 py-1 text-[11px]"
                      />
                      <textarea
                        placeholder="Respuesta al cliente"
                        value={datos.respuesta}
                        onChange={(e) => actualizarCampo(q.id, 'respuesta', e.target.value)}
                        className="h-12 w-full rounded-md border border-black/10 px-2 py-1 text-[11px]"
                      />
                      <textarea
                        placeholder="Evidencia de cierre"
                        value={datos.evidencia}
                        onChange={(e) => actualizarCampo(q.id, 'evidencia', e.target.value)}
                        className="h-12 w-full rounded-md border border-black/10 px-2 py-1 text-[11px]"
                      />
                      <button
                        disabled={pending}
                        onClick={() =>
                          startTransition(() =>
                            marcarQuejaResuelta(q.id, datos.evidencia, datos.correccion, datos.respuesta)
                          )
                        }
                        className="text-[12px] text-by-accent hover:underline disabled:opacity-50"
                      >
                        Enviar a validación
                      </button>
                    </div>
                  )}
                  {q.estatus === 'en_validacion' && esCoordinador && (
                    <div className="flex gap-2">
                      <button
                        disabled={pending}
                        onClick={() => startTransition(() => validarCierreQueja(q.id, true, ''))}
                        className="text-[12px] text-by-accent hover:underline disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        disabled={pending}
                        onClick={() => {
                          const comentario = prompt('Motivo del rechazo:') ?? ''
                          startTransition(() => validarCierreQueja(q.id, false, comentario))
                        }}
                        className="text-[12px] text-red-600 hover:underline disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
          {quejas.length === 0 && (
            <tr>
              <td colSpan={17} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                No hay quejas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
