import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardEHS from './DashboardEHS'

export default async function IndicadorLegalPage() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') redirect('/matriz-legal/plan-accion')
  const supabase = await createClient()

  const [{ data: filas }, { data: plan }] = await Promise.all([
    supabase.from('matriz_legal').select('numero, tema, norma, requisito_legal, evidencia'),
    supabase
      .from('matriz_legal_plan_accion')
      .select('numero, descripcion_hallazgo, nivel_riesgo, estatus, responsable, fecha_compromiso'),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/matriz-legal">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Métricas EHS — Indicador de Cumplimiento Legal (FSG-19)
        </p>
        <Link
          href="/matriz-legal"
          className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
        >
          ← Volver a la matriz
        </Link>
      </div>
      <DashboardEHS filas={filas ?? []} plan={plan ?? []} />
    </AppShell>
  )
}
