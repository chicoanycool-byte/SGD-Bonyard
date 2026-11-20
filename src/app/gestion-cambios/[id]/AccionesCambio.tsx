'use client'

import { useActionState } from 'react'
import {
  evaluarCambio,
  registrarImplementacion,
  cerrarCambio,
  type EstadoCambio,
} from '../actions'
import { AvisoError, AvisoOk, Campo, inputCls, textareaCls } from '@/components/ui/forma'

const inicial: EstadoCambio = {}
const boton =
  'h-10 rounded-lg bg-by-primary px-5 text-[14px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60'

function Mensaje({ e }: { e: EstadoCambio }) {
  if (e.error) return <AvisoError>{e.error}</AvisoError>
  if (e.ok) return <AvisoOk>Listo, quedó guardado.</AvisoOk>
  return null
}

export function EvaluarForm({
  id,
  usuarios,
  fechaPlaneada,
}: {
  id: string
  usuarios: { id: string; nombre: string }[]
  fechaPlaneada: string | null
}) {
  const [estado, accion, pendiente] = useActionState(evaluarCambio.bind(null, id), inicial)
  return (
    <form action={accion} className="flex flex-col gap-4">
      <p className="text-[12.5px] text-by-gray">Revisa qué podría salir mal, decide el nivel de riesgo y apruébalo o recházalo. Si lo apruebas, asigna a quien lo va a implementar.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Campo label="¿Qué tan riesgoso es el cambio?" ayuda="Alto: puede afectar inocuidad o a un cliente importante. Bajo: no cambia la forma de trabajar.">
          <select name="riesgo_nivel" defaultValue="" required className={inputCls}>
            <option value="" disabled>Elige una opción</option>
            <option value="bajo">Bajo</option>
            <option value="medio">Medio</option>
            <option value="alto">Alto</option>
          </select>
        </Campo>
        <Campo label="¿Quién lo va a implementar?" opcional>
          <select name="responsable_id" defaultValue="" className={inputCls}>
            <option value="">Asignar después</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </Campo>
        <Campo ancho label="¿Qué podría salir mal y cómo se controla?" ayuda="Piensa en inocuidad, calidad y clientes.">
          <textarea name="evaluacion_riesgo" required rows={3} className={textareaCls} />
        </Campo>
        <Campo ancho label="¿Hay pasos previos o controles necesarios?" opcional>
          <textarea name="controles_requeridos" rows={2} className={textareaCls} />
        </Campo>
        <div className="flex flex-col gap-2 text-[13.5px] text-by-gray-dark md:col-span-2">
          <label className="flex items-center gap-2"><input type="checkbox" name="requiere_capacitacion" /> Hay que capacitar al personal</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="requiere_actualizar_documentos" /> Hay que actualizar documentos del SGI</label>
        </div>
        <Campo label="Fecha planeada" opcional>
          <input name="fecha_planeada" type="date" defaultValue={fechaPlaneada ?? ''} className={inputCls} />
        </Campo>
        <Campo label="Comentario sobre tu decisión" ayuda="Obligatorio si lo rechazas: explica por qué.">
          <input name="comentario_decision" className={inputCls} />
        </Campo>
      </div>
      <Mensaje e={estado} />
      <div className="flex flex-wrap items-center gap-3">
        <button name="decision" value="aprobar" disabled={pendiente} className={boton}>Aprobar cambio</button>
        <button
          name="decision"
          value="rechazar"
          disabled={pendiente}
          className="h-10 rounded-lg border border-red-200 px-5 text-[14px] font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
        >
          Rechazar
        </button>
      </div>
    </form>
  )
}

export function ImplementacionForm({ id }: { id: string }) {
  const [estado, accion, pendiente] = useActionState(registrarImplementacion.bind(null, id), inicial)
  return (
    <form action={accion} className="flex flex-col gap-4">
      <p className="text-[12.5px] text-by-gray">Cuando ya hiciste el cambio, anota qué hiciste y qué evidencia queda. Después el Coordinador del SGI verifica que funcionó.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Campo label="¿Qué día lo hiciste?">
          <input name="fecha_implementacion" type="date" required className={inputCls} />
        </Campo>
        <Campo ancho label="¿Qué se hizo y qué evidencia hay?" ayuda="Registros, fotos, lista de capacitación, documentos nuevos.">
          <textarea name="evidencia_implementacion" required rows={3} className={textareaCls} />
        </Campo>
      </div>
      <Mensaje e={estado} />
      <div><button disabled={pendiente} className={boton}>Registrar que ya lo hice</button></div>
    </form>
  )
}

export function CierreForm({ id }: { id: string }) {
  const [estado, accion, pendiente] = useActionState(cerrarCambio.bind(null, id), inicial)
  return (
    <form action={accion} className="flex flex-col gap-4">
      <p className="text-[12.5px] text-by-gray">Último paso: confirma que, ya implementado, el cambio no afectó la calidad ni la inocuidad.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Campo ancho label="¿Cómo verificaste que funcionó?" ayuda="Qué revisaste y qué viste.">
          <textarea name="verificacion_post" required rows={3} className={textareaCls} />
        </Campo>
        <Campo label="¿El cambio funcionó bien?">
          <select name="cambio_efectivo" defaultValue="" required className={inputCls}>
            <option value="" disabled>Elige una opción</option>
            <option value="si">Sí</option>
            <option value="no">No (se le dará seguimiento)</option>
          </select>
        </Campo>
      </div>
      <Mensaje e={estado} />
      <div><button disabled={pendiente} className={boton}>Verificar y cerrar</button></div>
    </form>
  )
}
