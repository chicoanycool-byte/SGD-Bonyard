'use client'

import { useActionState, useRef, useEffect, useState } from 'react'
import { registrarQueja, sugerirCriticidadYAc, type EstadoQueja } from './actions'

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
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Registrar queja
      </p>
      <form ref={formRef} action={formAction} className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Nombre del cliente
          </label>
          <input
            name="nombre_cliente"
            required
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Correo del cliente (opcional)
          </label>
          <input
            name="correo_cliente"
            type="email"
            placeholder="correo@empresa.com"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Tipo de queja
          </label>
          <select
            name="tipo_queja"
            required
            value={tipoQueja}
            onChange={(e) => setTipoQueja(e.target.value)}
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>Selecciona</option>
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
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Servicio
          </label>
          <select
            name="servicio"
            required
            value={servicio}
            onChange={(e) => setServicio(e.target.value)}
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>Selecciona</option>
            <option value="almacenaje">Almacenaje</option>
            <option value="transporte">Transporte</option>
            <option value="seguro_mercancia">Seguro de mercancía</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Tipo
          </label>
          <select
            name="tipo"
            required
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>Selecciona</option>
            <option value="inocuidad">Inocuidad</option>
            <option value="calidad">Calidad</option>
          </select>
        </div>
        <div>
          <label className="mb-1 flex items-center justify-between text-[11px] text-by-gray-dark">
            Criticidad
            <button
              type="button"
              onClick={sugerir}
              disabled={sugiriendo || !descripcion || !tipoQueja || !servicio}
              className="text-[10.5px] text-by-accent hover:underline disabled:opacity-40"
            >
              {sugiriendo ? 'Analizando…' : '✨ Sugerir (IA)'}
            </button>
          </label>
          <select
            name="criticidad"
            required
            value={criticidad}
            onChange={(e) => setCriticidad(e.target.value)}
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>Selecciona</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Usuario responsable
          </label>
          <select
            name="usuario_responsable_id"
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

        <div className="col-span-3">
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Descripción
          </label>
          <textarea
            name="descripcion"
            required
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>

        {sugerencia && (
          <p
            className={
              'col-span-3 rounded-md px-3 py-2 text-[12px] ' +
              (sugerencia.escala_ac ? 'bg-[#fdf3e3] text-[#9a6b1c]' : 'bg-[#f4f6f6] text-by-gray-dark')
            }
          >
            {sugerencia.escala_ac ? '⚠ La IA sugiere que probablemente escalará a AC: ' : 'La IA sugiere que probablemente NO escalará a AC: '}
            {sugerencia.justificacion} (esto se confirmará automáticamente al registrar la queja)
          </p>
        )}

        {estado.error && (
          <p className="col-span-3 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {estado.error}
          </p>
        )}
        {estado.ok && (
          <p className="col-span-3 rounded-md bg-[#eaf5f0] px-3 py-2 text-[12px] text-[#3d6b53]">
            Queja registrada. La IA evaluó si escala a Acción Correctiva y se notificó al responsable.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="col-span-3 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
        >
          {pending ? 'Registrando y analizando…' : 'Registrar queja'}
        </button>
      </form>
    </div>
  )
}
