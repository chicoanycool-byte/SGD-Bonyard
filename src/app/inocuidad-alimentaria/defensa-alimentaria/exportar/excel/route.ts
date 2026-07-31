import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const nave = request.nextUrl.searchParams.get('nave') ?? 'Nave 1'
  const supabase = await createClient()

  const { data: catalogo } = await supabase.from('defensa_alimentaria_catalogo').select('*').order('orden')
  const { data: respuestas } = await supabase.from('defensa_alimentaria_respuestas').select('*').eq('nave', nave)

  const filas = (catalogo ?? []).map((it) => {
    const r = (respuestas ?? []).find((x) => x.item_id === it.id)
    return {
      Sección: it.seccion,
      Pregunta: it.pregunta_grupo ?? '',
      Ítem: it.item,
      SI: r?.respuesta === 'SI' ? 'X' : '',
      NO: r?.respuesta === 'NO' ? 'X' : '',
      'N/A': r?.respuesta === 'NA' ? 'X' : '',
      Hallazgos: r?.hallazgos ?? '',
      'Acciones de mejora': r?.acciones_mejora ?? '',
      Responsable: r?.responsable ?? '',
      'Fecha programada de cierre': r?.fecha_programada_cierre ?? '',
      'Fecha real de cierre': r?.fecha_real_cierre ?? '',
    }
  })

  const ws = XLSX.utils.json_to_sheet(filas)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, nave)
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="FSG-30_Defensa_Alimentaria_${nave.replace(/\s+/g, '_')}.xlsx"`,
    },
  })
}
