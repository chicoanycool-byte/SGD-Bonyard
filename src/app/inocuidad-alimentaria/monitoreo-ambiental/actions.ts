'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export type EstadoMonitoreo = { error?: string; ok?: boolean; mensaje?: string }
const texto = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
const RUTA = '/inocuidad-alimentaria/monitoreo-ambiental'

async function soloCoordinador() {
  const quien = await requerirUsuario()
  return quien.rol === 'coordinador_sgi' ? quien : null
}

export async function registrarResultado(_p: EstadoMonitoreo, fd: FormData): Promise<EstadoMonitoreo> {
  const quien = await soloCoordinador()
  if (!quien) return { error: 'Solo el Coordinador del SGI registra resultados.' }
  const supabase = await createClient()

  const puntoId = texto(fd, 'punto_id')
  const fecha = texto(fd, 'fecha')
  const resultado = texto(fd, 'resultado')
  if (!puntoId || !fecha || !['conforme', 'fuera_de_limite'].includes(resultado)) {
    return { error: 'Elige el punto, la fecha y si el resultado está dentro o fuera de límite.' }
  }

  const { data: punto } = await supabase.from('monitoreo_puntos').select('codigo, nombre, indicador, riesgo').eq('id', puntoId).single()
  if (!punto) return { error: 'No se encontró el punto de muestreo.' }

  const { data: nuevo, error } = await supabase
    .from('monitoreo_resultados')
    .insert({
      punto_id: puntoId,
      fecha,
      resultado,
      valor: texto(fd, 'valor') || null,
      laboratorio: texto(fd, 'laboratorio') || null,
      observaciones: texto(fd, 'observaciones') || null,
      registrado_por: quien.id,
    })
    .select('id')
    .single()
  if (error || !nuevo) return { error: 'No se pudo guardar. ' + (error?.message ?? '') }

  let extra = ''
  if (resultado === 'fuera_de_limite') {
    const responsableId = texto(fd, 'responsable_id') || null
    const { data: accion } = await supabase
      .from('acciones_correctivas')
      .insert({
        origen: 'manual',
        origen_id: nuevo.id,
        tipo_accion: 'correctiva',
        descripcion: `Monitoreo ambiental: resultado fuera de límite en ${punto.codigo} ${punto.nombre}${punto.indicador ? ` (${punto.indicador})` : ''}, muestra del ${new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX')}${texto(fd, 'valor') ? `. Valor: ${texto(fd, 'valor')}` : ''}.`,
        responsable_id: responsableId,
        estatus: responsableId ? 'en_proceso' : 'abierta',
        creado_por: quien.id,
      })
      .select('id, folio')
      .single()
    if (accion) {
      await supabase.from('monitoreo_resultados').update({ accion_id: accion.id }).eq('id', nuevo.id)
      if (responsableId) {
        await supabase.from('notificaciones').insert({
          usuario_id: responsableId,
          tipo: 'ac_ap',
          mensaje: `Se te asignó la acción ${accion.folio ?? ''} por un resultado fuera de límite en ${punto.nombre}.`,
          referencia_id: accion.id,
        })
      }
      extra = ` Como quedó fuera de límite, se abrió la acción correctiva ${accion.folio ?? ''} para darle seguimiento.`
    }
  }

  revalidatePath(RUTA)
  revalidatePath('/ac-ap')
  return { ok: true, mensaje: `Listo, el resultado quedó registrado.${extra}` }
}

export async function crearPunto(_p: EstadoMonitoreo, fd: FormData): Promise<EstadoMonitoreo> {
  if (!(await soloCoordinador())) return { error: 'No autorizado.' }
  const supabase = await createClient()
  const nombre = texto(fd, 'nombre')
  const nave = texto(fd, 'nave')
  const riesgo = texto(fd, 'riesgo')
  const tipo = texto(fd, 'tipo') || 'superficie'
  const frec = Number(texto(fd, 'frecuencia_dias'))
  if (!nombre || !['Nave 1', 'Nave 2'].includes(nave) || !['alto', 'medio', 'bajo'].includes(riesgo) || !(frec > 0)) {
    return { error: 'Escribe el nombre, elige la nave y el riesgo, y la frecuencia en días.' }
  }
  const { count } = await supabase.from('monitoreo_puntos').select('id', { count: 'exact', head: true })
  const codigo = `MON-${String((count ?? 0) + 1).padStart(2, '0')}`
  const { error } = await supabase.from('monitoreo_puntos').insert({
    codigo, nombre, nave, tipo, riesgo, frecuencia_dias: frec,
    zona: texto(fd, 'zona') || null,
    indicador: texto(fd, 'indicador') || null,
    limite: texto(fd, 'limite') || null,
  })
  if (error) return { error: error.message.includes('duplicate') ? 'Ya existe un punto con ese código, intenta de nuevo.' : error.message }
  revalidatePath(RUTA)
  return { ok: true, mensaje: `Listo, el punto ${codigo} quedó agregado.` }
}

export async function actualizarPunto(id: string, riesgo: string, frecuenciaDias: number, activo: boolean) {
  if (!(await soloCoordinador())) throw new Error('No autorizado.')
  if (!['alto', 'medio', 'bajo'].includes(riesgo) || !(frecuenciaDias > 0)) throw new Error('Datos no válidos.')
  const supabase = await createClient()
  await supabase.from('monitoreo_puntos').update({ riesgo, frecuencia_dias: frecuenciaDias, activo }).eq('id', id)
  revalidatePath(RUTA)
}
