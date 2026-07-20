'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { comentarIndicador } from '@/lib/anthropic'

function cumpleMeta(operador: string, metaValor: number, valor: number) {
  if (operador === 'gte') return valor >= metaValor
  if (operador === 'lte') return valor <= metaValor
  if (operador === 'lt') return valor < metaValor
  if (operador === 'eq') return valor === metaValor
  return true
}

export async function capturarValorIndicador(
  indicadorId: string,
  anio: number,
  mes: number,
  valor: number,
  comentario: string
) {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: indicadorPermiso } = await supabase
    .from('indicadores_catalogo')
    .select('responsable_id')
    .eq('id', indicadorId)
    .single()

  if (quien.rol !== 'coordinador_sgi' && indicadorPermiso?.responsable_id !== quien.id) {
    throw new Error('Solo puedes capturar el valor de los indicadores que tienes asignados.')
  }

  const { data: indicador } = await supabase
    .from('indicadores_catalogo')
    .select('nombre, meta_texto, meta_operador, meta_valor')
    .eq('id', indicadorId)
    .single()

  if (!indicador) throw new Error('Indicador no encontrado.')

  const cumple = cumpleMeta(indicador.meta_operador, indicador.meta_valor, valor)
  const comentarioIa = !cumple
    ? await comentarIndicador(indicador.nombre, indicador.meta_texto, valor, cumple)
    : null

  const { error } = await supabase.from('indicadores_valores').upsert(
    {
      indicador_id: indicadorId,
      anio,
      mes,
      valor,
      comentario: comentario || null,
      requiere_ac: !cumple,
      comentario_ia: comentarioIa,
      capturado_por: quien.id,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'indicador_id,anio,mes' }
  )

  if (error) throw new Error('No se pudo guardar el valor: ' + error.message)

  if (!cumple) {
    const { data: coordinadores } = await supabase
      .from('usuarios')
      .select('id')
      .eq('rol', 'coordinador_sgi')
      .eq('estatus', 'activo')

    if (coordinadores && coordinadores.length > 0) {
      await supabase.from('notificaciones').insert(
        coordinadores.map((c) => ({
          usuario_id: c.id,
          tipo: 'indicador' as const,
          mensaje: `El indicador "${indicador.nombre}" no cumplió su meta (${indicador.meta_texto}) este período.`,
        }))
      )
    }
  }

  revalidatePath('/indicadores')
}

export async function asignarResponsableIndicador(indicadorId: string, usuarioId: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }
  const supabase = await createClient()
  await supabase
    .from('indicadores_catalogo')
    .update({ responsable_id: usuarioId || null })
    .eq('id', indicadorId)
  revalidatePath('/indicadores')
}

export async function enviarRecordatoriosMes(anio: number, mes: number) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }
  const supabase = await createClient()

  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const nombreMes = MESES[mes - 1]

  const { data: catalogo } = await supabase
    .from('indicadores_catalogo')
    .select('id, nombre, responsable_id, meses_activos')

  const { data: yaCapturados } = await supabase
    .from('indicadores_valores')
    .select('indicador_id')
    .eq('anio', anio)
    .eq('mes', mes)

  const capturadosSet = new Set((yaCapturados ?? []).map((v) => v.indicador_id))

  const pendientesIndicadores = (catalogo ?? []).filter(
    (i) =>
      (i.meses_activos as string[]).includes(nombreMes) &&
      i.responsable_id &&
      !capturadosSet.has(i.id)
  )

  let enviados = 0
  for (const ind of pendientesIndicadores) {
    const mensaje = `Falta capturar el indicador "${ind.nombre}" de ${nombreMes} ${anio}.`

    await supabase.from('notificaciones').insert({
      usuario_id: ind.responsable_id,
      tipo: 'indicador',
      mensaje,
    })
    await supabase.from('pendientes').insert({
      usuario_id: ind.responsable_id,
      modulo: 'indicadores',
      descripcion: mensaje,
    })
    enviados++
  }

  revalidatePath('/indicadores')
  revalidatePath('/pendientes')
  return enviados
}

export async function generarAccionDesdeIndicador(valorId: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    throw new Error('No autorizado.')
  }
  const supabase = await createClient()

  const { data: valor } = await supabase
    .from('indicadores_valores')
    .select(
      'id, valor, comentario, indicador:indicadores_catalogo(nombre, meta_texto, responsable_id)'
    )
    .eq('id', valorId)
    .single()

  if (!valor) throw new Error('No encontrado.')

  const indicador = valor.indicador as unknown as {
    nombre: string
    meta_texto: string
    responsable_id: string | null
  } | null

  const fechaCompromiso = new Date()
  fechaCompromiso.setDate(fechaCompromiso.getDate() + 15)

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .insert({
      origen: 'indicador',
      descripcion: `Indicador "${indicador?.nombre}" no cumplió meta (${indicador?.meta_texto}). Valor: ${valor.valor}.${valor.comentario ? ' ' + valor.comentario : ''}`,
      estatus: indicador?.responsable_id ? 'en_proceso' : 'abierta',
      responsable_id: indicador?.responsable_id ?? null,
      fecha_compromiso: indicador?.responsable_id
        ? fechaCompromiso.toISOString().slice(0, 10)
        : null,
      accion_propuesta: indicador?.responsable_id
        ? 'Analizar causa raíz y definir plan de acción para regularizar el indicador.'
        : null,
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (accion) {
    await supabase
      .from('indicadores_valores')
      .update({ accion_correctiva_id: accion.id })
      .eq('id', valorId)

    if (indicador?.responsable_id) {
      const mensaje = `Se te asignó una acción correctiva por el indicador "${indicador.nombre}".`
      await supabase.from('notificaciones').insert({
        usuario_id: indicador.responsable_id,
        tipo: 'ac_ap',
        mensaje,
        referencia_id: accion.id,
      })
      await supabase.from('pendientes').insert({
        usuario_id: indicador.responsable_id,
        modulo: 'ac_ap',
        referencia_id: accion.id,
        descripcion: mensaje,
        fecha_limite: fechaCompromiso.toISOString().slice(0, 10),
      })
    }
  }

  revalidatePath('/indicadores')
  revalidatePath('/ac-ap')
}
