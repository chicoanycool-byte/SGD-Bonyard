'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const PUESTOS_PERMITIDOS = ['Coordinador del SGI', 'Gerente de operaciones', 'Jefe de Mantenimiento']

async function requerirGestion() {
  const quien = await requerirUsuario()
  if (!PUESTOS_PERMITIDOS.includes(quien.puesto ?? '')) throw new Error('No autorizado.')
  return quien
}

function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? '').trim() || null
}
function entero(formData: FormData, campo: string) {
  const v = formData.get(campo)
  return v ? Number(v) : null
}

// ---------- Recepción ----------

export async function crearRecepcionSello(formData: FormData) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  const { count } = await supabase.from('sellos_recepcion').select('id', { count: 'exact', head: true })

  await supabase.from('sellos_recepcion').insert({
    numero: (count ?? 0) + 1,
    fecha_recepcion: String(formData.get('fecha_recepcion') ?? '') || new Date().toISOString().slice(0, 10),
    origen: texto(formData, 'origen'),
    cliente_proveedor: texto(formData, 'cliente_proveedor'),
    sello_inicial: texto(formData, 'sello_inicial'),
    sello_final: texto(formData, 'sello_final'),
    cantidad: entero(formData, 'cantidad'),
    tipo_sello: texto(formData, 'tipo_sello'),
    recibido_por: texto(formData, 'recibido_por'),
    observaciones: texto(formData, 'observaciones'),
    firma: texto(formData, 'firma'),
    creado_por: quien.id,
  })
  revalidatePath('/seguridad-patrimonial/sellos')
}

export async function eliminarRecepcionSello(id: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('sellos_recepcion').delete().eq('id', id)
  revalidatePath('/seguridad-patrimonial/sellos')
}

// ---------- Entrega ----------

export async function crearEntregaSello(formData: FormData) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  const { count } = await supabase.from('sellos_entrega').select('id', { count: 'exact', head: true })

  await supabase.from('sellos_entrega').insert({
    numero: (count ?? 0) + 1,
    fecha_entrega: String(formData.get('fecha_entrega') ?? '') || new Date().toISOString().slice(0, 10),
    entregado_a: texto(formData, 'entregado_a'),
    puesto: texto(formData, 'puesto'),
    sello_inicial: texto(formData, 'sello_inicial'),
    sello_final: texto(formData, 'sello_final'),
    cantidad: entero(formData, 'cantidad'),
    tipo_sello: texto(formData, 'tipo_sello'),
    recibido_por: texto(formData, 'recibido_por'),
    observaciones: texto(formData, 'observaciones'),
    firma: texto(formData, 'firma'),
    creado_por: quien.id,
  })
  revalidatePath('/seguridad-patrimonial/sellos')
}

export async function eliminarEntregaSello(id: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('sellos_entrega').delete().eq('id', id)
  revalidatePath('/seguridad-patrimonial/sellos')
}

// ---------- Anomalías ----------

export async function crearAnomaliaSello(formData: FormData) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  const { count } = await supabase.from('sellos_anomalias').select('id', { count: 'exact', head: true })

  await supabase.from('sellos_anomalias').insert({
    numero: (count ?? 0) + 1,
    fecha: String(formData.get('fecha') ?? '') || new Date().toISOString().slice(0, 10),
    sello_esperado: texto(formData, 'sello_esperado'),
    sello_suplantado: texto(formData, 'sello_suplantado'),
    unidad_placas: texto(formData, 'unidad_placas'),
    tipo_anomalia: texto(formData, 'tipo_anomalia'),
    accion_tomada: texto(formData, 'accion_tomada'),
    notificado_a: texto(formData, 'notificado_a'),
    responsable_registro: texto(formData, 'responsable_registro'),
    observaciones: texto(formData, 'observaciones'),
    firma: texto(formData, 'firma'),
    creado_por: quien.id,
  })
  revalidatePath('/seguridad-patrimonial/sellos')
}

export async function eliminarAnomaliaSello(id: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('sellos_anomalias').delete().eq('id', id)
  revalidatePath('/seguridad-patrimonial/sellos')
}
