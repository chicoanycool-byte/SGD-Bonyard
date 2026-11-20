'use client'

import { useActionState, useRef, useEffect, useState } from 'react'
import { registrarQueja, sugerirCriticidadYAc, type EstadoQueja } from './actions'
import { AvisoError, AvisoOk, BotonPrincipal, Campo, FormaTarjeta, Seccion, inputCls, textareaCls } from '@/components/ui/forma'

type Usuario = { id: string; nombre: string }

const inicial: EstadoQueja = {}

export default function RegistrarQuejaForm({ usuarios }: { usuarios: Usuario[] }) {
  const [estado, formAction, pending] = useActionState(registrarQueja, inicial)
  const formRef = useRef<HTMLFormElement>(null)

  const [tipoQueja, setTipoQueja] = useState('')
  const [servicio, setServicio] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [criticidad, setCriticidad] = useState('')
  const [sugerencia, setSugerencia] = useState<{ escala_ac: boolean; justificacion: string } | null>(null)
  const [sugiriendo, setSugiriendo] = useState(false)

  useEffect(() => {
    if (estado.ok) {
      formRef.current?.reset()
      setTipoQueja('')
      setServicio('')
      setDescripcion('')
      setCriticidad('')
      setSugerencia(null)
    }
  }, [estado.ok])

  async function sugerir() {
    setSugiriendo(true)
    setSugerencia(null)
    try {
      const resultado = await sugerirCriticidadYAc(descripcion, tipoQueja, servicio)
      if (resultado) {
        if (resultado.criticidad) setCriticidad(resultado.criticidad)
        setSugerencia({ escala_ac: resultado.escala_ac, justificacion: resultado.justificacion })
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo obtener la sugerencia.')
    } finally {
      setSugiriendo(false)
    }
  }

  return (
    <FormaTarjeta
      titulo="Registrar una queja"
      intro="Llena los tres bloques en orden. Al guardar, se avisa a la persona responsable y el sistema revisa si la queja necesita una acción correctiva."
    >
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <Seccion numero={1} titulo="¿Quién se queja?" ayuda="Los datos del cliente que reportó el problema.">
          <Campo label="Nombre del cliente o empresa">
            <input name="nombre_cliente" required className={inputCls} />
          </Campo>
          <Campo label="Correo del cliente" opcional ayuda="Solo si quieres poder contestarle.">
            <input name="correo_cliente" type="email" placeholder="correo@empresa.com" className={inputCls} />
          </Campo>
        </Seccion>

        <Seccion numero={2} titulo="¿Qué pasó?" ayuda="Elige el servicio y el tipo de problema, y cuéntalo con tus palabras.">
          <Campo label="¿Sobre qué servicio es?">
            <select name="servicio" required value={servicio} onChange={(e) => setServicio(e.target.value)} className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              <option value="almacenaje">Almacenaje</option>
              <option value="transporte">Transporte</option>
              <option value="seguro_mercancia">Seguro de mercancía</option>
            </select>
          </Campo>
          <Campo label="¿Qué tipo de problema fue?">
            <select name="tipo_queja" required value={tipoQueja} onChange={(e) => setTipoQueja(e.target.value)} className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              <option value="Tiempos de entrega">Tiempos de entrega</option>
              <option value="Producto dañado">Producto dañado</option>
              <option value="Producto faltante">Producto faltante</option>
              <option value="Producto sobrante">Producto sobrante</option>
              <option value="Peso incorrecto">Peso incorrecto</option>
              <option value="Mala identificación">Mala identificación</option>
              <option value="Embalaje deficiente / en mal estado">Embalaje deficiente / en mal estado</option>
              <option value="Tiempos de carga o descarga">Tiempos de carga o descarga</option>
              <option value="Mala atención">Mala atención</option>
              <option value="Comunicación deficiente">Comunicación deficiente</option>
              <option value="Plaga">Plaga</option>
              <option value="Errores en documentos">Errores en documentos</option>
            </select>
          </Campo>
          <Campo ancho label="Cuéntanos qué pasó" ayuda="Qué pasó, cuándo, qué producto o embarque y qué pidió el cliente.">
            <textarea name="descripcion" required rows={4} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className={textareaCls} />
          </Campo>
        </Seccion>

        <Seccion numero={3} titulo="¿Qué tan importante es y quién la atiende?" ayuda="Si dudas en la importancia, usa el botón de sugerencia después de escribir lo que pasó.">
          <Campo label="¿Afecta inocuidad o calidad?" ayuda="Inocuidad: puede afectar la seguridad del alimento. Calidad: servicio, entrega o documentos.">
            <select name="tipo" required defaultValue="" className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              <option value="inocuidad">Inocuidad</option>
              <option value="calidad">Calidad</option>
            </select>
          </Campo>
          <Campo label="¿Qué tan importante es?" ayuda="Alta: daño serio al cliente o riesgo a la inocuidad. Media: afecta al cliente pero se corrige. Baja: molestia menor.">
            <select name="criticidad" required value={criticidad} onChange={(e) => setCriticidad(e.target.value)} className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
            <button
              type="button"
              onClick={sugerir}
              disabled={sugiriendo || !descripcion || !tipoQueja || !servicio}
              className="mt-1.5 text-[12.5px] text-by-accent hover:underline disabled:opacity-40"
            >
              {sugiriendo ? 'Analizando…' : '✨ Que el sistema me sugiera la importancia'}
            </button>
          </Campo>
          <Campo ancho label="¿Quién va a atenderla?" ayuda="La persona que dará seguimiento y contestará al cliente.">
            <select name="usuario_responsable_id" required defaultValue="" className={inputCls}>
              <option value="" disabled>Elige a una persona</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </Campo>
        </Seccion>

        {sugerencia && (
          <div className={'rounded-lg px-4 py-3 text-[13px] ' + (sugerencia.escala_ac ? 'bg-[#fdf3e3] text-[#9a6b1c]' : 'bg-[#f4f6f6] text-by-gray-dark')}>
            {sugerencia.escala_ac ? 'Probablemente necesite una acción correctiva: ' : 'Probablemente no necesite una acción correctiva: '}
            {sugerencia.justificacion} Se confirma automáticamente al guardar.
          </div>
        )}
        {estado.error && <AvisoError>{estado.error}</AvisoError>}
        {estado.ok && (
          <AvisoOk>
            Listo, la queja quedó registrada. Se avisó a la persona responsable y el sistema revisó si necesita una acción correctiva. Lo puedes ver en la lista de abajo.
          </AvisoOk>
        )}

        <div>
          <BotonPrincipal pendiente={pending} textoPendiente="Guardando y revisando…">Guardar queja</BotonPrincipal>
        </div>
      </form>
    </FormaTarjeta>
  )
}
