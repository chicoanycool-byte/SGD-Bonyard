import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardQuejas from './DashboardQuejas'

export default async function DashboardQuejasPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('quejas')
    .select(
      'id, folio, nombre_cliente, servicio, criticidad, tipo_queja, estatus, escalada_ac, fecha_limite, fecha_cierre, creado_en, responsable:usuarios!quejas_usuario_responsable_id_fkey(nombre)'
    )
    .order('creado_en', { ascending: false })

  const quejas = (data ?? []).map((q) => ({
    id: q.id as string,
    folio: q.folio as string | null,
    nombre_cliente: q.nombre_cliente as string,
    servicio: q.servicio as string,
    criticidad: q.criticidad as string | null,
    tipo_queja: q.tipo_queja as string,
    estatus: q.estatus as string,
    escalada_ac: q.escalada_ac as boolean,
    fecha_limite: q.fecha_limite as string | null,
    fecha_cierre: q.fecha_cierre as string | null,
    creado_en: q.creado_en as string,
    responsable_nombre:
      (q.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/quejas"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Dashboard de Quejas
        </p>
        <Link
          href="/quejas"
          className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
        >
          ← Volver a Quejas
        </Link>
      </div>
      <DashboardQuejas quejas={quejas} />
    </AppShell>
  )
}
