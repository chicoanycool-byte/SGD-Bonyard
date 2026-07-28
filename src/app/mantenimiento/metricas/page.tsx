import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import MetricasMantenimientoClient from './MetricasMantenimientoClient'

const PUESTOS_MANTENIMIENTO = ['Gerente de operaciones', 'Coordinador del SGI', 'Auxiliar del SGI', 'Jefe de Mantenimiento']

export default async function MetricasMantenimientoPage() {
  const quien = await requerirUsuario()
  if (!PUESTOS_MANTENIMIENTO.includes(quien.puesto ?? '')) redirect('/inicio')

  const supabase = await createClient()

  const [{ data: catalogo }, { data: indMantenimiento }] = await Promise.all([
    supabase.from('mantenimiento_catalogo').select('id, nave, tipo, nombre, orden').eq('tipo', 'mantenimiento'),
    supabase.from('indicadores_catalogo').select('id, nombre, meta_valor, periodo, meses_activos').eq('numero', 18).maybeSingle(),
  ])

  const ids = (catalogo ?? []).map((c) => c.id)
  const { data: mensual } = ids.length
    ? await supabase.from('mantenimiento_mensual').select('item_id, anio, mes, programado, realizado').in('item_id', ids)
    : { data: [] }

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/mantenimiento/metricas">
      <MetricasMantenimientoClient
        puedeGestionar={true}
        catalogo={catalogo ?? []}
        mensual={mensual ?? []}
        indicadorMantenimiento={indMantenimiento ?? null}
      />
    </AppShell>
  )
}
