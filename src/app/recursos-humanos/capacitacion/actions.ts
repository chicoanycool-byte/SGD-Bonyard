'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { sumarMeses } from '@/lib/capacitacion'

export type EstadoCapAccion = { error?: string; ok?: boolean; mensaje?: string }
const texto = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()

async function soloCoordinador() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') return null
  return quien
}

export async function registrarCapacitacion(_p: EstadoCapAccion, fd: FormData): Promise<EstadoCapAccion> {
  const quien = await soloCoordinador()
  if (!quien) return { error: 'Solo el Coordinador del SGI registra capacitaciones.' }
  const supabase = await createClient()

  const usuarioIds = fd.getAll('usuario_id').map(String).filter(Boolean)
  const cursoId = texto(fd, 'curso_id')
  const fecha = texto(fd, 'fecha')
  if (usuarioIds.length === 0 || !cursoId || !fecha) return { error: 'Elige al menos una persona, el curso y la fecha.' }

  const { data: curso } = await supabase.from('capacitacion_cursos').select('vigencia_meses').eq('id', cursoId).single()
  const manual = texto(fd, 'vigente_hasta')
  const vigente = manual || (curso?.vigencia_meses ? sumarMeses(fecha, curso.vigencia_meses as number) : null)
  const cal = texto(fd, 'calificacion')

  const { error } = await supabase.from('capacitacion_registros').insert(
    usuarioIds.map((usuario_id) => ({
      usuario_id,
      curso_id: cursoId,
      fecha,
      vigente_hasta: vigente,
      instructor: texto(fd, 'instructor') || null,
      calificacion: cal ? Number(cal) : null,
      evidencia: texto(fd, 'evidencia') || null,
      observaciones: texto(fd, 'observaciones') || null,
      registrado_por: quien.id,
    }))
  )
  if (error) return { error: 'No se pudo guardar. ' + error.message }
  revalidatePath('/recursos-humanos/capacitacion')
  const quienes = usuarioIds.length === 1 ? '1 persona' : `${usuarioIds.length} personas`
  return {
    ok: true,
    mensaje: vigente
      ? `Listo, quedó registrada para ${quienes}. Vence el ${new Date(vigente + 'T12:00:00').toLocaleDateString('es-MX')} y te avisaremos 30 días antes.`
      : `Listo, quedó registrada para ${quienes}. Este curso no tiene vencimiento.`,
  }
}

export async function eliminarRegistroCapacitacion(id: string) {
  if (!(await soloCoordinador())) throw new Error('No autorizado.')
  const supabase = await createClient()
  await supabase.from('capacitacion_registros').delete().eq('id', id)
  revalidatePath('/recursos-humanos/capacitacion')
}

export async function crearCurso(_p: EstadoCapAccion, fd: FormData): Promise<EstadoCapAccion> {
  if (!(await soloCoordinador())) return { error: 'No autorizado.' }
  const supabase = await createClient()
  const codigo = texto(fd, 'codigo').toUpperCase()
  const nombre = texto(fd, 'nombre')
  const norma = texto(fd, 'norma')
  const vig = texto(fd, 'vigencia_meses')
  if (!codigo || !nombre || !['ISO', 'SQF', 'AMBAS'].includes(norma)) return { error: 'Código, nombre y norma son obligatorios.' }
  const { error } = await supabase.from('capacitacion_cursos').insert({
    codigo, nombre, norma, clausula: texto(fd, 'clausula') || null, vigencia_meses: vig ? Number(vig) : null,
  })
  if (error) return { error: error.message.includes('duplicate') ? 'Ya existe un curso con ese código.' : error.message }
  revalidatePath('/recursos-humanos/capacitacion/configuracion')
  revalidatePath('/recursos-humanos/capacitacion')
  return { ok: true }
}

export async function actualizarCurso(id: string, vigenciaMeses: number | null, activo: boolean) {
  if (!(await soloCoordinador())) throw new Error('No autorizado.')
  const supabase = await createClient()
  await supabase.from('capacitacion_cursos').update({ vigencia_meses: vigenciaMeses, activo }).eq('id', id)
  revalidatePath('/recursos-humanos/capacitacion/configuracion')
  revalidatePath('/recursos-humanos/capacitacion')
}

export async function cambiarRequisito(puestoId: string, cursoId: string, requerido: boolean) {
  if (!(await soloCoordinador())) throw new Error('No autorizado.')
  const supabase = await createClient()
  if (requerido) await supabase.from('capacitacion_requisitos').upsert({ puesto_id: puestoId, curso_id: cursoId })
  else await supabase.from('capacitacion_requisitos').delete().eq('puesto_id', puestoId).eq('curso_id', cursoId)
  revalidatePath('/recursos-humanos/capacitacion/configuracion')
  revalidatePath('/recursos-humanos/capacitacion')
}
