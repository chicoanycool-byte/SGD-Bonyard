import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ProgramaVerificacionClient from './ProgramaVerificacionClient'

export default async function ProgramaVerificacionPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: catalogo } = await supabase.from('verificacion_programa_catalogo').select('*').eq('activo', true).order('orden')

  const ids = (catalogo ?? []).map((c) => c.id)
  const anio = new Date().getFullYear()
  const { data: mensual } = ids.length
    ? await supabase.from('verificacion_programa_mensual').select('item_id, anio, mes, programado, realizado').in('item_id', ids)
    : { data: [] }

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/verificacion-sgi/programa">
      <ProgramaVerificacionClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        catalogo={catalogo ?? []}
        mensual={mensual ?? []}
        anioInicial={anio}
      />
    </AppShell>
  )
}
