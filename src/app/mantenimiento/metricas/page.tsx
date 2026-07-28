import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import MetricasMantenimientoClient from './MetricasMantenimientoClient'

export default async function MetricasMantenimientoPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const puedeGestionar = ['coordinador_sgi', 'jefe', 'gerente'].includes(quien.rol)

  const [{ data: catalogo }, { data: indMantenimiento }, { data: indLimpieza }] = await Promise.all([
    supabase.from('mantenimiento_catalogo').select('id, nave, tipo, nombre, orden'),
    supabase.from('indicadores_catalogo').select('id, nombre, meta_valor').eq('numero', 18).maybeSingle(),
    supabase.from('indicadores_catalogo').select('id, nombre, meta_valor').eq('numero', 11).maybeSingle(),
  ])

  const ids = (catalogo ?? []).map((c) => c.id)
  const { data: mensual } = ids.length
    ? await supabase.from('mantenimiento_mensual').select('item_id, anio, mes, programado, realizado').in('item_id', ids)
    : { data: [] }

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/mantenimiento/metricas">
      <MetricasMantenimientoClient
        puedeGestionar={puedeGestionar}
        catalogo={catalogo ?? []}
        mensual={mensual ?? []}
        indicadorMantenimiento={indMantenimiento ?? null}
        indicadorLimpieza={indLimpieza ?? null}
      />
    </AppShell>
  )
}
