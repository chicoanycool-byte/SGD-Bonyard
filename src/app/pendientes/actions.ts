'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function cerrarPendiente(id: string) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: pendiente } = await supabase
    .from('pendientes')
    .select('usuario_id')
    .eq('id', id)
    .single()

  const puedeCerrar =
    quien.rol === 'coordinador_sgi' || pendiente?.usuario_id === quien.id
  if (!puedeCerrar) {
    throw new Error('No autorizado.')
  }

  await supabase.from('pendientes').delete().eq('id', id)
  revalidatePath('/pendientes')
}
