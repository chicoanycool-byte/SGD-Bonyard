'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

const ROLES = [
  'coordinador_sgi',
  'director',
  'gerente',
  'jefe',
  'supervisor',
] as const

export type EstadoCrearUsuario = {
  error?: string
  passwordTemporal?: string
  correoCreado?: string
}

export type EstadoEditarUsuario = { error?: string; ok?: boolean }

export async function editarUsuario(
  usuarioId: string,
  campos: {
    usuario: string
    nombre: string
    correo: string
    puesto: string | null
    rol: string
  }
): Promise<EstadoEditarUsuario> {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    return { error: 'No autorizado.' }
  }

  if (!campos.usuario.trim() || !campos.nombre.trim() || !campos.correo.trim()) {
    return { error: 'Usuario, nombre y correo son obligatorios.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('usuarios')
    .update({
      usuario: campos.usuario.trim(),
      nombre: campos.nombre.trim(),
      correo: campos.correo.trim(),
      puesto: campos.puesto?.trim() || null,
      rol: campos.rol,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', usuarioId)

  if (error) {
    return { error: error.message.includes('duplicate') ? 'Ese nombre de usuario ya existe.' : 'No se pudo guardar. ' + error.message }
  }

  revalidatePath('/usuarios')
  return { ok: true }
}

export async function crearUsuario(
  _prevState: EstadoCrearUsuario,
  formData: FormData
): Promise<EstadoCrearUsuario> {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    return { error: 'No autorizado.' }
  }

  const usuario = String(formData.get('usuario') ?? '').trim().toLowerCase()
  const nombre = String(formData.get('nombre') ?? '').trim()
  const correo = String(formData.get('correo') ?? '').trim().toLowerCase()
  const puesto = String(formData.get('puesto') ?? '').trim()
  const rol = String(formData.get('rol') ?? '')

  if (!usuario || !nombre || !correo || !rol) {
    return { error: 'Completa todos los campos obligatorios.' }
  }

  if (!(ROLES as readonly string[]).includes(rol)) {
    return { error: 'Rol inválido.' }
  }

  if (!correo.endsWith('@bonyard.mx')) {
    return { error: 'El correo debe ser @bonyard.mx.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('admin_crear_usuario', {
    p_usuario: usuario,
    p_nombre: nombre,
    p_correo: correo,
    p_puesto: puesto || null,
    p_rol: rol,
  })

  if (error) {
    if (error.message.includes('duplicate')) {
      return { error: 'Ese usuario o correo ya existe.' }
    }
    return { error: 'No se pudo crear el usuario. ' + error.message }
  }

  revalidatePath('/usuarios')
  return { passwordTemporal: data as string, correoCreado: correo }
}

export async function restablecerPassword(usuarioId: string): Promise<string> {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_restablecer_password', {
    p_usuario_id: usuarioId,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/usuarios')
  return data as string
}

export async function cambiarEstatusUsuario(
  usuarioId: string,
  estatus: 'activo' | 'pausado' | 'baja'
) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_cambiar_estatus_usuario', {
    p_usuario_id: usuarioId,
    p_estatus: estatus,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/usuarios')
}
