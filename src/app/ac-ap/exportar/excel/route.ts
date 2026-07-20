import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('acciones_correctivas')
    .select(
      'folio, tipo_accion, descripcion, creado_en, fecha_compromiso, fecha_cierre, estatus, responsable:usuarios!acciones_correctivas_responsable_id_fkey(nombre)'
    )
    .order('creado_en', { ascending: true })

  const filas = (data ?? []).map((a, i) => ({
    'No.': i + 1,
    Tipo: a.tipo_accion === 'preventiva' ? 'Preventiva' : 'Correctiva',
    Folio: a.folio ?? '',
    Descripción: a.descripcion,
    Responsable: (a.responsable as unknown as { nombre: string } | null)?.nombre ?? '',
    'Fecha de inicio': a.creado_en ? new Date(a.creado_en as string).toLocaleDateString('es-MX') : '',
    'Fecha programada de cierre': a.fecha_compromiso
      ? new Date(a.fecha_compromiso as string + 'T00:00:00').toLocaleDateString('es-MX')
      : '',
    'Estatus (Cerrada / Abierta)': a.estatus === 'cerrada' ? 'Cerrada' : 'Abierta',
  }))

  const hoja = XLSX.utils.json_to_sheet(filas)
  hoja['!cols'] = Object.keys(filas[0] ?? {}).map(() => ({ wch: 22 }))

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, `${new Date().getFullYear()}`)

  const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="FSG-10_Control_de_Acciones_Correctivas.xlsx"`,
    },
  })
}
