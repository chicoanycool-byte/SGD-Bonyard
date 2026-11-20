'use client'

import { useActionState, useEffect, useRef } from 'react'
import { solicitarCambio, type EstadoCambio } from './actions'
import { TIPOS_CAMBIO } from '@/lib/cambios'
import { AvisoError, AvisoOk, BotonPrincipal, Campo, FormaTarjeta, Seccion, inputCls, textareaCls } from '@/components/ui/forma'

const inicial: EstadoCambio = {}

export default function SolicitarCambioForm() {
  const [estado, accion, pendiente] = useActionState(solicitarCambio, inicial)
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (estado.ok) ref.current?.reset()
  }, [estado.ok])

  return (
    <FormaTarjeta
      titulo="¿Vas a cambiar algo? Avísalo aquí antes de hacerlo"
      intro="Un cambio es cualquier modificación a un proceso, equipo, proveedor, producto, documentos o personal que pueda afectar la calidad o la inocuidad. El Coordinador del SGI lo revisa y te dice si puedes avanzar."
    >
      <form ref={ref} action={accion} className="flex flex-col gap-4">
        <Seccion numero={1} titulo="¿Qué quieres cambiar?" ayuda="Dale un nombre corto y explica qué cambia exactamente.">
          <Campo ancho label="Nombre corto del cambio" ayuda="Ej. Cambio de proveedor de tarimas.">
            <input name="titulo" required className={inputCls} />
          </Campo>
          <Campo label="¿Qué tipo de cambio es?">
            <select name="tipo" required defaultValue="" className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              {Object.entries(TIPOS_CAMBIO).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Campo>
          <Campo label="¿En qué nave?" opcional>
            <select name="nave" defaultValue="" className={inputCls}>
              <option value="">No aplica</option>
              <option>Nave 1</option>
              <option>Nave 2</option>
              <option>Ambas</option>
            </select>
          </Campo>
          <Campo ancho label="¿Qué cambia exactamente?">
            <textarea name="descripcion" required rows={3} className={textareaCls} />
          </Campo>
          <Campo ancho label="¿Por qué se necesita?" opcional>
            <textarea name="motivo" rows={2} className={textareaCls} />
          </Campo>
        </Seccion>

        <Seccion numero={2} titulo="¿A quién y a qué afecta?" ayuda="Esto ayuda a evaluar el riesgo.">
          <Campo label="Área o proceso afectado" opcional>
            <input name="area_afectada" className={inputCls} />
          </Campo>
          <Campo label="¿Para cuándo lo quieres hacer?" opcional>
            <input name="fecha_planeada" type="date" className={inputCls} />
          </Campo>
          <label className="flex items-start gap-2 text-[13.5px] text-by-gray-dark md:col-span-2">
            <input type="checkbox" name="afecta_inocuidad" className="mt-1" />
            <span>Podría afectar la inocuidad del producto<br /><span className="text-[12px] text-by-gray">Márcalo si hay duda; el Coordinador del SGI lo revisa con más cuidado.</span></span>
          </label>
        </Seccion>

        {estado.error && <AvisoError>{estado.error}</AvisoError>}
        {estado.ok && <AvisoOk>Listo, tu solicitud quedó enviada. El Coordinador del SGI la va a evaluar y te llegará un aviso con la decisión. Aún no hagas el cambio.</AvisoOk>}
        <div>
          <BotonPrincipal pendiente={pendiente} textoPendiente="Enviando…">Enviar solicitud</BotonPrincipal>
        </div>
      </form>
    </FormaTarjeta>
  )
}
