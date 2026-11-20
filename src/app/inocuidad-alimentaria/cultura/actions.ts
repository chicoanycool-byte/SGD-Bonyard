'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export type EstadoCultura = { error?: string; ok?: boolean }

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const ELEMENTOS = ['liderazgo', 'comunicacion', 'capacitacion', 'retroalimentacion', 'medicion']

async function soloCoordinador() {
  const quien = await requerirUsuario()
  return quien.rol === 'coordinador_sgi' ? quien : null
}

export async function crearObjetivo(_p: EstadoCultura, fd: FormData): Promise<EstadoCultura> {
  const quien = await soloCoordinador()
  if (!quien) return { error: 'Solo el Coordinador del SGI puede editar el plan.' }
  const elemento = texto(fd, 'elemento')
  const objetivo = texto(fd, 'objetivo')
  const indicador = texto(fd, 'indicador')
  const meta = texto(fd, 'meta')
  if (!ELEMENTOS.includes(elemento)) return { error: 'Selecciona el elemento de la cultura.' }
  if (!objetivo || !indicador || !meta) return { error: 'El objetivo, el indicador y la meta son obligatorios (deben ser medibles).' }

  const supabase = await createClient()
  const { error } = await supabase.from('cultura_objetivos').insert({
    elemento,
    objetivo,
    indicador,
    meta,
    responsable_id: texto(fd, 'responsable_id') || null,
    fecha_limite: texto(fd, 'fecha_limite') || null,
    creado_por: quien.id,
  })
  if (error) return { error: 'No se pudo guardar. ' + error.message }
  revalidatePath('/inocuidad-alimentaria/cultura')
  return { ok: true }
}

export async function actualizarObjetivo(id: string, avance: string, estatus: string, fechaLimite: string): Promise<EstadoCultura> {
  if (!(await soloCoordinador())) return { error: 'Solo el Coordinador del SGI puede editar el plan.' }
  if (!['en_proceso', 'cumplido', 'no_cumplido'].includes(estatus)) return { error: 'Estatus no válido.' }
  const supabase = await createClient()
  const { error } = await supabase
    .from('cultura_objetivos')
    .update({ avance: avance.trim() || null, estatus, fecha_limite: fechaLimite || null, actualizado_en: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/inocuidad-alimentaria/cultura')
  return { ok: true }
}

export async function crearEvaluacion(_p: EstadoCultura, fd: FormData): Promise<EstadoCultura> {
  const quien = await soloCoordinador()
  if (!quien) return { error: 'Solo el Coordinador del SGI puede registrar evaluaciones.' }
  const fecha = texto(fd, 'fecha')
  const metodo = texto(fd, 'metodo')
  const conclusiones = texto(fd, 'conclusiones')
  if (!fecha || !metodo || !conclusiones) return { error: 'La fecha, el método y las conclusiones son obligatorios.' }
  const pct = texto(fd, 'resultado_pct')
  const n = Number(pct)
  if (pct && (Number.isNaN(n) || n < 0 || n > 100)) return { error: 'El resultado debe ser un porcentaje de 0 a 100.' }

  const supabase = await createClient()
  const { error } = await supabase.from('cultura_evaluaciones').insert({
    fecha,
    metodo,
    nave: texto(fd, 'nave') || null,
    participantes: texto(fd, 'participantes') ? Number(texto(fd, 'participantes')) : null,
    resultado_pct: pct ? n : null,
    conclusiones,
    acciones: texto(fd, 'acciones') || null,
    creado_por: quien.id,
  })
  if (error) return { error: 'No se pudo guardar. ' + error.message }
  revalidatePath('/inocuidad-alimentaria/cultura')
  return { ok: true }
}
