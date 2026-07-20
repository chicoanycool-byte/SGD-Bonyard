'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'

export type EstadoPNC = { error?: string }

export async function crearPNC(_prevState: EstadoPNC, formData: FormData): Promise<EstadoPNC> {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const tipo = String(formData.get('tipo') ?? '')
  if (tipo !== 'producto' && tipo !== 'equipo') {
    return { error: 'Selecciona el tipo de PNC.' }
  }

  const base: Record<string, unknown> = {
    tipo,
    creado_por: quien.id,
  }

  if (tipo === 'producto') {
    base.cliente = String(formData.get('cliente') ?? '').trim()
    base.proyecto = String(formData.get('proyecto') ?? '').trim()
    base.lote = String(formData.get('lote') ?? '').trim()
    base.codigo_producto = String(formData.get('codigo_producto') ?? '').trim()
    base.cantidad = Number(formData.get('cantidad') ?? 0) || null
    base.numero_tarimas = Number(formData.get('numero_tarimas') ?? 0) || null
    base.nombre_producto = String(formData.get('nombre_producto') ?? '').trim()
    base.descripcion_nc = String(formData.get('descripcion_nc') ?? '').trim()
    base.ubicacion = String(formData.get('ubicacion') ?? '').trim()

    if (!base.cliente || !base.nombre_producto || !base.descripcion_nc) {
      return { error: 'Cliente, nombre del producto y descripción de la no conformidad son obligatorios.' }
    }
  } else {
    base.tipo_equipo = String(formData.get('tipo_equipo') ?? '').trim()
    base.tipo_falla = String(formData.get('tipo_falla') ?? '').trim()
    base.descripcion_falla = String(formData.get('descripcion_falla') ?? '').trim()
    base.ubicacion_equipo = String(formData.get('ubicacion_equipo') ?? '').trim()
    base.nombre_proveedor = String(formData.get('nombre_proveedor') ?? '').trim()

    if (!base.tipo_equipo || !base.descripcion_falla) {
      return { error: 'Tipo de equipo y descripción de la falla son obligatorios.' }
    }
  }

  // Foto (opcional para equipo, recomendada para producto)
  const foto = formData.get('foto') as File | null
  let fotoPath: string | null = null
  if (foto && foto.size > 0) {
    const nombreArchivo = `${Date.now()}-${foto.name}`.replace(/\s+/g, '_')
    const buffer = Buffer.from(await foto.arrayBuffer())
    const { data: subida, error: errorSubida } = await supabase.storage
      .from('pnc')
      .upload(nombreArchivo, buffer, { contentType: foto.type })
    if (!errorSubida && subida) {
      fotoPath = subida.path
    }
  }
  if (fotoPath) base.foto_path = fotoPath

  const { data: registro, error } = await supabase
    .from('pnc_registros')
    .insert(base)
    .select('id, folio')
    .single()

  if (error || !registro) {
    return { error: 'No se pudo guardar el registro. ' + (error?.message ?? '') }
  }

  const { data: coordinadores } = await supabase
    .from('usuarios')
    .select('id, correo')
    .eq('rol', 'coordinador_sgi')
    .eq('estatus', 'activo')

  if (coordinadores && coordinadores.length > 0) {
    const mensaje = `Nuevo PNC ${tipo === 'producto' ? 'de producto' : 'de equipo'} registrado: ${registro.folio}. Requiere definir disposición.`
    await supabase.from('notificaciones').insert(
      coordinadores.map((c) => ({ usuario_id: c.id, tipo: 'sistema' as const, mensaje, referencia_id: registro.id }))
    )
    await supabase.from('pendientes').insert(
      coordinadores.map((c) => ({
        usuario_id: c.id,
        modulo: 'pnc',
        referencia_id: registro.id,
        descripcion: mensaje,
      }))
    )
    await enviarCorreo(
      coordinadores.map((c) => c.correo),
      'Nuevo Producto/Equipo No Conforme — SGD Bonyard',
      `<p>${mensaje}</p>`
    )
  }

  revalidatePath('/pnc/registro')
  redirect(`/pnc/registro`)
}

export async function actualizarDisposicionPNC(id: string, formData: FormData) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()

  await supabase
    .from('pnc_registros')
    .update({
      disposicion: String(formData.get('disposicion') ?? '').trim() || null,
      responsable_disposicion: String(formData.get('responsable_disposicion') ?? '').trim() || null,
      estatus: String(formData.get('estatus') ?? 'abierto'),
      actualizado_por: quien.id,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', id)

  await supabase
    .from('pendientes')
    .update({ estatus: 'cerrado', actualizado_en: new Date().toISOString() })
    .eq('referencia_id', id)
    .eq('modulo', 'pnc')

  revalidatePath(`/pnc/${id}`)
  revalidatePath('/pnc/registro')
}

export async function editarPNC(id: string, campos: Record<string, unknown>) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('pnc_registros')
    .update({ ...campos, actualizado_por: quien.id, actualizado_en: new Date().toISOString() })
    .eq('id', id)

  revalidatePath(`/pnc/${id}`)
  revalidatePath('/pnc/registro')
}

export async function obtenerUrlFotoPNC(fotoPath: string) {
  await requerirUsuario()
  const supabase = await createClient()
  const { data } = await supabase.storage.from('pnc').createSignedUrl(fotoPath, 300)
  return data?.signedUrl ?? null
}
