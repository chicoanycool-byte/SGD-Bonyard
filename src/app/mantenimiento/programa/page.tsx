import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import CalendarioAnualClient from '../CalendarioAnualClient'

const PUESTOS_MANTENIMIENTO = ['Gerente de operaciones', 'Coordinador del SGI', 'Auxiliar del SGI', 'Jefe de Mantenimiento']

export default async function ProgramaMantenimientoPage() {
  const quien = await requerirUsuario()
  if (!PUESTOS_MANTENIMIENTO.includes(quien.puesto ?? '')) redirect('/inicio')

  const supabase = await createClient()
  const anio = new Date().getFullYear()

  const { data: catalogo } = await supabase
    .from('mantenimiento_catalogo')
    .select('*')
    .eq('tipo', 'mantenimiento')
    .order('nave')
    .order('orden')

  const ids = (catalogo ?? []).map((c) => c.id)
  const { data: mensual } = ids.length
    ? await supabase.from('mantenimiento_mensual').select('item_id, mes, programado, realizado').in('item_id', ids).eq('anio', anio)
    : { data: [] }

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/mantenimiento/programa">
      <CalendarioAnualClient
        tipo="mantenimiento"
        titulo="Programa de Mantenimiento Preventivo"
        codigo="FMT-01"
        puedeGestionar={true}
        catalogo={catalogo ?? []}
        mensual={mensual ?? []}
        anioInicial={anio}
      />
    </AppShell>
  )
}
