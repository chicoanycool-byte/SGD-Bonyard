import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase.from('pnc_registros').select('*').order('creado_en', { ascending: true })

  const filas = (data ?? []).map((r) => ({
    Folio: r.folio,
    Tipo: r.tipo,
    Fecha: r.fecha,
    'Cliente / Proveedor': r.cliente ?? r.nombre_proveedor ?? '',
    Proyecto: r.proyecto ?? '',
    Lote: r.lote ?? '',
    'Código producto': r.codigo_producto ?? '',
    Cantidad: r.cantidad ?? '',
    'No. tarimas': r.numero_tarimas ?? '',
    'Nombre producto / Tipo equipo': r.nombre_producto ?? r.tipo_equipo ?? '',
    'Tipo de falla': r.tipo_falla ?? '',
    Descripción: r.descripcion_nc ?? r.descripcion_falla ?? '',
    Ubicación: r.ubicacion ?? r.ubicacion_equipo ?? '',
    Disposición: r.disposicion ?? '',
    'Responsable disposición': r.responsable_disposicion ?? '',
    Estatus: r.estatus === 'cerrado' ? 'Cerrado' : 'Abierto',
  }))

  const hoja = XLSX.utils.json_to_sheet(filas)
  hoja['!cols'] = Object.keys(filas[0] ?? {}).map(() => ({ wch: 18 }))

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'FSG-11')

  const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="FSG-11_Control_de_Producto_No_Conforme.xlsx"`,
    },
  })
}
