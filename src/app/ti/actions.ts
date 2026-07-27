'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

async function requerirGestion() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi' && quien.rol !== 'jefe') throw new Error('No autorizado.')
  return quien
}

export async function crearIncidenteTi(formData: FormData) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  const titulo = String(formData.get('titulo') ?? '').trim()
  const sistema = String(formData.get('sistema') ?? '')
  const fechaInicio = String(formData.get('fecha_inicio') ?? '')
  if (!titulo || !sistema || !fechaInicio) throw new Error('Faltan datos obligatorios.')

  await supabase.from('incidentes_ti').insert({
    titulo,
    sistema,
    fecha_inicio: fechaInicio,
    causa: String(formData.get('causa') ?? '').trim() || null,
    impacto: String(formData.get('impacto') ?? '').trim() || null,
    responsable_id: quien.id,
    creado_por: quien.id,
  })
  revalidatePath('/ti/incidentes')
  revalidatePath('/ti/dashboard')
}

export async function cerrarIncidenteTi(formData: FormData) {
  await requerirGestion()
  const supabase = await createClient()

  const id = String(formData.get('id') ?? '')
  const fechaFin = String(formData.get('fecha_fin') ?? '')
  if (!id || !fechaFin) throw new Error('Falta la fecha de resolución.')

  await supabase
    .from('incidentes_ti')
    .update({
      fecha_fin: fechaFin,
      acciones: String(formData.get('acciones') ?? '').trim() || null,
      estatus: 'cerrado',
    })
    .eq('id', id)
  revalidatePath('/ti/incidentes')
  revalidatePath('/ti/dashboard')
}

export async function eliminarIncidenteTi(id: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('incidentes_ti').delete().eq('id', id)
  revalidatePath('/ti/incidentes')
  revalidatePath('/ti/dashboard')
}

export async function guardarDisponibilidadIndicador(indicadorId: string, anio: number, mes: number, valor: number) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  await supabase.from('indicadores_valores').upsert(
    {
      indicador_id: indicadorId,
      anio,
      mes,
      valor,
      comentario: 'Calculado automáticamente desde el registro de incidentes de TI.',
      capturado_por: quien.id,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: 'indicador_id,anio,mes' }
  )
  revalidatePath('/ti/dashboard')
  revalidatePath('/indicadores/dashboard')
}
