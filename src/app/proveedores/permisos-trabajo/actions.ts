'use server'

import { revalidatePath } from 'next/cache'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const PUESTOS_PERMITIDOS = ['Gerente de operaciones', 'Coordinador del SGI', 'Auxiliar del SGI', 'Jefe de Mantenimiento']

async function requerirGestion() {
  const quien = await requerirUsuario()
  if (!PUESTOS_PERMITIDOS.includes(quien.puesto ?? '')) throw new Error('No autorizado.')
  return quien
}

function bool(formData: FormData, campo: string) {
  return formData.get(campo) === 'on'
}
function boolRadio(formData: FormData, campo: string): boolean | null {
  const v = formData.get(campo)
  if (v === 'si') return true
  if (v === 'no') return false
  return null
}
function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? '').trim() || null
}

export async function crearPermisoTrabajo(formData: FormData) {
  const quien = await requerirGestion()
  const supabase = await createClient()

  const nombreEmpresa = texto(formData, 'nombre_empresa')
  if (!nombreEmpresa) throw new Error('Escribe el nombre de la empresa.')

  const vehiculos = JSON.parse(String(formData.get('vehiculos_json') ?? '[]'))
  const personal = JSON.parse(String(formData.get('personal_json') ?? '[]'))
  const protocolos = JSON.parse(String(formData.get('protocolos_json') ?? '[]'))

  await supabase.from('permisos_trabajo').insert({
    nombre_empresa: nombreEmpresa,
    razon_social: texto(formData, 'razon_social'),
    fecha: String(formData.get('fecha') ?? '') || new Date().toISOString().slice(0, 10),
    vigencia: String(formData.get('vigencia') ?? '') || null,
    tipo_ingreso: texto(formData, 'tipo_ingreso'),
    identificacion: texto(formData, 'identificacion'),
    epp_casco: bool(formData, 'epp_casco'),
    epp_chaleco: bool(formData, 'epp_chaleco'),
    epp_botas: bool(formData, 'epp_botas'),
    vehiculos,
    personal,
    tipo_mantenimiento: texto(formData, 'tipo_mantenimiento'),
    solicitante_bonyard: texto(formData, 'solicitante_bonyard'),
    descripcion_trabajo: texto(formData, 'descripcion_trabajo'),
    hojas_seguridad_anexas: texto(formData, 'hojas_seguridad_anexas'),
    herramientas_equipo: texto(formData, 'herramientas_equipo'),
    emisiones_aire: boolRadio(formData, 'emisiones_aire'),
    emisiones_aire_detalle: texto(formData, 'emisiones_aire_detalle'),
    descargas_agua: boolRadio(formData, 'descargas_agua'),
    descargas_agua_detalle: texto(formData, 'descargas_agua_detalle'),
    trabajo_alturas: boolRadio(formData, 'trabajo_alturas'),
    trabajo_alturas_detalle: texto(formData, 'trabajo_alturas_detalle'),
    trabajos_confinados: boolRadio(formData, 'trabajos_confinados'),
    trabajos_confinados_detalle: texto(formData, 'trabajos_confinados_detalle'),
    soldadura_calor: boolRadio(formData, 'soldadura_calor'),
    soldadura_calor_detalle: texto(formData, 'soldadura_calor_detalle'),
    generacion_desperdicios: boolRadio(formData, 'generacion_desperdicios'),
    desperdicios_detalle: texto(formData, 'desperdicios_detalle'),
    desperdicio_reciclable: boolRadio(formData, 'desperdicio_reciclable'),
    reciclable_detalle: texto(formData, 'reciclable_detalle'),
    consume_energia: boolRadio(formData, 'consume_energia'),
    energia_tipo: texto(formData, 'energia_tipo'),
    energia_detalle: texto(formData, 'energia_detalle'),
    protocolos,
    comentarios_adicionales: texto(formData, 'comentarios_adicionales'),
    firma_solicitante: texto(formData, 'firma_solicitante'),
    firma_seguridad_patrimonial: texto(formData, 'firma_seguridad_patrimonial'),
    firma_contratista: texto(formData, 'firma_contratista'),
    firma_coordinador_sgi: texto(formData, 'firma_coordinador_sgi'),
    responsable_autoriza: quien.id,
    creado_por: quien.id,
  })
  revalidatePath('/proveedores/permisos-trabajo')
}

export async function actualizarEstatusPermiso(id: string, estatus: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('permisos_trabajo').update({ estatus }).eq('id', id)
  revalidatePath('/proveedores/permisos-trabajo')
}

export async function cerrarConVoBo(formData: FormData) {
  await requerirGestion()
  const supabase = await createClient()
  const id = String(formData.get('id') ?? '')
  await supabase
    .from('permisos_trabajo')
    .update({ firma_solicitante_vobo: texto(formData, 'firma_solicitante_vobo'), estatus: 'cerrado' })
    .eq('id', id)
  revalidatePath('/proveedores/permisos-trabajo')
}

export async function eliminarPermisoTrabajo(id: string) {
  await requerirGestion()
  const supabase = await createClient()
  await supabase.from('permisos_trabajo').delete().eq('id', id)
  revalidatePath('/proveedores/permisos-trabajo')
}
