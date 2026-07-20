import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardAcAp from './DashboardAcAp'

export default async function DashboardAcApPage() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') redirect('/ac-ap')
  const supabase = await createClient()

  const { data } = await supabase
    .from('acciones_correctivas')
    .select(
      'id, folio, tipo_accion, descripcion, estatus, fecha_compromiso, fecha_cierre, creado_en, responsable:usuarios!acciones_correctivas_responsable_id_fkey(nombre)'
    )
    .order('creado_en', { ascending: false })

  const acciones = (data ?? []).map((a) => ({
    id: a.id as string,
    folio: a.folio as string | null,
    tipo_accion: a.tipo_accion as string,
    descripcion: a.descripcion as string,
    estatus: a.estatus as string,
    fecha_compromiso: a.fecha_compromiso as string | null,
    fecha_cierre: a.fecha_cierre as string | null,
    creado_en: a.creado_en as string,
    responsable_nombre:
      (a.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/ac-ap"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Dashboard de Acciones Correctivas / Preventivas
        </p>
        <Link
          href="/ac-ap"
          className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
        >
          ← Volver a AC/AP
        </Link>
      </div>
      <DashboardAcAp acciones={acciones} />
    </AppShell>
  )
}
