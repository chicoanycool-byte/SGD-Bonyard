'use client'

import { useState, useTransition } from 'react'
import { actualizarDocumentoInocuidad, crearEventoInocuidad, eliminarEventoInocuidad } from './actions'

type Documento = {
  tipo: string
  evaluacion_vulnerabilidad: string | null
  medidas_mitigacion: string | null
  resumen: string | null
  fecha_elaboracion: string | null
  fecha_ultima_revision: string | null
}
type Evento = {
  id: string
  tipo: string
  fecha: string
  titulo: string
  descripcion: string | null
  resultado: string | null
  tiempo_respuesta: string | null
  porcentaje_recuperacion: number | null
  satisfactorio: boolean | null
  responsable_nombre: string | null
}

const TIPOS: { id: string; label: string; codigo: string; descripcion: string }[] = [
  {
    id: 'defensa_alimentaria',
    label: 'Defensa Alimentaria',
    codigo: 'MSG-04',
    descripcion: 'Evaluación de vulnerabilidad y medidas de mitigación contra actos intencionales (control de acceso, vigilancia).',
  },
  {
    id: 'fraude_alimentario',
    label: 'Fraude Alimentario',
    codigo: 'MSG-05',
    descripcion: 'Evaluación de vulnerabilidad a fraude alimentario y plan de mitigación por producto/proveedor.',
  },
  {
    id: 'alergenos',
    label: 'Gestión de Alérgenos',
    codigo: 'PSG-21',
    descripcion: 'Identificación, control y prevención de contaminación cruzada de alérgenos declarados (cacahuate).',
  },
  {
    id: 'retirada_producto',
    label: 'Retirada de Producto',
    codigo: 'PSG-17',
    descripcion: 'Procedimiento de retiro/retirada, incluida notificación a SQFI en 24 h (foodsafetycrisis@sqfi.com) y simulacro anual.',
  },
  {
    id: 'simulacros_trazabilidad',
    label: 'Simulacros de Trazabilidad',
    codigo: 'MSG-07',
    descripcion: 'Trazabilidad un paso adelante / un paso atrás, con simulacro documentado (tiempo y % de recuperación).',
  },
  {
    id: 'gestion_crisis',
    label: 'Gestión de Crisis',
    codigo: 'MSG-12',
    descripcion: 'Plan de gestión de crisis con equipo, roles, protocolos de actuación y simulacros.',
  },
  {
    id: 'control_plagas',
    label: 'Control de Plagas',
    codigo: 'MSG-09',
    descripcion: 'Programa de control de plagas con proveedor certificado, mapa de dispositivos y análisis de tendencias.',
  },
  {
    id: 'vidrio_plastico',
    label: 'Vidrio y Plástico Quebradizo',
    codigo: 'PSG-09',
    descripcion: 'Inventario de vidrio, protocolo ante rotura y checklist de integridad de la nave.',
  },
  {
    id: 'manejo_residuos',
    label: 'Manejo de Residuos',
    codigo: 'MSG-10',
    descripcion: 'Identificación, segregación, almacenamiento y disposición de residuos evitando contaminación y plagas.',
  },
]

