import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ChecklistLimpiezaClient from './ChecklistLimpiezaClient'

const PUESTOS_MANTENIMIENTO = ['Gerente de operaciones', 'Coordinador del SGI', 'Auxiliar del SGI', 'Jefe de Mantenimiento']

export default async function ChecklistLimpiezaPage() {
  const quien = await requerirUsuario()
  if (!PUESTOS_MANTENIMIENTO.includes(quien.puesto ?? '')) redirect('/inicio')

  const supabase = await createClient()

  const [{ data: catalogo }, { data: registros }] = await Promise.all([
    supabase.from('limpieza_checklist_catalogo').select('*').order('orden'),
    supabase
      .from('limpieza_checklist_registros')
      .select('id, folio, nave, fecha, auditor_nombre, receptor_nombre, comentarios_extra, respuestas:limpieza_checklist_respuestas(cumple)')
      .order('fecha', { ascending: false }),
  ])

  const registrosMapeados = (registros ?? []).map((r) => {
    const respuestas = (r.respuestas ?? []) as { cumple: string }[]
    const evaluables = respuestas.filter((x) => x.cumple !== 'NA')
    const cumplen = respuestas.filter((x) => x.cumple === 'SI')
    const pct = evaluables.length > 0 ? (cumplen.length / evaluables.length) * 100 : null
    return {
      id: r.id as string,
      folio: r.folio as string | null,
      nave: r.nave as string,
      fecha: r.fecha as string,
      auditor_nombre: r.auditor_nombre as string | null,
      receptor_nombre: r.receptor_nombre as string | null,
      pct,
    }
  })

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/mantenimiento/limpieza">
      <ChecklistLimpiezaClient catalogo={catalogo ?? []} registros={registrosMapeados} />
    </AppShell>
  )
}
