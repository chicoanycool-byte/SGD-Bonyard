'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { clasificarHallazgo, generarResumenInforme } from '@/lib/anthropic'
import { checklistPorNorma } from '@/lib/checklistsAuditoria'

async function puedeEditar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  auditoriaId: string,
  usuarioId: string,
  rol: string
) {
  void supabase
  void auditoriaId
  void usuarioId
  return rol === 'coordinador_sgi'
}

export async function editarAuditoria(
  auditoriaId: string,
  campos: {
    fecha?: string
    norma?: string
    tipo?: string
    proceso?: string | null
    cliente_nombre?: string | null
    nave?: string | null
    auditor_lider_id?: string | null
    auditor_auxiliar_id?: string | null
    observaciones?: string | null
  }
) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('auditorias')
    .update({ ...campos, actualizado_en: new Date().toISOString() })
    .eq('id', auditoriaId)

  revalidatePath(`/auditorias/${auditoriaId}`)
  revalidatePath('/auditorias')
}

export async function iniciarAuditoria(auditoriaId: string) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  if (!(await puedeEditar(supabase, auditoriaId, quien.id, quien.rol))) {
    throw new Error('No autorizado.')
  }

  const { data: auditoria } = await supabase
    .from('auditorias')
    .select('tipo, norma')
    .eq('id', auditoriaId)
    .single()

  await supabase
    .from('auditorias')
    .update({ estatus: 'en_proceso', actualizado_en: new Date().toISOString() })
    .eq('id', auditoriaId)

  // Para auditorías internas, precarga el cuestionario oficial según la norma
  if (auditoria?.tipo === 'interna') {
    const { count } = await supabase
      .from('auditoria_hallazgos')
      .select('id', { count: 'exact', head: true })
      .eq('auditoria_id', auditoriaId)

    if (!count || count === 0) {
      const items = checklistPorNorma(auditoria.norma)
      if (items.length > 0) {
        await supabase.from('auditoria_hallazgos').insert(
          items.map((item, i) => ({
            auditoria_id: auditoriaId,
            clausula: item.clausula,
            requisito: item.requisito,
            documento_referencia: item.documento_referencia,
            evidencia_sugerida: item.evidencia_sugerida,
            conformidad: 'conforme' as const,
            orden: i,
          }))
        )
      }
    }
  }

  revalidatePath(`/auditorias/${auditoriaId}`)
}

export async function sugerirClasificacion(requisito: string, evidencia: string) {
  await requerirUsuario()
  if (!requisito.trim() || !evidencia.trim()) {
    throw new Error('Escribe el requisito y la evidencia primero.')
  }
  const resultado = await clasificarHallazgo(requisito, evidencia)
  if (!resultado) {
    throw new Error('La IA no está disponible en este momento (revisa la API key).')
  }
  return resultado
}

export async function actualizarHallazgo(
  hallazgoId: string,
  auditoriaId: string,
  campos: {
    conformidad?: string
    tipo_nc?: string | null
    comentario?: string
    evidencia?: string
  }
) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  if (!(await puedeEditar(supabase, auditoriaId, quien.id, quien.rol))) {
    throw new Error('No autorizado.')
  }

  const update: Record<string, unknown> = {}
  if (campos.conformidad !== undefined) update.conformidad = campos.conformidad
  if (campos.tipo_nc !== undefined) update.tipo_nc = campos.tipo_nc
  if (campos.comentario !== undefined) update.comentario = campos.comentario
  if (campos.evidencia !== undefined) update.evidencia = campos.evidencia

  await supabase.from('auditoria_hallazgos').update(update).eq('id', hallazgoId)
  revalidatePath(`/auditorias/${auditoriaId}`)
}

export async function agregarHallazgo(auditoriaId: string, formData: FormData) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  if (!(await puedeEditar(supabase, auditoriaId, quien.id, quien.rol))) {
    throw new Error('No autorizado.')
  }

  const requisito = String(formData.get('requisito') ?? '').trim()
  const evidencia = String(formData.get('evidencia') ?? '').trim()
  const conformidad = String(formData.get('conformidad') ?? 'conforme')
  const tipoNc = String(formData.get('tipo_nc') ?? '') || null
  const comentario = String(formData.get('comentario') ?? '').trim()
  const clasificacionIa = String(formData.get('clasificacion_ia') ?? '') || null

  if (!requisito) return

  const { count } = await supabase
    .from('auditoria_hallazgos')
    .select('id', { count: 'exact', head: true })
    .eq('auditoria_id', auditoriaId)

  await supabase.from('auditoria_hallazgos').insert({
    auditoria_id: auditoriaId,
    requisito,
    evidencia: evidencia || null,
    conformidad,
    tipo_nc: conformidad === 'no_conforme' ? tipoNc : null,
    comentario: comentario || null,
    clasificacion_ia: clasificacionIa,
    orden: count ?? 0,
  })

  revalidatePath(`/auditorias/${auditoriaId}`)
}

