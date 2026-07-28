import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import CalendarioAnualClient from '../CalendarioAnualClient'

const PUESTOS_MANTENIMIENTO = ['Gerente de operaciones', 'Coordinador del SGI', 'Auxiliar del SGI', 'Jefe de Mantenimiento']

export default async function ChecklistLimpiezaPage() {
  const quien = await requerirUsuario()
  if (!PUESTOS_MANTENIMIENTO.includes(quien.puesto ?? '')) redirect('/inicio')

  const supabase = await createClient()
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
        puedeGestionar={true}
        catalogo={catalogo ?? []}
        mensual={mensual ?? []}
        anioInicial={anio}
      />
    </AppShell>
  )
}
