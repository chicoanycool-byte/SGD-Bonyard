'use client'

import { useTransition } from 'react'
import { crearAnalisisProducto, eliminarAnalisisProducto } from '../actions'

type Producto = {
  id: string
  categoria_producto: string
  descripcion: string | null
  uso_previsto: string | null
  consumidor: string | null
  alergenos: string | null
  condiciones_almacenamiento: string | null
}

export default function AnalisisProductosClient({
  esCoordinador,
  productos,
}: {
  esCoordinador: boolean
  productos: Producto[]
}) {
  const [pendiente, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Análisis de Productos</p>

      <div className="grid grid-cols-2 gap-3">
        {productos.map((p) => (
          <div key={p.id} className="rounded-xl border border-black/5 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-medium text-by-gray-dark">{p.categoria_producto}</p>
              {esCoordinador && (
                <button
                  onClick={() => startTransition(() => eliminarAnalisisProducto(p.id))}
                  disabled={pendiente}
                  className="text-[11px] text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              )}
            </div>
            <p className="mb-2 text-[12px] text-by-gray-dark">{p.descripcion}</p>
            <div className="grid grid-cols-1 gap-1.5 text-[11.5px]">
              <p><span className="text-by-gray-light">Uso previsto: </span><span className="text-by-gray-dark">{p.uso_previsto ?? '—'}</span></p>
              <p><span className="text-by-gray-light">Consumidor: </span><span className="text-by-gray-dark">{p.consumidor ?? '—'}</span></p>
              <p><span className="text-by-gray-light">Alérgenos: </span><span className="text-by-gray-dark">{p.alergenos ?? '—'}</span></p>
              <p><span className="text-by-gray-light">Condiciones de almacenamiento: </span><span className="text-by-gray-dark">{p.condiciones_almacenamiento ?? '—'}</span></p>
            </div>
          </div>
        ))}
        {productos.length === 0 && (
          <div className="col-span-2 rounded-xl border border-black/5 bg-white p-6 text-center text-[12px] text-by-gray-light">
            Sin categorías de producto capturadas.
          </div>
        )}
      </div>

      {esCoordinador && (
        <form
          action={(fd) => startTransition(() => crearAnalisisProducto(fd))}
          className="rounded-xl border border-black/5 bg-white p-4"
        >
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Agregar categoría de producto</p>
          <div className="grid grid-cols-2 gap-2">
            <input name="categoria_producto" placeholder="Categoría (ej. Alimento humano)" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <textarea name="descripcion" placeholder="Descripción" rows={2} className="col-span-2 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <input name="uso_previsto" placeholder="Uso previsto" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="consumidor" placeholder="Consumidor" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="alergenos" placeholder="Alérgenos" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="condiciones_almacenamiento" placeholder="Condiciones de almacenamiento" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="col-span-2 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Agregar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
