import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

const BIMESTRE_LABEL: Record<number, string> = {
  1: 'Enero-Febrero', 2: 'Marzo-Abril', 3: 'Mayo-Junio', 4: 'Julio-Agosto', 5: 'Septiembre-Octubre', 6: 'Noviembre-Diciembre',
}

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const sp = request.nextUrl.searchParams
  const tipoExport = sp.get('tipo') ?? 'inventario'
  const supabase = await createClient()

  if (tipoExport === 'inventario') {
    const nave = sp.get('nave')
    const anio = sp.get('anio')
    const bimestre = sp.get('bimestre')

    let query = supabase.from('vidrio_inventario_items').select('*').order('area').order('orden')
    if (nave) query = query.eq('nave', nave)
    const { data: items } = await query

    const ids = (items ?? []).map((i) => i.id)
    let valoresQuery = supabase.from('vidrio_inventario_valores').select('*').in('item_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
    if (anio) valoresQuery = valoresQuery.eq('anio', Number(anio))
    if (bimestre) valoresQuery = valoresQuery.eq('bimestre', Number(bimestre))
    const { data: valores } = await valoresQuery

    const filas = (items ?? []).map((it) => {
      const v = (valores ?? []).find((x) => x.item_id === it.id)
      return {
        Nave: it.nave,
        Área: it.area,
        Artículo: it.nombre_item,
        Periodo: bimestre ? BIMESTRE_LABEL[Number(bimestre)] : '',
        Año: anio ?? '',
        Cantidad: v?.cantidad ?? '',
        Vidrio: v?.vidrio ?? '',
        Acrílico: v?.acrilico ?? '',
        Condición: v?.condicion === 'bueno' ? 'Buen estado' : v?.condicion === 'malo' ? 'Mal estado' : '',
        Observaciones: v?.observaciones ?? '',
      }
    })

    const ws = XLSX.utils.json_to_sheet(filas)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario Vidrio')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="FSG-39_Inventario_Vidrio.xlsx"',
      },
    })
  }

  // Incidentes
  const nave = sp.get('nave')
  const desde = sp.get('desde')
  const hasta = sp.get('hasta')

  let query = supabase.from('vidrio_incidentes').select('*').order('fecha', { ascending: true })
  if (nave) query = query.eq('nave', nave)
  if (desde) query = query.gte('fecha', desde)
  if (hasta) query = query.lte('fecha', hasta)
  const { data } = await query

  const filas = (data ?? []).map((i) => ({
    Folio: i.folio ?? '',
    'Fecha del incidente': i.fecha ? new Date(i.fecha as string).toLocaleDateString('es-MX') : '',
    Nave: i.nave ?? '',
    'Ubicación del incidente': i.ubicacion ?? '',
    'Descripción del incidente': i.descripcion ?? '',
    Tipo: i.tipo ?? '',
    'Reportado por': i.reportado_por ?? '',
    '¿Se contaminó producto?': i.contamino_producto ? 'Sí' : 'No',
    'Producto afectado y cantidad': i.producto_afectado ?? '',
    'Disposición final del producto': i.disposicion_producto ?? '',
    'Acciones tomadas': i.acciones_tomadas ?? '',
    'Disposición del vidrio/plástico/materia extraña': i.disposicion_vidrio ?? '',
    'Responsable de re-inspección': i.responsable_reinspeccion ?? '',
    Observaciones: i.observaciones ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(filas)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Incidentes')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="FSG-40_Reporte_Incidentes.xlsx"',
    },
  })
}
