import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ChatAsesor from './ChatAsesor'

export default async function AsesorPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('asesor_mensajes')
    .select('rol, contenido')
    .eq('usuario_id', quien.id)
    .order('creado_en', { ascending: true })
    .limit(50)

  const mensajes = (data ?? []).map((m) => ({
    rol: m.rol as 'user' | 'assistant',
    contenido: m.contenido as string,
  }))

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/asesor"
    >
      <ChatAsesor mensajesIniciales={mensajes} />
    </AppShell>
  )
}
