'use client'

import { useActionState, useRef, useEffect } from 'react'
import { crearProveedor, type EstadoProveedor } from './actions'
import { AvisoError, AvisoOk, BotonPrincipal, Campo, FormaTarjeta, Seccion, inputCls } from '@/components/ui/forma'

const inicial: EstadoProveedor = {}

export default function NuevoProveedorForm() {
  const [estado, formAction, pending] = useActionState(crearProveedor, inicial)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (estado.ok) formRef.current?.reset()
  }, [estado.ok])

  return (
    <FormaTarjeta
      titulo="Dar de alta un proveedor"
      intro="Registra al proveedor y cada cuánto lo vas a evaluar. Con eso el sistema te recuerda cuándo toca evaluarlo."
    >
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <Seccion numero={1} titulo="¿Quién es el proveedor?" ayuda="Nombre y cómo contactarlo.">
          <Campo label="Nombre del proveedor">
            <input name="nombre" required className={inputCls} />
          </Campo>
          <Campo label="Correo de contacto" opcional ayuda="Se usa para avisarle de sus evaluaciones.">
            <input name="correo" type="email" placeholder="contacto@proveedor.com" className={inputCls} />
          </Campo>
        </Seccion>

        <Seccion numero={2} titulo="¿Qué nos da y cada cuánto lo evaluamos?" ayuda="Elige la categoría y la frecuencia de evaluación.">
          <Campo label="Categoría">
            <select name="categoria" required defaultValue="" className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              <option value="transporte">Transporte</option>
              <option value="fumigacion">Fumigación</option>
              <option value="limpieza">Limpieza</option>
              <option value="empaque">Empaque</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="seguros">Seguros</option>
              <option value="seguridad">Seguridad</option>
              <option value="montacargas">Montacargas</option>
            </select>
          </Campo>
          <Campo label="Producto o servicio que nos da" opcional>
            <input name="producto_servicio" className={inputCls} />
          </Campo>
          <Campo label="¿Cada cuánto se evalúa?" ayuda="Bimestral: cada 2 meses. Trimestral: cada 3. Semestral: cada 6.">
            <select name="periodicidad" required defaultValue="" className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              <option value="bimestral">Cada 2 meses (bimestral)</option>
              <option value="trimestral">Cada 3 meses (trimestral)</option>
              <option value="semestral">Cada 6 meses (semestral)</option>
            </select>
          </Campo>
        </Seccion>

        {estado.error && <AvisoError>{estado.error}</AvisoError>}
        {estado.ok && <AvisoOk>Listo, el proveedor quedó dado de alta. Ya aparece en la lista de abajo.</AvisoOk>}
        <div>
          <BotonPrincipal pendiente={pending}>Dar de alta</BotonPrincipal>
        </div>
      </form>
    </FormaTarjeta>
  )
}
