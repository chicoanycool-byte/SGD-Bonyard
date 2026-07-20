'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'

export type EstadoSolicitud = {
  error?: string
  ok?: boolean
}

async function notificarCoordinadores(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mensaje: string,
  referenciaId: string
) {
  const { data: coordinadores } = await supabase
    .from('usuarios')
    .select('id, correo')
    .eq('rol', 'coordinador_sgi')
    .eq('estatus', 'activo')

  if (!coordinadores || coordinadores.length === 0) return

  await supabase.from('notificaciones').insert(
    coordinadores.map((c) => ({
      usuario_id: c.id,
      tipo: 'solicitud_documento' as const,
      mensaje,
      referencia_id: referenciaId,
    }))
  )
  await supabase.from('pendientes').insert(
    coordinadores.map((c) => ({
      usuario_id: c.id,
      modulo: 'solicitudes',
      referencia_id: referenciaId,
      descripcion: mensaje,
    }))
  )

  await enviarCorreo(
    coordinadores.map((c) => c.correo),
    'Nueva solicitud de documento — SGD Bonyard',
    `<p>${mensaje}</p><p>Revísala en el módulo Solicitudes del SGD Bonyard.</p>`
  )
}

export async function crearSolicitud(
  _prevState: EstadoSolicitud,
  formData: FormData
): Promise<EstadoSolicitud> {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const tipo = String(formData.get('tipo') ?? '')
  const justificacion = String(formData.get('justificacion') ?? '').trim()
  const archivo = formData.get('archivo') as File | null
  const hayArchivo = archivo && archivo.size > 0

  if (!justificacion) {
    return { error: 'La justificación es obligatoria.' }
  }
  if (tipo === 'alta' && !hayArchivo) {
    return { error: 'Adjunta un archivo.' }
  }
  if (hayArchivo && archivo!.size > 20 * 1024 * 1024) {
    return { error: 'El archivo no puede pesar más de 20 MB.' }
  }

  let insertData: Record<string, unknown>
  let mensajeNotificacion: string

  if (tipo === 'modificacion') {
    const codigo = String(formData.get('codigo') ?? '').trim().toUpperCase()
    const descripcionCambio = String(formData.get('descripcion_cambio') ?? '').trim()

    if (!codigo) return { error: 'Indica el código del documento.' }

    const { data: documento } = await supabase
      .from('documentos')
      .select('id, nombre, version')
      .eq('codigo', codigo)
      .maybeSingle()

    if (!documento) {
      return { error: `No existe ningún documento con código ${codigo}.` }
    }

    insertData = {
      tipo: 'modificacion',
      documento_id: documento.id,
      codigo,
      nombre: documento.nombre,
      version_actual: documento.version,
      justificacion,
      descripcion_cambio: descripcionCambio || null,
    }
    mensajeNotificacion = `${quien.nombre} solicitó modificar el documento ${codigo}.`
  } else if (tipo === 'alta') {
    const nombre = String(formData.get('nombre') ?? '').trim()
    if (!nombre) return { error: 'Indica el nombre del nuevo documento.' }

    insertData = {
      tipo: 'alta',
      nombre,
      justificacion,
    }
    mensajeNotificacion = `${quien.nombre} solicitó dar de alta el documento "${nombre}".`
  } else {
    return { error: 'Tipo de solicitud inválido.' }
  }

  let rutaStorage: string | null = null
  let tipoArchivo: string | null = null

  if (hayArchivo) {
    const extension = archivo!.name.split('.').pop() ?? 'bin'
    rutaStorage = `${quien.id}/${Date.now()}.${extension}`

    const { error: errorSubida } = await supabase.storage
      .from('solicitudes')
      .upload(rutaStorage, archivo!, {
        contentType: archivo!.type || 'application/octet-stream',
      })

    if (errorSubida) {
      return { error: 'No se pudo subir el archivo. ' + errorSubida.message }
    }
    tipoArchivo = archivo!.type || extension
  }

  const { data: solicitud, error: errorInsert } = await supabase
    .from('solicitudes_documento')
    .insert({
      ...insertData,
      storage_path: rutaStorage,
      tipo_archivo: tipoArchivo,
      solicitado_por: quien.id,
    })
    .select('id')
    .single()

  if (errorInsert || !solicitud) {
    return { error: 'No se pudo registrar la solicitud. ' + (errorInsert?.message ?? '') }
  }

  await notificarCoordinadores(supabase, mensajeNotificacion, solicitud.id)

  revalidatePath('/solicitudes')
  return { ok: true }
}

