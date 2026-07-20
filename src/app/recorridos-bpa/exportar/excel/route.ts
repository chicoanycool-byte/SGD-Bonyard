import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('bpa_respuestas')
    .select(
      'respuesta, observaciones, accion_correctiva_requerida, fecha_compromiso, fecha_cierre_real, estatus, checklist:bpa_checklist(numero, nave, area, subarea, pregunta, nivel_riesgo, clasificacion, referencia), recorrido:bpa_recorridos(fecha, naves_inspeccionadas), responsable:usuarios!bpa_respuestas_responsable_id_fkey(nombre)'
    )
    .order('creado_en', { ascending: true })

  const filas = (data ?? []).map((r) => {
    const c = r.checklist as unknown as {
      numero: number
      nave: string | null
      area: string | null
      subarea: string | null
      pregunta: string
      nivel_riesgo: string | null
      clasificacion: string | null
      referencia: string | null
    } | null
    const rec = r.recorrido as unknown as { fecha: string; naves_inspeccionadas: string | null } | null
    return {
      Fecha: rec?.fecha ?? '',
      Nave: c?.nave ?? '',
      Área: c?.area ?? '',
      Subárea: c?.subarea ?? '',
      Pregunta: c?.pregunta ?? '',
      Respuesta: r.respuesta ?? '',
      'Nivel de riesgo': c?.nivel_riesgo ?? '',
      Clasificación: c?.clasificacion ?? '',
      Observaciones: r.observaciones ?? '',
      'Acción correctiva': r.accion_correctiva_requerida ?? '',
      Responsable: (r.responsable as unknown as { nombre: string } | null)?.nombre ?? '',
      'Fecha compromiso': r.fecha_compromiso ?? '',
      'Fecha cierre': r.fecha_cierre_real ?? '',
      Estatus: r.estatus,
      'Referencia normativa': c?.referencia ?? '',
    }
  })

  const hoja = XLSX.utils.json_to_sheet(filas)
  hoja['!cols'] = Object.keys(filas[0] ?? {}).map(() => ({ wch: 18 }))

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Registro de Hallazgos BPA')

  const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Recorridos_BPA_Registro_Hallazgos.xlsx"`,
    },
  })
}
