'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function marcarLeida(id: string) {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  // Al marcar como leída se elimina, según lo solicitado
  await supabase
    .from('notificaciones')
    .delete()
    .eq('id', id)
    .eq('usuario_id', quien.id)
  revalidatePath('/notificaciones')
  revalidatePath('/inicio')
}

export async function marcarTodasLeidas() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  await supabase
    .from('notificaciones')
    .delete()
    .eq('usuario_id', quien.id)
  revalidatePath('/notificaciones')
  revalidatePath('/inicio')
}
