'use server'

import { revalidatePath } from 'next/cache'
import { normaPermitida, MENSAJE_NAVE_1_SOLO_ISO } from '@/lib/normasPorNave'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { clasificarHallazgo, generarResumenInforme } from '@/lib/anthropic'
import { checklistPorNorma, CHECKLIST_INTERNA_AMBAS_NORMAS } from '@/lib/checklistsAuditoria'
import { CHECKLIST_NAVE1 } from '@/lib/checklistNave1'

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

  // Nave 1 solo se certifica en ISO 9001:2015: se valida contra lo que quedaría guardado
  if (campos.norma !== undefined || campos.nave !== undefined) {
    const { data: actual } = await supabase
      .from('auditorias')
      .select('norma, nave')
      .eq('id', auditoriaId)
      .single()
    const naveFinal = campos.nave !== undefined ? campos.nave : actual?.nave
    const normaFinal = campos.norma ?? actual?.norma ?? ''
    const cambiaNormaONave =
      (campos.norma !== undefined && campos.norma !== actual?.norma) ||
      (campos.nave !== undefined && campos.nave !== actual?.nave)
    if (cambiaNormaONave && !normaPermitida(naveFinal, normaFinal)) {
      throw new Error(MENSAJE_NAVE_1_SOLO_ISO)
    }
  }

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
    .select('tipo, norma, nave')
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

    const esAmbas = auditoria.norma === 'ambas'

    if ((!count || count === 0) && esAmbas && auditoria.nave === 'Nave 2') {
      // Ambas normas, Nave 2: mismas preguntas de siempre, agrupadas por proceso
      await supabase.from('auditoria_hallazgos').insert(
        CHECKLIST_INTERNA_AMBAS_NORMAS.map((item, i) => {
          const [prefijo, ...resto] = item.documento_referencia.split(' — ')
          return {
            auditoria_id: auditoriaId,
            clausula: item.clausula,
            requisito: item.requisito,
            documento_referencia: resto.length ? resto.join(' — ') : item.documento_referencia,
            evidencia_sugerida: item.evidencia_sugerida,
            conformidad: 'conforme' as const,
            orden: i,
            norma_clausula: item.norma ?? 'AMBAS',
            nivel_riesgo: item.nivel_riesgo ?? null,
            proceso: resto.length ? prefijo.trim() : 'General',
            tema: null,
            resultado: null,
          }
        })
      )
    } else if ((!count || count === 0) && (esAmbas || auditoria.nave === 'Nave 1')) {
      // FSG-57 oficial de Nave 1, agrupado por proceso (resultado vacío = pendiente).
      // Nave 1 ya no se certifica en SQF: solo se precargan los requisitos de ISO 9001.
      const itemsNave1 = auditoria.nave === 'Nave 1'
        ? CHECKLIST_NAVE1.filter((item) => item.norma === 'ISO')
        : CHECKLIST_NAVE1
      await supabase.from('auditoria_hallazgos').insert(
        itemsNave1.map((item, i) => ({
          auditoria_id: auditoriaId,
          clausula: item.clausula,
          requisito: item.pregunta,
          documento_referencia: item.documentos,
          evidencia_sugerida: item.evidencia,
          conformidad: 'conforme' as const,
          orden: i,
          norma_clausula: item.norma,
          proceso: item.proceso,
          tema: item.tema,
          resultado: null,
        }))
      )
    } else if (!count || count === 0) {
      const items = checklistPorNorma(auditoria.norma, auditoria.tipo)
      const normaAuditoria = auditoria.norma === 'iso_9001' ? 'ISO' : auditoria.norma === 'sqf' ? 'SQF' : null
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
            norma_clausula: item.norma ?? normaAuditoria,
            nivel_riesgo: item.nivel_riesgo ?? null,
          }))
        )
      }
    }
  }

  revalidatePath(`/auditorias/${auditoriaId}`)
}

const RESULTADO_FSG57: Record<string, { conformidad: string; tipo_nc: string | null }> = {
  C: { conformidad: 'conforme', tipo_nc: null },
  O: { conformidad: 'conforme', tipo_nc: 'observacion' },
  NCm: { conformidad: 'no_conforme', tipo_nc: 'menor' },
  NCM: { conformidad: 'no_conforme', tipo_nc: 'mayor' },
  NCC: { conformidad: 'no_conforme', tipo_nc: 'critica' },
}

