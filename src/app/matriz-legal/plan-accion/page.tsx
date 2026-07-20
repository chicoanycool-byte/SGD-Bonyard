import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PlanAccionTabla from './PlanAccionTabla'

const ROLES_GESTION = ['coordinador_sgi']

export default async function PlanAccionLegalPage() {
  const quien = await requerirUsuario()
  const puedeEditar = ROLES_GESTION.includes(quien.rol)
  const supabase = await createClient()

  const [{ data }, { data: usuarios }] = await Promise.all([
    supabase.from('matriz_legal_plan_accion').select('*').order('numero'),
    supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre'),
  ])

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/matriz-legal"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Plan de Acción — Cierre de Brechas Legales (FSG-19)
        </p>
        <Link
          href="/matriz-legal"
          className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
        >
          ← Volver a la matriz
        </Link>
      </div>
      <PlanAccionTabla items={data ?? []} usuarios={usuarios ?? []} puedeEditar={puedeEditar} />
    </AppShell>
  )
}
