'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { enviarRecordatoriosEvaluacion } from './actions'
import { CATEGORIA_LABEL } from '@/lib/criteriosProveedores'

type Proveedor = {
  id: string
  nombre: string
  categoria: string
  producto_servicio: string | null
  periodicidad: string
  ultima_clasificacion: string | null
  ultima_calificacion: number | null
}

export default function ProveedoresTabla({
  proveedores,
  esCoordinador,
}: {
  proveedores: Proveedor[]
  esCoordinador: boolean
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-2">
        <p className="text-[13px] font-medium text-by-gray-dark">Proveedores</p>
        {esCoordinador && (
          <button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const n = await enviarRecordatoriosEvaluacion()
                alert(`Se enviaron ${n} recordatorio(s) de evaluación pendiente.`)
              })
            }
            className="text-[12px] text-by-accent hover:underline disabled:opacity-50"
          >
            Enviar recordatorios de evaluación
          </button>
        )}
      </div>
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
            <th className="px-4 py-2 font-normal">Nombre</th>
            <th className="px-4 py-2 font-normal">Categoría</th>
            <th className="px-4 py-2 font-normal">Producto / Servicio</th>
            <th className="px-4 py-2 font-normal">Periodicidad</th>
            <th className="px-4 py-2 font-normal">Última clasificación</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.map((p) => (
            <tr key={p.id} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-2 text-by-gray-dark">
                <Link href={`/proveedores/${p.id}`} className="hover:underline">
                  {p.nombre}
                </Link>
              </td>
              <td className="px-4 py-2 text-by-gray-light">
                {CATEGORIA_LABEL[p.categoria] ?? p.categoria}
              </td>
              <td className="px-4 py-2 text-by-gray-light">{p.producto_servicio ?? '—'}</td>
              <td className="px-4 py-2 capitalize text-by-gray-light">{p.periodicidad}</td>
              <td className="px-4 py-2">
                {p.ultima_clasificacion === 'tipo_a' && (
                  <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[11px] text-[#3d6b53]">
                    Tipo A ({Math.round((p.ultima_calificacion ?? 0) * 100)}%)
                  </span>
                )}
                {p.ultima_clasificacion === 'tipo_b' && (
                  <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[11px] text-[#a13c33]">
                    Tipo B ({Math.round((p.ultima_calificacion ?? 0) * 100)}%)
                  </span>
                )}
                {!p.ultima_clasificacion && (
                  <span className="text-[12px] text-by-gray-light">Sin evaluar</span>
                )}
              </td>
            </tr>
          ))}
          {proveedores.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                No hay proveedores dados de alta.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