export default function InocuidadClient({
  esCoordinador,
  documentos,
  eventos,
}: {
  esCoordinador: boolean
  documentos: Documento[]
  eventos: Evento[]
}) {
  const [tab, setTab] = useState(TIPOS[0].id)
  const [pendiente, startTransition] = useTransition()

  const activo = TIPOS.find((t) => t.id === tab)!
  const doc = documentos.find((d) => d.tipo === tab) ?? null
  const eventosTab = eventos.filter((e) => e.tipo === tab)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Inocuidad Alimentaria</p>

      <div className="flex flex-wrap gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              'rounded-md px-3 py-1.5 text-[11.5px] ' +
              (tab === t.id ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light border border-transparent')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-medium text-by-gray-dark">
            {activo.label} <span className="text-[11px] font-normal text-by-gray-light">({activo.codigo})</span>
          </p>
        </div>
        <p className="mb-4 text-[12px] text-by-gray-light">{activo.descripcion}</p>

        {esCoordinador ? (
          <form action={(fd) => startTransition(() => actualizarDocumentoInocuidad(fd))} className="flex flex-col gap-3">
            <input type="hidden" name="tipo" value={tab} />
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">Evaluación de vulnerabilidad / diagnóstico</label>
              <textarea
                name="evaluacion_vulnerabilidad"
                defaultValue={doc?.evaluacion_vulnerabilidad ?? ''}
                rows={3}
                className="w-full rounded-md border border-black/10 px-2 py-1.5 text-[12.5px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">Medidas de mitigación / control</label>
              <textarea
                name="medidas_mitigacion"
                defaultValue={doc?.medidas_mitigacion ?? ''}
                rows={3}
                className="w-full rounded-md border border-black/10 px-2 py-1.5 text-[12.5px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">Resumen / notas adicionales</label>
              <textarea
                name="resumen"
                defaultValue={doc?.resumen ?? ''}
                rows={2}
                className="w-full rounded-md border border-black/10 px-2 py-1.5 text-[12.5px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha de elaboración</label>
                <input
                  type="date"
                  name="fecha_elaboracion"
                  defaultValue={doc?.fecha_elaboracion ?? ''}
                  className="h-8 w-full rounded-md border border-black/10 px-2 text-[12.5px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Última revisión</label>
                <input
                  type="date"
                  name="fecha_ultima_revision"
                  defaultValue={doc?.fecha_ultima_revision ?? ''}
                  className="h-8 w-full rounded-md border border-black/10 px-2 text-[12.5px]"
                />
              </div>
            </div>
            <button disabled={pendiente} className="h-8 w-fit rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-50">
              {pendiente ? 'Guardando…' : 'Guardar'}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-3 text-[12.5px]">
            <div>
              <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Evaluación de vulnerabilidad</p>
              <p className="whitespace-pre-line text-by-gray-dark">{doc?.evaluacion_vulnerabilidad ?? '—'}</p>
            </div>
            <div>
              <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Medidas de mitigación</p>
              <p className="whitespace-pre-line text-by-gray-dark">{doc?.medidas_mitigacion ?? '—'}</p>
            </div>
            <p className="text-[11px] text-by-gray-light">
              Última revisión: {doc?.fecha_ultima_revision ? new Date(doc.fecha_ultima_revision).toLocaleDateString('es-MX') : '—'}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-3 text-[12.5px] font-medium text-by-gray-dark">Bitácora de simulacros / eventos / verificaciones</p>
        <div className="overflow-hidden rounded-lg border border-black/5">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
                <th className="px-3 py-2 font-normal">Fecha</th>
                <th className="px-3 py-2 font-normal">Título</th>
                <th className="px-3 py-2 font-normal">Resultado</th>
                <th className="px-3 py-2 font-normal">Satisfactorio</th>
                <th className="px-3 py-2 font-normal">Responsable</th>
                {esCoordinador && <th className="px-3 py-2 font-normal"></th>}
              </tr>
            </thead>
            <tbody>
              {eventosTab.map((e) => (
                <tr key={e.id} className="border-b border-black/5 last:border-0 align-top">
                  <td className="px-3 py-2 text-by-gray-light">{new Date(e.fecha).toLocaleDateString('es-MX')}</td>
                  <td className="px-3 py-2 text-by-gray-dark">
                    {e.titulo}
                    {e.tiempo_respuesta && <span className="block text-[10.5px] text-by-gray-light">Tiempo: {e.tiempo_respuesta}</span>}
                    {e.porcentaje_recuperacion != null && (
                      <span className="block text-[10.5px] text-by-gray-light">Recuperación: {e.porcentaje_recuperacion}%</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-by-gray-light">{e.resultado ?? '—'}</td>
                  <td className="px-3 py-2">
                    {e.satisfactorio === true && <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[10.5px] text-[#3d6b53]">Sí</span>}
                    {e.satisfactorio === false && <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[10.5px] text-[#a13c33]">No</span>}
                  </td>
                  <td className="px-3 py-2 text-by-gray-light">{e.responsable_nombre ?? '—'}</td>
                  {esCoordinador && (
                    <td className="px-3 py-2">
                      <button
                        onClick={() => startTransition(() => eliminarEventoInocuidad(e.id))}
                        disabled={pendiente}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {eventosTab.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-[11.5px] text-by-gray-light">
                    Sin eventos registrados para {activo.label}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {esCoordinador && (
          <form action={(fd) => startTransition(() => crearEventoInocuidad(fd))} className="mt-3 grid grid-cols-3 gap-2">
            <input type="hidden" name="tipo" value={tab} />
            <input name="fecha" type="date" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="titulo" placeholder="Título (ej. Simulacro de retirada anual)" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <textarea name="descripcion" placeholder="Descripción" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <input name="resultado" placeholder="Resultado" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="tiempo_respuesta" placeholder="Tiempo de respuesta (si aplica)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="porcentaje_recuperacion" type="number" step="0.1" placeholder="% recuperación (si aplica)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <label className="col-span-3 flex items-center gap-2 text-[12px] text-by-gray-dark">
              <input type="checkbox" name="satisfactorio" className="h-3.5 w-3.5" />
              Resultado satisfactorio
            </label>
            <button className="col-span-3 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Registrar evento
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