export async function eliminarHallazgo(hallazgoId: string, auditoriaId: string) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  if (!(await puedeEditar(supabase, auditoriaId, quien.id, quien.rol))) {
    throw new Error('No autorizado.')
  }

  await supabase.from('auditoria_hallazgos').delete().eq('id', hallazgoId)
  revalidatePath(`/auditorias/${auditoriaId}`)
}

export async function cerrarAuditoria(auditoriaId: string) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  if (!(await puedeEditar(supabase, auditoriaId, quien.id, quien.rol))) {
    throw new Error('No autorizado.')
  }

  const { data: auditoria } = await supabase
    .from('auditorias')
    .select(
      'fecha, norma, tipo, proceso, observaciones, auditor_lider:usuarios!auditorias_auditor_lider_id_fkey(nombre, correo), auditado:usuarios!auditorias_auditado_id_fkey(nombre)'
    )
    .eq('id', auditoriaId)
    .single()

  if (!auditoria) throw new Error('Auditoría no encontrada.')

  await supabase
    .from('pendientes')
    .update({ estatus: 'cerrado', actualizado_en: new Date().toISOString() })
    .eq('referencia_id', auditoriaId)
    .eq('modulo', 'auditorias')

  const { data: hallazgos } = await supabase
    .from('auditoria_hallazgos')
    .select('requisito, evidencia, conformidad, tipo_nc, comentario')
    .eq('auditoria_id', auditoriaId)
    .order('orden')

  const auditorLider = auditoria.auditor_lider as unknown as
    | { nombre: string; correo: string }
    | null
  const auditado = auditoria.auditado as unknown as { nombre: string } | null

  const { resumen, conclusiones } = await generarResumenInforme(
    {
      fecha: auditoria.fecha,
      norma: auditoria.norma,
      tipo: auditoria.tipo,
      proceso: auditoria.proceso,
      auditorLider: auditorLider?.nombre ?? null,
      auditado: auditado?.nombre ?? null,
      observaciones: auditoria.observaciones,
    },
    hallazgos ?? []
  )

  await supabase
    .from('auditorias')
    .update({
      estatus: 'cerrada',
      informe_resumen: resumen,
      informe_conclusiones: conclusiones,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', auditoriaId)

  // Genera automáticamente una Acción Correctiva por cada no conformidad
  const { data: hallazgosCompletos } = await supabase
    .from('auditoria_hallazgos')
    .select('id, requisito, evidencia, tipo_nc, conformidad')
    .eq('auditoria_id', auditoriaId)
    .eq('conformidad', 'no_conforme')

  if (hallazgosCompletos && hallazgosCompletos.length > 0) {
    await supabase.from('acciones_correctivas').insert(
      hallazgosCompletos.map((h) => ({
        origen: 'auditoria' as const,
        origen_id: auditoriaId,
        hallazgo_id: h.id,
        descripcion: `${h.requisito}${h.evidencia ? ' — ' + h.evidencia : ''}`,
        tipo_nc: h.tipo_nc,
        estatus: 'abierta' as const,
        creado_por: quien.id,
      }))
    )

    const { data: coordinadores } = await supabase
      .from('usuarios')
      .select('id')
      .eq('rol', 'coordinador_sgi')
      .eq('estatus', 'activo')

    if (coordinadores && coordinadores.length > 0) {
      const mensajeAc = `La auditoría del ${auditoria.fecha} generó ${hallazgosCompletos.length} acción(es) correctiva(s) pendientes de plan de reacción.`
      await supabase.from('notificaciones').insert(
        coordinadores.map((c) => ({
          usuario_id: c.id,
          tipo: 'ac_ap' as const,
          mensaje: mensajeAc,
        }))
      )
      await supabase.from('pendientes').insert(
        coordinadores.map((c) => ({
          usuario_id: c.id,
          modulo: 'ac_ap',
          descripcion: mensajeAc,
        }))
      )
    }
  }

  // Notifica a todos (acceso general al informe, según spec)
  const { data: todos } = await supabase
    .from('usuarios')
    .select('id')
    .eq('estatus', 'activo')

  if (todos && todos.length > 0) {
    await supabase.from('notificaciones').insert(
      todos.map((u) => ({
        usuario_id: u.id,
        tipo: 'auditoria' as const,
        mensaje: `Se cerró la auditoría ${auditoria.norma.toUpperCase()} del ${auditoria.fecha}. Informe disponible.`,
        referencia_id: auditoriaId,
      }))
    )
  }

  revalidatePath(`/auditorias/${auditoriaId}`)
  revalidatePath('/auditorias')
}
