'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearAccionManual, type EstadoAccionManual } from './actions'
import { AvisoError, BotonPrincipal, Campo, FormaTarjeta, Seccion, inputCls, textareaCls } from '@/components/ui/forma'

type Usuario = { id: string; nombre: string }

const inicial: EstadoAccionManual = {}

export default function NuevaAccionManualForm({ usuarios }: { usuarios: Usuario[] }) {
  const [estado, formAction, pending] = useActionState(crearAccionManual, inicial)
  const [mostrar, setMostrar] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (estado.accionId) router.push(`/ac-ap/${estado.accionId}`)
  }, [estado.accionId, router])

  if (!mostrar) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-4">
        <div>
          <p className="text-[14px] font-medium text-by-gray-dark">¿Encontraste un problema o quieres evitar uno?</p>
          <p className="text-[12.5px] text-by-gray">Abre una acción correctiva (corregir algo que ya pasó) o preventiva (evitar que pase).</p>
        </div>
        <button onClick={() => setMostrar(true)} className="h-10 shrink-0 rounded-lg bg-by-primary px-4 text-[14px] font-medium text-white hover:bg-by-primary-dark">
          + Abrir una acción
        </button>
      </div>
    )
  }

  return (
    <FormaTarjeta
      titulo="Abrir una acción correctiva o preventiva"
      intro="Solo lo primero es obligatorio. Al guardar te lleva al detalle de la acción para seguir con el análisis."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <Seccion numero={1} titulo="¿Qué quieres registrar?" ayuda="Escribe el problema con claridad: qué pasó, dónde y cuándo.">
          <Campo label="¿Qué tipo de acción es?" ayuda="Correctiva: ya pasó y hay que corregirlo. Preventiva: todavía no pasa y quieres evitarlo.">
            <select name="tipo_accion" defaultValue="correctiva" className={inputCls}>
              <option value="correctiva">Correctiva (ya pasó)</option>
              <option value="preventiva">Preventiva (evitar que pase)</option>
            </select>
          </Campo>
          <Campo label="¿Qué tan grave es el hallazgo?" opcional ayuda="Crítica: pone en riesgo la inocuidad. Mayor: falla importante del sistema. Menor: detalle aislado.">
            <select name="tipo_nc" defaultValue="" className={inputCls}>
              <option value="">No aplica / no lo sé</option>
              <option value="critica">Crítica</option>
              <option value="mayor">Mayor</option>
              <option value="menor">Menor</option>
            </select>
          </Campo>
          <Campo ancho label="Descripción del problema">
            <textarea name="descripcion" required rows={4} className={textareaCls} />
          </Campo>
        </Seccion>

        <Seccion numero={2} titulo="¿Quién y para cuándo?" ayuda="Puedes dejarlo vacío y asignarlo después.">
          <Campo label="Responsable" opcional>
            <select name="responsable_id" defaultValue="" className={inputCls}>
              <option value="">Asignar después</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Fecha en que debe estar resuelta" opcional>
            <input name="fecha_compromiso" type="date" className={inputCls} />
          </Campo>
        </Seccion>

        <Seccion numero={3} titulo="¿Tiene que ver con un cliente o servicio?" ayuda="Solo si aplica.">
          <Campo label="Cliente" opcional>
            <input name="cliente" className={inputCls} />
          </Campo>
          <Campo label="Servicio" opcional>
            <select name="servicio" defaultValue="" className={inputCls}>
              <option value="">Ninguno</option>
              <option value="Almacenaje">Almacenaje</option>
              <option value="Transporte">Transporte</option>
              <option value="Seguro de mercancía">Seguro de mercancía</option>
            </select>
          </Campo>
        </Seccion>

        {estado.error && <AvisoError>{estado.error}</AvisoError>}
        <div className="flex items-center gap-4">
          <BotonPrincipal pendiente={pending} textoPendiente="Creando…">Crear acción</BotonPrincipal>
          <button type="button" onClick={() => setMostrar(false)} className="text-[13px] text-by-gray hover:underline">Cancelar</button>
        </div>
      </form>
    </FormaTarjeta>
  )
}