export async function obtenerUrlAdjuntoSolicitud(storagePath: string) {
  await requerirUsuario()
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('solicitudes')
    .createSignedUrl(storagePath, 60 * 5)

  if (error || !data) {
    throw new Error('No se pudo generar el enlace del archivo.')
  }
  return data.signedUrl
}

export async function resolverSolicitud(
  solicitudId: string,
  aprobar: boolean,
  comentario: string
) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }

  const supabase = await createClient()

  const { data: solicitud } = await supabase
    .from('solicitudes_documento')
    .select('*')
    .eq('id', solicitudId)
    .single()

  if (!solicitud || solicitud.estatus !== 'pendiente') {
    throw new Error('La solicitud ya fue procesada.')
  }

  if (aprobar && solicitud.storage_path) {
    // Mueve el archivo del bucket de solicitudes al de documentos
    const { data: archivoDescargado, error: errorDescarga } = await supabase.storage
      .from('solicitudes')
      .download(solicitud.storage_path)

    if (errorDescarga || !archivoDescargado) {
      throw new Error('No se pudo leer el archivo adjunto.')
    }

    const codigoFinal =
      solicitud.tipo === 'modificacion'
        ? solicitud.codigo
        : `NUEVO-${Date.now().toString().slice(-6)}`

    const extension = solicitud.storage_path.split('.').pop() ?? 'bin'
    const rutaDocumentos = `${codigoFinal}/${Date.now()}.${extension}`

    const { error: errorSubida } = await supabase.storage
      .from('documentos')
      .upload(rutaDocumentos, archivoDescargado, {
        contentType: solicitud.tipo_archivo ?? undefined,
      })

    if (errorSubida) {
      throw new Error('No se pudo mover el archivo a documentos.')
    }

    if (solicitud.tipo === 'modificacion' && solicitud.documento_id) {
      const { data: docActual } = await supabase
        .from('documentos')
        .select('storage_path, version')
        .eq('id', solicitud.documento_id)
        .single()

      const nuevaVersion = docActual?.version
        ? String(Number(docActual.version) + 1 || docActual.version + '-rev')
        : '2'

      await supabase
        .from('documentos')
        .update({
          storage_path: rutaDocumentos,
          tipo_archivo: solicitud.tipo_archivo,
          version: nuevaVersion,
          subido_por: quien.id,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', solicitud.documento_id)

      if (docActual?.storage_path) {
        await supabase.storage.from('documentos').remove([docActual.storage_path])
      }
    } else {
      await supabase.from('documentos').insert({
        codigo: codigoFinal,
        nombre: solicitud.nombre,
        version: '1',
        storage_path: rutaDocumentos,
        tipo_archivo: solicitud.tipo_archivo,
        subido_por: quien.id,
      })
    }

    await supabase.storage.from('solicitudes').remove([solicitud.storage_path])
  }

  await supabase
    .from('solicitudes_documento')
    .update({
      estatus: aprobar ? 'aprobada' : 'rechazada',
      comentario_revision: comentario || null,
      revisado_por: quien.id,
      revisado_en: new Date().toISOString(),
    })
    .eq('id', solicitudId)

  await supabase.from('notificaciones').insert({
    usuario_id: solicitud.solicitado_por,
    tipo: 'solicitud_documento',
    mensaje: aprobar
      ? `Tu solicitud para "${solicitud.nombre}" fue aprobada.`
      : `Tu solicitud para "${solicitud.nombre}" fue rechazada${comentario ? ': ' + comentario : '.'}`,
    referencia_id: solicitudId,
  })

  const { data: solicitante } = await supabase
    .from('usuarios')
    .select('correo')
    .eq('id', solicitud.solicitado_por)
    .single()

  if (solicitante?.correo) {
    await enviarCorreo(
      [solicitante.correo],
      aprobar
        ? 'Tu solicitud fue aprobada — SGD Bonyard'
        : 'Tu solicitud fue rechazada — SGD Bonyard',
      aprobar
        ? `<p>Tu solicitud para <strong>${solicitud.nombre}</strong> fue aprobada y ya está disponible en Documentos.</p>`
        : `<p>Tu solicitud para <strong>${solicitud.nombre}</strong> fue rechazada.</p>${comentario ? `<p>Motivo: ${comentario}</p>` : ''}`
    )
  }

  await supabase
    .from('pendientes')
    .update({ estatus: 'cerrado', actualizado_en: new Date().toISOString() })
    .eq('referencia_id', solicitudId)
    .eq('modulo', 'solicitudes')

  revalidatePath('/solicitudes')
}
