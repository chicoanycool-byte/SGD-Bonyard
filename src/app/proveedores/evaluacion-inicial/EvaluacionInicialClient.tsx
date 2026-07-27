'use client'

import { useTransition } from 'react'
import { crearEvaluacionInicial, actualizarResultadoEvaluacion, eliminarEvaluacionInicial } from './actions'

type Evaluacion = {
  id: string
  nombre_proveedor: string
  tipo_proveedor: string
  documentacion_legal: boolean
  referencias_comerciales: boolean
  capacidad_tecnica: boolean
  cumplimiento_normativo: boolean
  condiciones_comerciales: boolean
  observaciones: string | null
  resultado: string
  fecha: string
  aprobador_nombre: string | null
}
type Proveedor = { id: string; nombre: string }

const TIPO_LABEL: Record<string, string> = {
  transporte: 'Transporte',
  producto_servicio: 'Producto / Servicio',
  seguro: 'Seguros',
}
const RESULTADO_STYLE: Record<string, string> = {
  pendiente: 'bg-[#fdf3e3] text-[#9a6b1c]',
  aprobado: 'bg-[#eaf5f0] text-[#3d6b53]',
  rechazado: 'bg-[#fdecea] text-[#a13c33]',
}

const CRITERIOS: { campo: string; label: string }[] = [
  { campo: 'documentacion_legal', label: 'Documentación legal' },
  { campo: 'referencias_comerciales', label: 'Referencias comerciales' },
  { campo: 'capacidad_tecnica', label: 'Capacidad técnica' },
  { campo: 'cumplimiento_normativo', label: 'Cumplimiento normativo' },
  { campo: 'condiciones_comerciales', label: 'Condiciones comerciales' },
]

export default function EvaluacionInicialClient({
  puedeGestionar,
  evaluaciones,
  proveedores,
}: {
  puedeGestionar: boolean
  evaluaciones: Evaluacion[]
  proveedores: Proveedor[]
}) {
  const [pendiente, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Evaluación inicial de proveedor (PCO-02)</p>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Proveedor</th>
              <th className="px-3 py-2 font-normal">Tipo</th>
              <th className="px-3 py-2 font-normal">Criterios cumplidos</th>
              <th className="px-3 py-2 font-normal">Fecha</th>
              <th className="px-3 py-2 font-normal">Resultado</th>
              {puedeGestionar && <th className="px-3 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {evaluaciones.map((e) => {
              const cumplidos = CRITERIOS.filter((c) => (e as unknown as Record<string, boolean>)[c.campo]).length
              return (
                <tr key={e.id} className="border-b border-black/5 last:border-0">
                  <td className="px-3 py-2 text-by-gray-dark">{e.nombre_proveedor}</td>
                  <td className="px-3 py-2 text-by-gray-light">{TIPO_LABEL[e.tipo_proveedor] ?? e.tipo_proveedor}</td>
                  <td className="px-3 py-2 text-by-gray-light">{cumplidos}/{CRITERIOS.length}</td>
                  <td className="px-3 py-2 text-by-gray-light">{new Date(e.fecha).toLocaleDateString('es-MX')}</td>
                  <td className="px-3 py-2">
                    {puedeGestionar ? (
                      <select
                        defaultValue={e.resultado}
                        onChange={(ev) => startTransition(() => actualizarResultadoEvaluacion(e.id, ev.target.value))}
                        className={'h-7 rounded-full border-0 px-2 text-[11px] ' + (RESULTADO_STYLE[e.resultado] ?? '')}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    ) : (
                      <span className={'rounded-full px-2 py-0.5 text-[11px] ' + (RESULTADO_STYLE[e.resultado] ?? '')}>
                        {e.resultado}
                      </span>
                    )}
                  </td>
                  {puedeGestionar && (
                    <td className="px-3 py-2">
                      <button
                        onClick={() => startTransition(() => eliminarEvaluacionInicial(e.id))}
                        disabled={pendiente}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
            {evaluaciones.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin evaluaciones capturadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {puedeGestionar && (
        <form
          action={(fd) => startTransition(() => crearEvaluacionInicial(fd))}
          className="rounded-xl border border-black/5 bg-white p-4"
        >
          <p className="mb-3 text-[12.5px] font-medium text-by-gray-dark">Nueva evaluación inicial</p>
          <div className="grid grid-cols-3 gap-2">
            <select name="proveedor_id" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="">Proveedor no dado de alta aún</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <input name="nombre_proveedor" placeholder="Nombre del proveedor a evaluar" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <select name="tipo_proveedor" required defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="" disabled>Tipo de proveedor…</option>
              <option value="transporte">Transporte (FCO-01)</option>
              <option value="producto_servicio">Producto / Servicio (FCO-02)</option>
              <option value="seguro">Seguros (FCO-03)</option>
            </select>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {CRITERIOS.map((c) => (
              <label key={c.campo} className="flex items-center gap-1.5 text-[11.5px] text-by-gray-dark">
                <input type="checkbox" name={c.campo} className="h-3.5 w-3.5" />
                {c.label}
              </label>
            ))}
          </div>

          <textarea
            name="observaciones"
            placeholder="Observaciones"
            rows={2}
            className="mt-3 w-full rounded-md border border-black/10 px-2 py-1.5 text-[12px]"
          />

          <div className="mt-3 flex items-center gap-2">
            <select name="resultado" defaultValue="pendiente" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
            <button disabled={pendiente} className="h-8 rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Registrar evaluación
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
