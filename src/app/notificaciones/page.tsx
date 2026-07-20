import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import NotificacionesLista from './NotificacionesLista'

export default async function NotificacionesPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('notificaciones')
    .select('id, tipo, mensaje, leido, creado_en')
    .eq('usuario_id', quien.id)
    .eq('leido', false)
    .order('creado_en', { ascending: false })
    .limit(50)

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/notificaciones"
    >
      <NotificacionesLista notificaciones={data ?? []} />
    </AppShell>
  )
}
