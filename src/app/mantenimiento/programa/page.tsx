import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import CalendarioAnualClient from '../CalendarioAnualClient'

export default async function ProgramaMantenimientoPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const puedeGestionar = ['coordinador_sgi', 'jefe', 'gerente'].includes(quien.rol)
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
        puedeGestionar={puedeGestionar}
        catalogo={catalogo ?? []}
        mensual={mensual ?? []}
        anioInicial={anio}
      />
    </AppShell>
  )
}
