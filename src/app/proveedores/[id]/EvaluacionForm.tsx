'use client'

import { useState, useTransition, useRef } from 'react'
import { registrarEvaluacion } from '../actions'
import type { CriterioConfig } from '@/lib/criteriosProveedores'
import { AvisoOk, BotonPrincipal, Campo, FormaTarjeta, Seccion, inputCls, textareaCls } from '@/components/ui/forma'

export default function EvaluacionForm({
  proveedorId,
  criterios,
}: {
  proveedorId: string
  criterios: CriterioConfig[]
}) {
  const [esNa, setEsNa] = useState(false)
  const [listo, setListo] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      await registrarEvaluacion(proveedorId, formData)
      setListo(true)
      formRef.current?.reset()
      setEsNa(false)
    })
  }

  return (
    <FormaTarjeta
      titulo="Evaluar al proveedor"
      intro="Califica a este proveedor por su desempeño en el periodo. Cada criterio va de 0 a 10: 10 es excelente y 0 es muy malo. El sistema calcula la calificación final con el peso de cada criterio."
    >
      <form ref={formRef} action={onSubmit} className="flex flex-col gap-4">
        <Seccion numero={1} titulo="¿Cuándo se evalúa?" ayuda="Si no dio servicio en este periodo, márcalo como N/A.">
          <Campo label="Fecha de la evaluación">
            <input name="fecha_evaluacion" type="date" required className={inputCls} />
          </Campo>
          <label className="flex items-center gap-2 pt-6 text-[13.5px] text-by-gray-dark">
            <input type="checkbox" name="es_na" checked={esNa} onChange={(e) => setEsNa(e.target.checked)} />
            No dio servicio en el periodo (N/A)
          </label>
        </Seccion>

        {!esNa && (
          <Seccion numero={2} titulo="¿Qué calificación merece en cada punto?" ayuda="De 0 a 10, puedes usar medios puntos (por ejemplo 8.5). El porcentaje es cuánto pesa cada criterio.">
            {criterios.map((c, i) => (
              <Campo key={i} label={`${c.nombre} (pesa ${Math.round(c.peso * 100)}%)`}>
                <input name={`criterio_${i + 1}`} type="number" min={0} max={10} step={0.5} required={!esNa} placeholder="0 a 10" className={inputCls} />
              </Campo>
            ))}
          </Seccion>
        )}

        <Campo label="Comentarios" opcional ayuda="Por qué diste esas calificaciones o algo que quieras recordar.">
          <textarea name="observaciones" rows={2} className={textareaCls} />
        </Campo>

        {listo && <AvisoOk>Listo, la evaluación quedó registrada. La calificación final ya aparece en el historial.</AvisoOk>}
        <div>
          <BotonPrincipal pendiente={pending}>Guardar evaluación</BotonPrincipal>
        </div>
      </form>
    </FormaTarjeta>
  )
}
