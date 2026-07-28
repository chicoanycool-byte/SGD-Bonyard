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

  const [{ data: catalogo }, { data: indMantenimiento }, { data: registrosLimpieza }] = await Promise.all([
    supabase.from('mantenimiento_catalogo').select('id, nave, tipo, nombre, orden').eq('tipo', 'mantenimiento'),
    supabase.from('indicadores_catalogo').select('id, nombre, meta_valor, periodo, meses_activos').eq('numero', 18).maybeSingle(),
    supabase
      .from('limpieza_checklist_registros')
      .select('id, nave, fecha, respuestas:limpieza_checklist_respuestas(cumple)')
      .order('fecha'),
  ])

  const registrosLimpiezaMapeados = (registrosLimpieza ?? []).map((r) => {
    const respuestas = (r.respuestas ?? []) as { cumple: string }[]
    const evaluables = respuestas.filter((x) => x.cumple !== 'NA')
    const cumplen = respuestas.filter((x) => x.cumple === 'SI')
    return {
      id: r.id as string,
      nave: r.nave as string,
      fecha: r.fecha as string,
      pct: evaluables.length > 0 ? (cumplen.length / evaluables.length) * 100 : null,
    }
  })

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
        checklistsLimpieza={registrosLimpiezaMapeados}
      />
    </AppShell>
  )
}
