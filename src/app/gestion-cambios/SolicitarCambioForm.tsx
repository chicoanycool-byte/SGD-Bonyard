'use client'

import { useActionState, useEffect, useRef } from 'react'
import { solicitarCambio, type EstadoCambio } from './actions'
import { TIPOS_CAMBIO } from '@/lib/cambios'

const inicial: EstadoCambio = {}
const campo =
  'w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

export default function SolicitarCambioForm() {
  const [estado, accion, pendiente] = useActionState(solicitarCambio, inicial)
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (estado.ok) ref.current?.reset()
  }, [estado.ok])

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-1 text-[13px] font-medium text-by-gray-dark">Solicitar un cambio</p>
      <p className="mb-3 text-[11.5px] text-by-gray">
        Cualquier cambio que pueda afectar el producto, el servicio o el sistema se registra aquí antes de hacerlo.
      </p>
      <form ref={ref} action={accion} className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px] text-by-gray-dark">¿Qué se quiere cambiar? (título corto)</label>
          <input name="titulo" required className={campo + ' h-8'} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Tipo de cambio</label>
          <select name="tipo" required defaultValue="" className={campo + ' h-8 bg-white'}>
            <option value="" disabled>Selecciona…</option>
            {Object.entries(TIPOS_CAMBIO).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-[11px] text-by-gray-dark">Descripción: qué cambia exactamente</label>
          <textarea name="descripcion" required rows={3} className={campo + ' py-1.5'} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Motivo (por qué se necesita)</label>
          <textarea name="motivo" rows={3} className={campo + ' py-1.5'} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Nave</label>
          <select name="nave" defaultValue="" className={campo + ' h-8 bg-white'}>
            <option value="">—</option>
            <option>Nave 1</option>
            <option>Nave 2</option>
            <option>Ambas</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Área o proceso afectado</label>
          <input name="area_afectada" className={campo + ' h-8'} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha en que se quiere hacer</label>
          <input name="fecha_planeada" type="date" className={campo + ' h-8'} />
        </div>
        <label className="flex items-center gap-2 text-[12.5px] text-by-gray-dark md:col-span-2">
          <input type="checkbox" name="afecta_inocuidad" /> Podría afectar la inocuidad del producto
        </label>
        <div className="flex items-center gap-3">
          <button
            disabled={pendiente}
            className="h-8 rounded-md bg-by-primary px-4 text-[12px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
          >
            {pendiente ? 'Enviando…' : 'Enviar solicitud'}
          </button>
          {estado.error && <span className="text-[12px] text-red-600">{estado.error}</span>}
          {estado.ok && <span className="text-[12px] text-emerald-700">✓ Solicitud enviada</span>}
        </div>
      </form>
    </div>
  )
}
