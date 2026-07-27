import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardPNC from './DashboardPNC'

export default async function DashboardPNCPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('pnc_registros')
    .select(
      'id, folio, tipo, fecha, cliente, nombre_producto, tipo_equipo, tipo_falla, nombre_proveedor, disposicion, estatus, creado_en'
    )
    .order('creado_en', { ascending: false })

  const registros = (data ?? []).map((r) => ({
    id: r.id as string,
    folio: r.folio as string | null,
    tipo: r.tipo as string,
    fecha: r.fecha as string,
    cliente: r.cliente as string | null,
    nombre_producto: r.nombre_producto as string | null,
    tipo_equipo: r.tipo_equipo as string | null,
    tipo_falla: r.tipo_falla as string | null,
    nombre_proveedor: r.nombre_proveedor as string | null,
    disposicion: r.disposicion as string | null,
    estatus: r.estatus as string,
    creado_en: r.creado_en as string,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/pnc/registro">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Métricas de Producto y Equipo No Conforme</p>
        <Link
          href="/pnc/registro"
          className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
        >
          ← Volver a PNC
        </Link>
      </div>
      <DashboardPNC registros={registros} />
    </AppShell>
  )
}
