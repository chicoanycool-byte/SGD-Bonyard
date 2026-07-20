'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'
import { analizarMatrizLegal, type SugerenciaLegal } from '@/lib/anthropic'

const ROLES_GESTION = ['coordinador_sgi']

export async function actualizarFilaMatriz(
  numero: number,
  campos: { evidencia?: string | null; elementos_documentos?: string; hallazgos_comentarios?: string }
) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('matriz_legal')
    .update({ ...campos, actualizado_por: quien.id, actualizado_en: new Date().toISOString() })
    .eq('numero', numero)

  revalidatePath('/matriz-legal')
  revalidatePath('/matriz-legal/indicadores')
}

export async function analizarConIA(): Promise<SugerenciaLegal[]> {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase.from('matriz_legal').select('norma').order('numero')
  const normas = [...new Set((data ?? []).map((d) => d.norma).filter(Boolean))] as string[]

  return await analizarMatrizLegal(normas)
}

export async function agregarSugerenciaAMatriz(sugerencia: SugerenciaLegal) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()
  const { data: maxRow } = await supabase
    .from('matriz_legal')
    .select('numero')
    .order('numero', { ascending: false })
    .limit(1)
    .single()

  const siguienteNumero = (maxRow?.numero ?? 0) + 1

  await supabase.from('matriz_legal').insert({
    numero: siguienteNumero,
    articulo: sugerencia.articulo,
    tema: sugerencia.titulo,
    explicacion: sugerencia.descripcion,
    norma: sugerencia.titulo,
    requisito_legal: sugerencia.requisito_legal,
    aplicacion:
      sugerencia.tipo === 'actualizacion'
        ? `Posible actualización de: ${sugerencia.norma_relacionada || 'norma existente'} (revisar)`
        : 'Norma sugerida por IA, pendiente de validar aplicabilidad',
    actualizado_por: quien.id,
  })

  revalidatePath('/matriz-legal')
}

export async function actualizarPlanAccion(
  id: string,
  campos: {
    responsable?: string
    responsable_id?: string | null
    fecha_compromiso?: string | null
    fecha_cierre_real?: string | null
    estatus?: string
  }
) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase
    .from('matriz_legal_plan_accion')
    .update({ ...campos, actualizado_por: quien.id, actualizado_en: new Date().toISOString() })
    .eq('id', id)

  if (campos.responsable_id) {
    const { data: item } = await supabase
      .from('matriz_legal_plan_accion')
      .select('norma_ley, descripcion_hallazgo, fecha_compromiso')
      .eq('id', id)
      .single()

    const mensaje = `Se te asignó un hallazgo del plan de acción legal (${item?.norma_ley ?? ''}): ${item?.descripcion_hallazgo ?? ''}`

    await supabase.from('notificaciones').insert({
      usuario_id: campos.responsable_id,
      tipo: 'sistema',
      mensaje,
    })
    await supabase.from('pendientes').insert({
      usuario_id: campos.responsable_id,
      modulo: 'matriz-legal',
      descripcion: mensaje,
      fecha_limite: item?.fecha_compromiso ?? null,
    })

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('correo')
      .eq('id', campos.responsable_id)
      .single()
    if (usuario?.correo) {
      await enviarCorreo(
        [usuario.correo],
        'Nuevo hallazgo legal asignado — SGD Bonyard',
        `<p>${mensaje}</p>`
      )
    }
  }

  revalidatePath('/matriz-legal/plan-accion')
  revalidatePath('/matriz-legal/indicadores')
}

export async function agregarPlanAccion(formData: FormData) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()
  const { data: maxRow } = await supabase
    .from('matriz_legal_plan_accion')
    .select('numero')
    .order('numero', { ascending: false })
    .limit(1)
    .single()

  await supabase.from('matriz_legal_plan_accion').insert({
    numero: (maxRow?.numero ?? 0) + 1,
    norma_ley: String(formData.get('norma_ley') ?? ''),
    articulo: String(formData.get('articulo') ?? ''),
    descripcion_hallazgo: String(formData.get('descripcion_hallazgo') ?? ''),
    nivel_riesgo: String(formData.get('nivel_riesgo') ?? 'MENOR'),
    accion_propuesta: String(formData.get('accion_propuesta') ?? ''),
    responsable_id: String(formData.get('responsable_id') ?? '') || null,
    fecha_compromiso: String(formData.get('fecha_compromiso') ?? '') || null,
    actualizado_por: quien.id,
  })

  revalidatePath('/matriz-legal/plan-accion')
}
