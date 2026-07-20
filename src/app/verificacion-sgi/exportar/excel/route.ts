import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function GET() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  const supabase = await createClient()

  const { data } = await supabase
    .from('verificacion_respuestas')
    .select(
      'respuesta, hallazgo, accion_mejora, fecha_compromiso, fecha_cierre_real, estatus, checklist:verificacion_checklist(numero, bloque, subarea, criterio, doc_ref, area_responsable), verificacion:verificaciones(numero, fecha, periodo_evaluado, area_proceso), responsable:usuarios!verificacion_respuestas_responsable_id_fkey(nombre)'
    )
    .order('creado_en', { ascending: true })

  const filas = (data ?? []).map((r) => {
    const c = r.checklist as unknown as {
      numero: number
      bloque: string | null
      subarea: string | null
      criterio: string
      doc_ref: string | null
      area_responsable: string | null
    } | null
    const v = r.verificacion as unknown as {
      numero: string
      fecha: string
      periodo_evaluado: string | null
      area_proceso: string | null
    } | null
    return {
      'No. Verificación': v?.numero ?? '',
      Fecha: v?.fecha ?? '',
      'Período evaluado': v?.periodo_evaluado ?? '',
      'Área / Proceso': v?.area_proceso ?? '',
      '#': c?.numero ?? '',
      Bloque: c?.bloque ?? '',
      Subárea: c?.subarea ?? '',
      Criterio: c?.criterio ?? '',
      'Doc. Ref.': c?.doc_ref ?? '',
      'Área responsable': c?.area_responsable ?? '',
      Respuesta: r.respuesta ?? '',
      'Hallazgo / Observación': r.hallazgo ?? '',
      'Acción de mejora': r.accion_mejora ?? '',
      Responsable: (r.responsable as unknown as { nombre: string } | null)?.nombre ?? '',
      'Fecha compromiso': r.fecha_compromiso ?? '',
      'Fecha cierre': r.fecha_cierre_real ?? '',
      Estatus: r.estatus,
    }
  })

  const hoja = XLSX.utils.json_to_sheet(filas)
  hoja['!cols'] = Object.keys(filas[0] ?? {}).map(() => ({ wch: 18 }))

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Verificación SGI')

  const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Verificacion_SGI.xlsx"`,
    },
  })
}
