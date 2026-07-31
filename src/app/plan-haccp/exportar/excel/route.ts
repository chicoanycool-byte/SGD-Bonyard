import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const [{ data: equipo }, { data: procesos }, { data: productos }, { data: plan }] = await Promise.all([
    supabase.from('haccp_equipo').select('*').order('nave').order('rol_equipo'),
    supabase.from('haccp_analisis_procesos').select('*').order('nave').order('area').order('orden'),
    supabase.from('haccp_analisis_productos').select('*').order('nave').order('categoria').order('orden'),
    supabase.from('haccp_plan').select('*').order('nave').order('orden'),
  ])

  const wb = XLSX.utils.book_new()

  const filasEquipo = (equipo ?? []).map((e) => ({
    Nave: e.nave,
    Nombre: e.nombre,
    Puesto: e.puesto ?? '',
    Rol: e.rol_equipo,
    'Medios de localización': e.medios_localizacion ?? '',
    Escolaridad: e.escolaridad ?? '',
    Conocimientos: e.conocimientos ?? '',
    Experiencia: e.experiencia ?? '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasEquipo), 'Equipo HACCP')

  const filasProcesos = (procesos ?? []).map((p) => ({
    Nave: p.nave,
    Área: p.area,
    'N° Etapa': p.numero_etapa ?? '',
    'Etapa del proceso': p.etapa_proceso ?? '',
    Actividad: p.actividad ?? '',
    'Tipo de peligro': p.tipo_peligro ?? '',
    Peligro: p.peligro ?? '',
    Severidad: p.severidad ?? '',
    Probabilidad: p.probabilidad ?? '',
    Riesgo: p.riesgo ?? '',
    'Nivel de riesgo': p.nivel_riesgo ?? '',
    Justificación: p.justificacion ?? '',
    'Nivel aceptable': p.nivel_aceptable ?? '',
    'Medidas de control': p.medidas_control ?? '',
    PCC: p.pcc ?? '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasProcesos), 'Análisis de Procesos')

  const filasProductos = (productos ?? []).map((p) => ({
    Nave: p.nave,
    Categoría: p.categoria,
    'N°': p.numero ?? '',
    Producto: p.producto ?? '',
    'Utilizado en': p.utilizado_en ?? '',
    'Tipo de peligro': p.tipo_peligro ?? '',
    Peligro: p.peligro ?? '',
    Severidad: p.severidad ?? '',
    Probabilidad: p.probabilidad ?? '',
    Riesgo: p.riesgo ?? '',
    'Nivel de riesgo': p.nivel_riesgo ?? '',
    Justificación: p.justificacion ?? '',
    'Nivel aceptable': p.nivel_aceptable ?? '',
    'Medidas de control': p.medidas_control ?? '',
    PCC: p.pcc ?? '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasProductos), 'Análisis de Productos')

  const filasPlan = (plan ?? []).map((p) => ({
    Nave: p.nave,
    Proceso: p.proceso ?? '',
    'Etapa / Material': p.etapa_material ?? '',
    PCC: p.pcc ?? '',
    'Descripción del peligro': p.descripcion_peligro ?? '',
    'Límites críticos': p.limites_criticos ?? '',
    Muestra: p.muestra ?? '',
    Frecuencia: p.frecuencia ?? '',
    'Método de monitoreo': p.metodo_monitoreo ?? '',
    'Medidas correctoras': p.medidas_correctoras ?? '',
    Registros: p.registros ?? '',
    'Documentos de referencia': p.documentos_referencia ?? '',
    'Responsable monitoreo': p.responsable_monitoreo ?? '',
    'Responsable verificación': p.responsable_verificacion ?? '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasPlan), 'Plan HACCP')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Plan_HACCP_Completo.xlsx"',
    },
  })
}
