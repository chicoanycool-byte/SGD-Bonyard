import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardProveedores from './DashboardProveedores'

export default async function DashboardProveedoresPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('proveedores')
    .select(
      'id, nombre, categoria, evaluaciones_proveedor(clasificacion, calificacion_pct, fecha_evaluacion)'
    )
    .eq('estatus', 'activo')

  const ultimasPorProveedor = (data ?? [])
    .map((p) => {
      const evals = (p.evaluaciones_proveedor ?? []) as unknown as {
        clasificacion: string | null
        calificacion_pct: number | null
        fecha_evaluacion: string
      }[]
      const ultima = evals
        .filter((e) => e.clasificacion)
        .sort((a, b) => (a.fecha_evaluacion < b.fecha_evaluacion ? 1 : -1))[0]

      if (!ultima) return null
      return {
        proveedor_id: p.id as string,
        proveedor_nombre: p.nombre as string,
        categoria: p.categoria as string,
        clasificacion: ultima.clasificacion,
        calificacion_pct: ultima.calificacion_pct,
        fecha_evaluacion: ultima.fecha_evaluacion,
      }
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/proveedores"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Dashboard de Proveedores</p>
        <Link
          href="/proveedores"
          className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
        >
          ← Volver
        </Link>
      </div>
      <DashboardProveedores ultimasPorProveedor={ultimasPorProveedor} />
    </AppShell>
  )
}
