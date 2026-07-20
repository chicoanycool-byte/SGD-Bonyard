'use client'

import Link from 'next/link'
import { CATEGORIA_LABEL } from '@/lib/criteriosProveedores'

type Fila = {
  proveedor_id: string
  proveedor_nombre: string
  categoria: string
  clasificacion: string | null
  calificacion_pct: number | null
  fecha_evaluacion: string
}

export default function DashboardProveedores({ ultimasPorProveedor }: { ultimasPorProveedor: Fila[] }) {
  const porCategoria = new Map<string, Fila[]>()
  for (const f of ultimasPorProveedor) {
    if (!porCategoria.has(f.categoria)) porCategoria.set(f.categoria, [])
    porCategoria.get(f.categoria)!.push(f)
  }

  const resumenCategorias = [...porCategoria.entries()].map(([categoria, filas]) => {
    const conDato = filas.filter((f) => f.calificacion_pct !== null)
    const promedio =
      conDato.length > 0
        ? conDato.reduce((a, b) => a + (b.calificacion_pct ?? 0), 0) / conDato.length
        : null
    return {
      categoria,
      total: filas.length,
      promedio,
      ok: promedio !== null && promedio >= 0.81,
    }
  })

  const enPlanMejora = ultimasPorProveedor.filter((f) => f.clasificacion === 'tipo_b')

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-[#f4f6f6] px-4 py-3 text-by-primary">
          <p className="mb-1 text-[11px] opacity-80">Proveedores en seguimiento</p>
          <p className="text-[24px] font-medium">{ultimasPorProveedor.length}</p>
        </div>
        <div className="rounded-lg bg-[#fdecea] px-4 py-3 text-[#a13c33]">
          <p className="mb-1 text-[11px] opacity-80">En plan de mejora (Tipo B)</p>
          <p className="text-[24px] font-medium">{enPlanMejora.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[13px] font-medium text-by-gray-dark">Resumen por categoría</p>
        </div>
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
              <th className="px-4 py-2 font-normal">Categoría</th>
              <th className="px-4 py-2 font-normal">Proveedores</th>
              <th className="px-4 py-2 font-normal">Promedio</th>
              <th className="px-4 py-2 font-normal">Estado</th>
            </tr>
          </thead>
          <tbody>
            {resumenCategorias.map((c) => (
              <tr key={c.categoria} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-2 text-by-gray-dark">
                  {CATEGORIA_LABEL[c.categoria] ?? c.categoria}
                </td>
                <td className="px-4 py-2 text-by-gray-light">{c.total}</td>
                <td className="px-4 py-2 text-by-gray-light">
                  {c.promedio !== null ? `${Math.round(c.promedio * 100)}%` : '—'}
                </td>
                <td className="px-4 py-2">
                  {c.promedio === null ? (
                    <span className="rounded-full bg-[#f1efe8] px-2 py-0.5 text-[11px] text-[#5f5e5a]">Sin dato</span>
                  ) : c.ok ? (
                    <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[11px] text-[#3d6b53]">✓ OK</span>
                  ) : (
                    <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[11px] text-[#a13c33]">⚠ Atención</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[13px] font-medium text-by-gray-dark">Proveedores con plan de mejora</p>
        </div>
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
              <th className="px-4 py-2 font-normal">Proveedor</th>
              <th className="px-4 py-2 font-normal">Categoría</th>
              <th className="px-4 py-2 font-normal">Calificación</th>
              <th className="px-4 py-2 font-normal">Última evaluación</th>
            </tr>
          </thead>
          <tbody>
            {enPlanMejora.map((f) => (
              <tr key={f.proveedor_id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-2 text-by-gray-dark">
                  <Link href={`/proveedores/${f.proveedor_id}`} className="hover:underline">
                    {f.proveedor_nombre}
                  </Link>
                </td>
                <td className="px-4 py-2 text-by-gray-light">
                  {CATEGORIA_LABEL[f.categoria] ?? f.categoria}
                </td>
                <td className="px-4 py-2 text-by-gray-light">
                  {f.calificacion_pct ? `${Math.round(f.calificacion_pct * 100)}%` : '—'}
                </td>
                <td className="px-4 py-2 text-by-gray-light">
                  {new Date(f.fecha_evaluacion + 'T00:00:00').toLocaleDateString('es-MX')}
                </td>
              </tr>
            ))}
            {enPlanMejora.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  Ningún proveedor requiere plan de mejora actualmente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
