import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import NuevoProveedorForm from './NuevoProveedorForm'
import ProveedoresTabla from './ProveedoresTabla'

const ROLES_GESTION = ['coordinador_sgi']

export default async function ProveedoresPage() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') redirect('/inicio')
  const puedeGestionar = ROLES_GESTION.includes(quien.rol)
  const supabase = await createClient()

  const { data: proveedoresData } = await supabase
    .from('proveedores')
    .select(
      'id, nombre, categoria, producto_servicio, periodicidad, evaluaciones_proveedor(clasificacion, calificacion_pct, fecha_evaluacion)'
    )
    .eq('estatus', 'activo')
    .order('nombre')

  const proveedores = (proveedoresData ?? []).map((p) => {
    const evals = (p.evaluaciones_proveedor ?? []) as unknown as {
      clasificacion: string | null
      calificacion_pct: number | null
      fecha_evaluacion: string
    }[]
    const ultima = evals
      .filter((e) => e.clasificacion)
      .sort((a, b) => (a.fecha_evaluacion < b.fecha_evaluacion ? 1 : -1))[0]

    return {
      id: p.id as string,
      nombre: p.nombre as string,
      categoria: p.categoria as string,
      producto_servicio: p.producto_servicio as string | null,
      periodicidad: p.periodicidad as string,
      ultima_clasificacion: ultima?.clasificacion ?? null,
      ultima_calificacion: ultima?.calificacion_pct ?? null,
    }
  })

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/proveedores"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-by-gray-dark">Proveedores (FCO-05)</p>
          <div className="flex gap-2">
            <Link
              href="/proveedores/dashboard"
              className="h-8 rounded-md bg-by-primary px-3 text-[12px] font-medium leading-8 text-white transition hover:bg-by-primary-dark"
            >
              Ver Dashboard
            </Link>
            <a
              href="/proveedores/exportar/excel"
              className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
            >
              Exportar Excel
            </a>
            <a
              href="/proveedores/exportar/pdf"
              className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
            >
              Exportar PDF
            </a>
          </div>
        </div>
        {puedeGestionar && <NuevoProveedorForm />}
        <ProveedoresTabla proveedores={proveedores} esCoordinador={quien.rol === 'coordinador_sgi'} />
      </div>
    </AppShell>
  )
}