export async function guardarFsg57(
  hallazgoIds: string[],
  auditoriaId: string,
  campos: { resultado?: string; evidencia?: string; comentario?: string }
) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  if (!(await puedeEditar(supabase, auditoriaId, quien.id, quien.rol))) {
    throw new Error('No autorizado.')
  }

  const update: Record<string, unknown> = {}
  if (campos.resultado !== undefined) {
    const mapa = RESULTADO_FSG57[campos.resultado]
    if (!mapa) throw new Error('Resultado no válido.')
    update.resultado = campos.resultado
    update.conformidad = mapa.conformidad
    update.tipo_nc = mapa.tipo_nc
  }
  if (campos.evidencia !== undefined) update.evidencia = campos.evidencia
  if (campos.comentario !== undefined) update.comentario = campos.comentario

  await supabase
    .from('auditoria_hallazgos')
    .update(update)
    .eq('auditoria_id', auditoriaId)
    .in('id', hallazgoIds)
}

export async function sugerirClasificacion(requisito: string, evidencia: string, norma?: 'ISO' | 'SQF' | 'AMBAS' | null) {
  await requerirUsuario()
  if (!requisito.trim() || !evidencia.trim()) {
    throw new Error('Escribe el requisito y la evidencia primero.')
  }
  const resultado = await clasificarHallazgo(requisito, evidencia, norma)
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
  const normaClausula = String(formData.get('norma_clausula') ?? '') || null

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
    norma_clausula: normaClausula,
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

// ---------- Plan de auditoría (FSG-56) ----------

export async function actualizarPlanAuditoria(auditoriaId: string, formData: FormData) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  const supabase = await createClient()

  const alcance = String(formData.get('alcance') ?? '').trim()
  const objetivo = String(formData.get('objetivo') ?? '').trim()

  await supabase
    .from('auditorias')
    .update({ alcance: alcance || null, objetivo: objetivo || null, actualizado_en: new Date().toISOString() })
    .eq('id', auditoriaId)

  revalidatePath(`/auditorias/${auditoriaId}`)
}

export async function crearAgendaItem(formData: FormData) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  const supabase = await createClient()

  const auditoriaId = String(formData.get('auditoria_id') ?? '')
  if (!auditoriaId) throw new Error('Falta la auditoría.')

  const { count } = await supabase
    .from('auditoria_agenda')
    .select('id', { count: 'exact', head: true })
    .eq('auditoria_id', auditoriaId)

  await supabase.from('auditoria_agenda').insert({
    auditoria_id: auditoriaId,
    orden: (count ?? 0) + 1,
    fecha: String(formData.get('fecha') ?? '').trim() || null,
    horario: String(formData.get('horario') ?? '').trim() || null,
    area_proceso: String(formData.get('area_proceso') ?? '').trim() || null,
    responsable_auditado: String(formData.get('responsable_auditado') ?? '').trim() || null,
    requisitos_auditar: String(formData.get('requisitos_auditar') ?? '').trim() || null,
    lugar: String(formData.get('lugar') ?? '').trim() || null,
    auditor: String(formData.get('auditor') ?? '').trim() || null,
  })
  revalidatePath(`/auditorias/${auditoriaId}`)
}

export async function eliminarAgendaItem(id: string, auditoriaId: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')
  const supabase = await createClient()
  await supabase.from('auditoria_agenda').delete().eq('id', id)
  revalidatePath(`/auditorias/${auditoriaId}`)
}

// ---------- Evaluación de auditores (FSG-60) ----------

export async function crearEvaluacionAuditor(formData: FormData) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const auditoriaId = String(formData.get('auditoria_id') ?? '')
  const auditorEvaluadoId = String(formData.get('auditor_evaluado_id') ?? '') || null
  const auditorEvaluadoNombre = String(formData.get('auditor_evaluado_nombre') ?? '').trim()
  const normaReferencia = String(formData.get('norma_referencia') ?? '').trim()

  if (!auditoriaId || !auditorEvaluadoNombre) throw new Error('Faltan datos.')

  const campos = [
    'eval_notificacion_plan', 'eval_claridad_notificacion', 'eval_coherencia_metodologia',
    'eval_enfoque_orientacion', 'eval_horario', 'eval_cumplimiento_objetivo', 'eval_calificacion_general',
    'eval_puntualidad', 'eval_claridad_preguntas', 'eval_orden_coherencia', 'eval_conocimiento_proceso',
    'eval_capacidad_analisis', 'eval_eficiencia_tiempo', 'eval_claridad_hallazgos', 'eval_ecuanimidad_respeto',
  ]
  const valores: Record<string, number | null> = {}
  for (const campo of campos) {
    const v = String(formData.get(campo) ?? '')
    valores[campo] = v ? Number(v) : null
  }

  await supabase.from('evaluaciones_auditor').insert({
    auditoria_id: auditoriaId,
    auditor_evaluado_id: auditorEvaluadoId,
    auditor_evaluado_nombre: auditorEvaluadoNombre,
    evaluador_id: quien.id,
    norma_referencia: normaReferencia || null,
    ...valores,
    observaciones: String(formData.get('observaciones') ?? '').trim() || null,
    acciones_derivadas: String(formData.get('acciones_derivadas') ?? '').trim() || null,
  })
  revalidatePath(`/auditorias/${auditoriaId}`)
}
