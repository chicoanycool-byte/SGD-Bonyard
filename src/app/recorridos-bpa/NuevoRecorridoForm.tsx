'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { crearRecorrido, type EstadoRecorrido } from './actions'
import { AvisoError, BotonPrincipal, Campo, FormaTarjeta, Seccion, inputCls } from '@/components/ui/forma'

const inicial: EstadoRecorrido = {}

export default function NuevoRecorridoForm() {
  const [estado, formAction, pending] = useActionState(crearRecorrido, inicial)
  const router = useRouter()

  useEffect(() => {
    if (estado.recorridoId) router.push(`/recorridos-bpa/${estado.recorridoId}`)
  }, [estado.recorridoId, router])

  return (
    <FormaTarjeta
      titulo="Empezar un recorrido de buenas prácticas (BPA)"
      intro="Un recorrido es revisar las instalaciones con una lista de 204 puntos. Llena estos datos y al guardar se abre la lista para ir marcando punto por punto; el avance se guarda solo."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Seccion numero={1} titulo="¿Cuándo y dónde?" ayuda="Fecha, nave y tipo de recorrido.">
          <Campo label="Fecha del recorrido">
            <input name="fecha" type="date" required className={inputCls} />
          </Campo>
          <Campo label="¿Qué nave vas a recorrer?">
            <select name="naves_inspeccionadas" defaultValue="" className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              <option value="Nave 1">Nave 1</option>
              <option value="Nave 2">Nave 2</option>
              <option value="Nave 3">Nave 3</option>
            </select>
          </Campo>
          <Campo label="¿Qué tipo de recorrido es?" ayuda="Rutinaria: la revisión normal. Extraordinaria: por un evento o queja.">
            <select name="tipo_inspeccion" required defaultValue="" className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              <option value="rutinaria">Rutinaria</option>
              <option value="extraordinaria">Extraordinaria</option>
              <option value="auditoria_interna">Auditoría interna</option>
              <option value="pre_auditoria_sqf">Pre-auditoría SQF</option>
            </select>
          </Campo>
          <Campo label="Hora en que empiezas" opcional>
            <input name="hora_inicio" type="time" className={inputCls} />
          </Campo>
        </Seccion>

        <Seccion numero={2} titulo="¿Con quién lo recorres?" ayuda="Todo es opcional, pero queda en el registro.">
          <Campo label="Turno" opcional>
            <select name="turno" defaultValue="" className={inputCls}>
              <option value="">No aplica</option>
              <option value="Matutino">Matutino</option>
              <option value="Vespertino">Vespertino</option>
              <option value="Nocturno">Nocturno</option>
            </select>
          </Campo>
          <Campo label="Supervisor del área" opcional>
            <input name="supervisor_area" className={inputCls} />
          </Campo>
          <Campo label="Cargo del supervisor" opcional>
            <input name="cargo_supervisor" className={inputCls} />
          </Campo>
        </Seccion>

        {estado.error && <AvisoError>{estado.error}</AvisoError>}
        <div>
          <BotonPrincipal pendiente={pending} textoPendiente="Preparando la lista…">Empezar recorrido</BotonPrincipal>
        </div>
      </form>
    </FormaTarjeta>
  )
}
