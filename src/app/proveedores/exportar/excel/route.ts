import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { CATEGORIA_LABEL } from '@/lib/criteriosProveedores'

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('evaluaciones_proveedor')
    .select(
      'fecha_evaluacion, es_na, criterio_1, criterio_2, criterio_3, criterio_4, criterio_5, criterio_6, puntaje_ponderado, calificacion_pct, clasificacion, requiere_reevaluacion, observaciones, proveedor:proveedores(nombre, categoria, periodicidad, producto_servicio)'
    )
    .order('fecha_evaluacion', { ascending: true })

  const filas = (data ?? []).map((e) => {
    const p = e.proveedor as unknown as {
      nombre: string
      categoria: string
      periodicidad: string
      producto_servicio: string | null
    } | null
    return {
      Proveedor: p?.nombre ?? '',
      Categoría: CATEGORIA_LABEL[p?.categoria ?? ''] ?? p?.categoria ?? '',
      Periodicidad: p?.periodicidad ?? '',
      'Producto / Servicio': p?.producto_servicio ?? '',
      'Fecha evaluación': e.fecha_evaluacion,
      'N/A': e.es_na ? 'Sí' : 'No',
      Criterio1: e.criterio_1 ?? '',
      Criterio2: e.criterio_2 ?? '',
      Criterio3: e.criterio_3 ?? '',
      Criterio4: e.criterio_4 ?? '',
      Criterio5: e.criterio_5 ?? '',
      Criterio6: e.criterio_6 ?? '',
      'Puntaje ponderado': e.puntaje_ponderado ?? '',
      'Calificación %': e.calificacion_pct ? Math.round(Number(e.calificacion_pct) * 100) : '',
      Clasificación: e.clasificacion === 'tipo_a' ? 'TIPO A' : e.clasificacion === 'tipo_b' ? 'TIPO B' : '',
      Reevaluación: e.requiere_reevaluacion ? 'REQUERIDA' : 'NO REQUERIDA',
      Observaciones: e.observaciones ?? '',
    }
  })

  const hoja = XLSX.utils.json_to_sheet(filas)
  hoja['!cols'] = Object.keys(filas[0] ?? {}).map(() => ({ wch: 16 }))

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'FCO-05')

  const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="FCO-05_Evaluacion_Proveedores.xlsx"`,
    },
  })
}
