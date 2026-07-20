'use client'

import { useActionState, useRef, useState } from 'react'
import { crearPNC, type EstadoPNC } from '../actions'

const inicial: EstadoPNC = {}

export default function CapturarPncForm() {
  const [estado, formAction, pending] = useActionState(crearPNC, inicial)
  const [tipo, setTipo] = useState('')
  const [previewFoto, setPreviewFoto] = useState<string | null>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const hoy = new Date().toLocaleDateString('es-MX')

  function onFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (archivo) {
      setPreviewFoto(URL.createObjectURL(archivo))
    } else {
      setPreviewFoto(null)
    }
  }

  const inputCls =
    'h-9 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  return (
    <form action={formAction} className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Capturar PNC</p>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Folio</label>
          <input value="Se asigna automático al guardar" disabled className={inputCls + ' bg-black/5 text-by-gray-light'} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha</label>
          <input value={hoy} disabled className={inputCls + ' bg-black/5 text-by-gray-light'} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Tipo de PNC</label>
          <select
            name="tipo"
            required
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={inputCls}
          >
            <option value="" disabled>Selecciona</option>
            <option value="producto">Producto</option>
            <option value="equipo">Equipo</option>
          </select>
        </div>
      </div>

      {tipo === 'producto' && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Cliente</label>
            <input name="cliente" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Proyecto</label>
            <input name="proyecto" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Lote</label>
            <input name="lote" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Código de producto</label>
            <input name="codigo_producto" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Cantidad</label>
            <input name="cantidad" type="number" step="any" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Número de tarimas</label>
            <input name="numero_tarimas" type="number" step="any" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Nombre del producto</label>
            <input name="nombre_producto" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Ubicación del PNC</label>
            <input name="ubicacion" className={inputCls} />
          </div>
          <div className="col-span-3">
            <label className="mb-1 block text-[11px] text-by-gray-dark">Descripción de la no conformidad</label>
            <textarea name="descripcion_nc" required rows={3} className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px]" />
          </div>
          <div className="col-span-3">
            <label className="mb-1 block text-[11px] text-by-gray-dark">Foto del daño</label>
            <input
              ref={inputFotoRef}
              name="foto"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFotoChange}
              className="text-[13px]"
            />
            {previewFoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewFoto} alt="Vista previa" className="mt-2 h-32 w-32 rounded-md object-cover" />
            )}
          </div>
        </div>
      )}

      {tipo === 'equipo' && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Tipo de equipo</label>
            <input name="tipo_equipo" required className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Tipo de falla</label>
            <input name="tipo_falla" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Ubicación del equipo</label>
            <input name="ubicacion_equipo" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Nombre del proveedor</label>
            <input name="nombre_proveedor" className={inputCls} />
          </div>
          <div className="col-span-3">
            <label className="mb-1 block text-[11px] text-by-gray-dark">Descripción de la falla</label>
            <textarea name="descripcion_falla" required rows={3} className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px]" />
          </div>
          <div className="col-span-3">
            <label className="mb-1 block text-[11px] text-by-gray-dark">Foto (opcional)</label>
            <input
              ref={inputFotoRef}
              name="foto"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFotoChange}
              className="text-[13px]"
            />
            {previewFoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewFoto} alt="Vista previa" className="mt-2 h-32 w-32 rounded-md object-cover" />
            )}
          </div>
        </div>
      )}

      {estado.error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{estado.error}</p>
      )}

      {tipo && (
        <button
          type="submit"
          disabled={pending}
          className="h-9 w-fit rounded-md bg-by-primary px-5 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
        >
          {pending ? 'Guardando…' : 'Guardar y enviar'}
        </button>
      )}
    </form>
  )
}
