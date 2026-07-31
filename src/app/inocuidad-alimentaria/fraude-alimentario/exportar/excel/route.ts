import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const sp = request.nextUrl.searchParams
  const tipo = sp.get('tipo') ?? 'vulnerabilidad'
  const supabase = await createClient()
  const wb = XLSX.utils.book_new()

  if (tipo === 'vulnerabilidad') {
    const nave = sp.get('nave') ?? 'Nave 1'
    const { data } = await supabase.from('fraude_vulnerabilidad_procesos').select('*').eq('nave', nave).order('orden')
    const filas = (data ?? []).map((v) => ({
      Área: v.area, Proceso: v.proceso, 'Etapas del flujo': v.etapas_flujo ?? '',
      Dilución: v.dilucion ?? '', Sustitución: v.sustitucion ?? '', Ocultamiento: v.ocultamiento ?? '',
      'Mejoras no aprobadas': v.mejoras_no_aprobadas ?? '', 'Mercado negro': v.mercado_negro ?? '',
      'Mal etiquetado': v.mal_etiquetado ?? '', Falsificación: v.falsificacion ?? '',
      Vulnerabilidad: v.vulnerabilidad ?? '', Severidad: v.severidad ?? '', Probabilidad: v.probabilidad ?? '',
      Sumatoria: v.sumatoria ?? '', 'Nivel de riesgo': v.nivel_riesgo ?? '', 'Medidas de control': v.medidas_control ?? '',
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), nave)
  } else if (tipo === 'productos') {
    const { data } = await supabase.from('fraude_analisis_productos').select('*').order('orden')
    const filas = (data ?? []).map((p) => ({
      Producto: p.producto, Proveedor: p.proveedor ?? '', Cliente: p.cliente ?? '', 'Origen materia prima': p.origen_materia_prima ?? '',
      Dilución: p.dilucion ?? '', Sustitución: p.sustitucion ?? '', Ocultamiento: p.ocultamiento ?? '',
      'Mejoras no aprobadas': p.mejoras_no_aprobadas ?? '', 'Mercado negro': p.mercado_negro ?? '',
      'Mal etiquetado': p.mal_etiquetado ?? '', Falsificación: p.falsificacion ?? '',
      'Costo/Disponibilidad': p.costo_disponibilidad ?? '', 'País origen/Distancia': p.pais_origen_distancia ?? '',
      'Proveedor certificado': p.proveedor_certificado ?? '', 'Identidad preservada': p.identidad_preservada ?? '',
      'Severidad del fraude': p.severidad_fraude ?? '', 'Nivel de riesgo': p.nivel_riesgo ?? '', 'Medida de control': p.medida_control ?? '',
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), 'Análisis de Productos')
  } else {
    const { data } = await supabase.from('fraude_plan_mitigacion').select('*').order('orden')
    const filas = (data ?? []).map((m) => ({
      'Tipo de fraude': m.tipo_fraude, Medida: m.medida ?? '', Responsable: m.responsable ?? '',
      Frecuencia: m.frecuencia ?? '', 'Acción correctiva': m.accion_correctiva ?? '',
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), 'Plan de Mitigación')
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Fraude_Alimentario_${tipo}.xlsx"`,
    },
  })
}
