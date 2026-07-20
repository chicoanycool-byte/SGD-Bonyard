'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { armarPlanReaccion, marcarResuelta, validarCierre, revisarConIA, editarDatosBasicosAC, sugerirTipoNcAccion } from '../actions'
import type { RevisionAC } from '@/lib/anthropic'
import FormularioFSG09 from './FormularioFSG09'
import EvidenciasAC from './EvidenciasAC'

type Usuario = { id: string; nombre: string }
type Medida = { accion: string; responsable: string; fecha: string; seguimiento: string }
type PlanItem = {
  actividad: string
  responsable: string
  fecha_termino: string
  seguimiento: string
  resultado_esperado: string
  verificacion_eficacia: string
}

export default function DetalleAcAp({
  accion,
  usuarios,
  puedeArmarPlan,
  esResponsable,
  esCoordinador,
}: {
  accion: {
    id: string
    folio: string | null
    descripcion: string
    tipo_nc: string | null
    estatus: string
    causa_raiz: string | null
    accion_propuesta: string | null
    fecha_compromiso: string | null
    evidencia_cierre: string | null
    comentario_validacion: string | null
    responsable_nombre: string | null
    responsable_id: string | null
    definicion_problema: string | null
    equipo_lider: string | null
    equipo_miembros: string | null
    medidas_contencion: Medida[]
    analisis_causas: Record<string, { texto: string; impacto: string }>
    plan_trabajo: PlanItem[]
    evidencias: { id: string; nombre_archivo: string; storage_path: string; subido_por_nombre: string | null; creado_en: string }[]
  }
  usuarios: Usuario[]
  puedeArmarPlan: boolean
  esResponsable: boolean
  esCoordinador: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [evidencia, setEvidencia] = useState('')
  const [comentario, setComentario] = useState('')
  const [revision, setRevision] = useState<RevisionAC | null>(null)
  const [analizando, setAnalizando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [tipoNcEdit, setTipoNcEdit] = useState(accion.tipo_nc ?? '')
  const [responsableEdit, setResponsableEdit] = useState(accion.responsable_id ?? '')
  const [fechaCompromisoEdit, setFechaCompromisoEdit] = useState(accion.fecha_compromiso ?? '')
  const [sugerenciaTipoNc, setSugerenciaTipoNc] = useState<string | null>(null)
  const [sugiriendoTipoNc, setSugiriendoTipoNc] = useState(false)
  const router = useRouter()

  async function sugerirTipoNc() {
    setSugiriendoTipoNc(true)
    setSugerenciaTipoNc(null)
    try {
      const resultado = await sugerirTipoNcAccion(accion.id)
      if (resultado) {
        setTipoNcEdit(resultado.tipo_nc)
        setSugerenciaTipoNc(resultado.justificacion)
      }
    } finally {
      setSugiriendoTipoNc(false)
    }
  }

  async function analizar() {
    setAnalizando(true)
    setRevision(null)
    try {
      const resultado = await revisarConIA(accion.id)
      setRevision(resultado)
    } finally {
      setAnalizando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex gap-2">
            {esCoordinador && (
              <button
                onClick={() => setEditando(!editando)}
                className="h-8 rounded-md border border-black/10 px-4 text-[12.5px] font-medium text-by-gray-dark transition hover:bg-black/5"
              >
                {editando ? 'Cancelar' : 'Editar'}
              </button>
            )}
            {accion.estatus !== 'abierta' && (
              <>
                <a
                  href={`/ac-ap/${accion.id}/informe`}
                  className="h-8 rounded-md border border-by-primary px-4 text-[12.5px] font-medium leading-8 text-by-primary transition hover:bg-by-primary/5"
                >
                  Descargar FSG-09 (Word)
                </a>
                <a
                  href={`/ac-ap/${accion.id}/informe/pdf`}
                  className="h-8 rounded-md border border-by-primary px-4 text-[12.5px] font-medium leading-8 text-by-primary transition hover:bg-by-primary/5"
                >
                  Descargar FSG-09 (PDF)
                </a>
              </>
            )}
          </div>
        </div>

        {editando ? (
          <div className="mb-3 flex flex-col gap-2 rounded-md bg-[#f4f6f6] p-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Responsable</label>
                <select
                  value={responsableEdit}
                  onChange={(e) => setResponsableEdit(e.target.value)}
                  className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px]"
                >
                  <option value="">— Sin asignar —</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha compromiso</label>
                <input
                  type="date"
                  value={fechaCompromisoEdit}
                  onChange={(e) => setFechaCompromisoEdit(e.target.value)}
                  className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px]"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center justify-between text-[11px] text-by-gray-dark">
                  Tipo de NC
                  <button
                    type="button"
                    onClick={sugerirTipoNc}
                    disabled={sugiriendoTipoNc}
                    className="text-[10.5px] text-by-accent hover:underline disabled:opacity-40"
                  >
                    {sugiriendoTipoNc ? 'Analizando…' : '✨ Sugerir (IA)'}
                  </button>
                </label>
                <select
                  value={tipoNcEdit}
                  onChange={(e) => setTipoNcEdit(e.target.value)}
                  className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px]"
                >
                  <option value="">— Ninguno —</option>
                  <option value="mayor">Mayor</option>
                  <option value="menor">Menor</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
            </div>
            {sugerenciaTipoNc && (
              <p className="text-[11px] italic text-by-gray-light">IA: {sugerenciaTipoNc}</p>
            )}
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await editarDatosBasicosAC(accion.id, {
                    tipo_nc: tipoNcEdit || null,
                    responsable_id: responsableEdit || null,
                    fecha_compromiso: fechaCompromisoEdit || null,
                  })
                  setEditando(false)
                  router.refresh()
                })
              }
              className="h-8 w-fit rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-60"
            >
              Guardar cambios
            </button>
          </div>
        ) : (
          <p className="mb-1 text-[14px] font-medium text-by-gray-dark">
            {accion.folio ? `[${accion.folio}] ` : ''}
            {accion.descripcion}
          </p>
        )}

        <p className="mb-3 text-[12px] capitalize text-by-gray-light">
          {accion.tipo_nc ? `No conformidad ${accion.tipo_nc}` : 'Acción correctiva'}
        </p>

        <div className="grid grid-cols-3 gap-3 text-[12.5px]">
          <div>
            <p className="text-by-gray-light">Responsable</p>
            <p className="text-by-gray-dark">{accion.responsable_nombre ?? '— Sin asignar —'}</p>
          </div>
          <div>
            <p className="text-by-gray-light">Fecha compromiso</p>
            <p className="text-by-gray-dark">
              {accion.fecha_compromiso
                ? new Date(accion.fecha_compromiso + 'T00:00:00').toLocaleDateString('es-MX')
                : '—'}
            </p>
          </div>
          {accion.evidencia_cierre && (
            <div className="col-span-3">
              <p className="text-by-gray-light">Evidencia de cierre</p>
              <p className="text-by-gray-dark">{accion.evidencia_cierre}</p>
            </div>
          )}
          {accion.comentario_validacion && (
            <div className="col-span-3">
              <p className="text-by-gray-light">Comentario del Coordinador</p>
              <p className="text-by-gray-dark">{accion.comentario_validacion}</p>
            </div>
          )}
        </div>
      </div>

      {/* Armar plan de reacción: solo si sigue "abierta" (sin plan) */}
      {puedeArmarPlan && accion.estatus === 'abierta' && (
        <form
          action={(formData) =>
            startTransition(async () => {
              await armarPlanReaccion(accion.id, formData)
              router.refresh()
            })
          }
          className="rounded-xl border border-black/5 bg-white p-4"
        >
          <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
            Armar plan de reacción (FSG-59)
          </p>
          <p className="mb-3 text-[11.5px] text-by-gray-light">
            El responsable llenará el formato completo (FSG-09) directo en la app una vez asignado.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">
                Tipo de acción
              </label>
              <select
                name="tipo_accion"
                defaultValue="correctiva"
                className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
              >
                <option value="correctiva">Correctiva</option>
                <option value="preventiva">Preventiva</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">
                Responsable
              </label>
              <select
                name="responsable_id"
                required
                defaultValue=""
                className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
              >
                <option value="" disabled>Selecciona</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">
                Fecha compromiso
              </label>
              <input
                name="fecha_compromiso"
                type="date"
                required
                className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-3 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
          >
            {pending ? 'Guardando…' : 'Asignar y notificar'}
          </button>
        </form>
      )}

      {accion.estatus !== 'abierta' && (
        <FormularioFSG09
          accionId={accion.id}
          esResponsable={esResponsable}
          esCoordinador={esCoordinador}
          bloqueado={accion.estatus === 'cerrada'}
          usuarios={usuarios}
          inicial={{
            definicion_problema: accion.definicion_problema,
            equipo_lider: accion.equipo_lider,
            equipo_miembros: accion.equipo_miembros,
            medidas_contencion: accion.medidas_contencion,
            analisis_causas: accion.analisis_causas as never,
            causa_raiz: accion.causa_raiz,
            plan_trabajo: accion.plan_trabajo,
          }}
        />
      )}

      {accion.estatus !== 'abierta' && (
        <EvidenciasAC
          accionId={accion.id}
          evidencias={accion.evidencias}
          puedeSubir={(esResponsable || esCoordinador) && accion.estatus !== 'cerrada'}
        />
      )}

      {/* Responsable envía a autorización */}
      {esResponsable && accion.estatus === 'en_proceso' && (
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[13px] font-medium text-by-gray-dark">
            Enviar a autorización
          </p>
          <textarea
            value={evidencia}
            onChange={(e) => setEvidencia(e.target.value)}
            placeholder="Describe la evidencia de que la acción quedó implementada"
            rows={3}
            className="mb-2 w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (!evidencia.trim()) {
                  alert('Describe la evidencia de cierre antes de enviar.')
                  return
                }
                try {
                  await marcarResuelta(accion.id, evidencia)
                  router.refresh()
                } catch (e) {
                  alert(e instanceof Error ? e.message : 'No se pudo enviar a autorización.')
                }
              })
            }
            className="h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
          >
            {pending ? 'Enviando…' : 'Enviar a autorización'}
          </button>
        </div>
      )}

      {/* Coordinador autoriza o rechaza */}
      {esCoordinador && accion.estatus === 'en_validacion' && (
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[13px] font-medium text-by-gray-dark">
            Autorizar cierre
          </p>

          <button
            type="button"
            onClick={analizar}
            disabled={analizando}
            className="mb-3 h-8 rounded-md border border-by-accent px-3 text-[12.5px] font-medium text-by-accent hover:bg-by-accent/10 disabled:opacity-50"
          >
            {analizando ? 'Analizando con IA…' : '✨ Analizar con IA antes de decidir'}
          </button>

          {revision && (
            <div
              className={
                'mb-3 rounded-md p-3 text-[12.5px] ' +
                (revision.recomendacion === 'liberar'
                  ? 'bg-[#eaf5f0] text-[#3d6b53]'
                  : 'bg-[#fdecea] text-[#a13c33]')
              }
            >
              <p className="font-medium">
                {revision.recomendacion === 'liberar'
                  ? '✓ La IA recomienda liberar'
                  : '⚠ La IA recomienda NO liberar todavía'}
              </p>
              <p className="mt-1">{revision.justificacion}</p>
              {revision.observaciones?.length > 0 && (
                <ul className="mt-1 list-disc pl-4">
                  {revision.observaciones.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Comentarios (opcional, se le notifican al responsable)
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={2}
            className="mb-3 w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />

          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await validarCierre(accion.id, true, comentario)
                  router.refresh()
                })
              }
              className="h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
            >
              Aprobar y cerrar
            </button>
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await validarCierre(accion.id, false, comentario)
                  router.refresh()
                })
              }
              className="h-8 w-fit rounded-md border border-red-500 px-4 text-[13px] font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              Rechazar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
