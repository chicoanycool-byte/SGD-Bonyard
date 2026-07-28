import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import CalendarioAnualClient from '../CalendarioAnualClient'

export default async function ChecklistLimpiezaPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const puedeGestionar = ['coordinador_sgi', 'jefe', 'gerente'].includes(quien.rol)
  const anio = new Date().getFullYear()

  const { data: catalogo } = await supabase
    .from('mantenimiento_catalogo')
    .select('*')
    .eq('tipo', 'limpieza')
    .order('nave')
    .order('orden')

  const ids = (catalogo ?? []).map((c) => c.id)
  const { data: mensual } = ids.length
    ? await supabase.from('mantenimiento_mensual').select('item_id, mes, programado, realizado').in('item_id', ids).eq('anio', anio)
    : { data: [] }

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/mantenimiento/limpieza">
      <CalendarioAnualClient
        tipo="limpieza"
        titulo="Checklist de Limpieza"
        codigo="PSG-07"
        puedeGestionar={puedeGestionar}
        catalogo={catalogo ?? []}
        mensual={mensual ?? []}
        anioInicial={anio}
      />
    </AppShell>
  )
}
