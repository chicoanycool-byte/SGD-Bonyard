import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { dibujarEncabezadoOficial, dibujarPieOficialEnTodasLasPaginas } from '@/lib/pdf/plantillaOficial'

const BIMESTRE_LABEL: Record<number, string> = {
  1: 'Enero-Febrero', 2: 'Marzo-Abril', 3: 'Mayo-Junio', 4: 'Julio-Agosto', 5: 'Septiembre-Octubre', 6: 'Noviembre-Diciembre',
}

function txt(v: unknown) {
  return v != null ? String(v) : ''
}

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const sp = request.nextUrl.searchParams
  const tipoExport = sp.get('tipo') ?? 'inventario'
  const supabase = await createClient()

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 26, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right

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

    dibujarEncabezadoOficial(doc, {
      titulo: `Inventario de Vidrio y Plástico Duro Quebradizo — ${nave ?? 'Todas las naves'} — ${bimestre ? BIMESTRE_LABEL[Number(bimestre)] : ''} ${anio ?? ''}`,
      codigo: 'FSG-39',
      version: '01',
    })

    const cols = [
      { header: 'Área', width: 100, get: (r: Record<string, unknown>) => txt(r.area) },
      { header: 'Artículo', width: 140, get: (r: Record<string, unknown>) => txt(r.nombre_item) },
      { header: 'Cantidad', width: 55, get: (r: Record<string, unknown>) => txt(r.cantidad) },
      { header: 'Vidrio', width: 55, get: (r: Record<string, unknown>) => txt(r.vidrio) },
      { header: 'Acrílico', width: 55, get: (r: Record<string, unknown>) => txt(r.acrilico) },
      { header: 'Condición', width: 80, get: (r: Record<string, unknown>) => (r.condicion === 'bueno' ? 'Buen estado' : r.condicion === 'malo' ? 'Mal estado' : '') },
      { header: 'Observaciones', width: 250, get: (r: Record<string, unknown>) => txt(r.observaciones) },
    ]

    function encabezado() {
      const y = doc.y
      doc.rect(left, y, right - left, 14).fill('#14302B')
      doc.fillColor('#FFFFFF').fontSize(7.5)
      let x = left + 2
      for (const c of cols) {
        doc.text(c.header, x, y + 4, { width: c.width })
        x += c.width
      }
      doc.y = y + 16
    }
    encabezado()

    for (const it of items ?? []) {
      if (doc.y > doc.page.height - 30) {
        doc.addPage()
        encabezado()
      }
      const v = (valores ?? []).find((x) => x.item_id === it.id) ?? {}
      const fila = { ...it, ...v }
      const y = doc.y
      let x = left + 2
      doc.fontSize(7).fillColor('#14302B')
      for (const c of cols) {
        doc.text(c.get(fila as Record<string, unknown>), x, y, { width: c.width - 2 })
        x += c.width
      }
      doc.y = y + 12
      doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#e8e8e2').lineWidth(0.5).stroke()
      doc.y += 1
    }
  } else {
    const nave = sp.get('nave')
    const desde = sp.get('desde')
    const hasta = sp.get('hasta')

    let query = supabase.from('vidrio_incidentes').select('*').order('fecha')
    if (nave) query = query.eq('nave', nave)
    if (desde) query = query.gte('fecha', desde)
    if (hasta) query = query.lte('fecha', hasta)
    const { data } = await query

    dibujarEncabezadoOficial(doc, {
      titulo: `Reporte de Incidentes de Vidrio, Plástico Duro Quebradizo y Materia Extraña${nave ? ' — ' + nave : ''}`,
      codigo: 'FSG-40',
      version: '01',
    })

    const cols = [
      { header: 'Folio', width: 45, get: (r: Record<string, unknown>) => txt(r.folio) },
      { header: 'Fecha', width: 50, get: (r: Record<string, unknown>) => (r.fecha ? new Date(r.fecha as string).toLocaleDateString('es-MX') : '') },
      { header: 'Ubicación', width: 70, get: (r: Record<string, unknown>) => txt(r.ubicacion) },
      { header: 'Descripción', width: 120, get: (r: Record<string, unknown>) => txt(r.descripcion) },
      { header: 'Tipo', width: 55, get: (r: Record<string, unknown>) => txt(r.tipo) },
      { header: 'Reportado por', width: 70, get: (r: Record<string, unknown>) => txt(r.reportado_por) },
      { header: '¿Contaminó?', width: 55, get: (r: Record<string, unknown>) => (r.contamino_producto ? 'Sí' : 'No') },
      { header: 'Acciones tomadas', width: 130, get: (r: Record<string, unknown>) => txt(r.acciones_tomadas) },
      { header: 'Disposición vidrio/plástico', width: 130, get: (r: Record<string, unknown>) => txt(r.disposicion_vidrio) },
      { header: 'Responsable re-inspección', width: 90, get: (r: Record<string, unknown>) => txt(r.responsable_reinspeccion) },
    ]

    function encabezado() {
      const y = doc.y
      doc.rect(left, y, right - left, 14).fill('#14302B')
      doc.fillColor('#FFFFFF').fontSize(6.5)
      let x = left + 2
      for (const c of cols) {
        doc.text(c.header, x, y + 4, { width: c.width })
        x += c.width
      }
      doc.y = y + 16
    }
    encabezado()

    for (const fila of data ?? []) {
      if (doc.y > doc.page.height - 30) {
        doc.addPage()
        encabezado()
      }
      const y = doc.y
      let x = left + 2
      doc.fontSize(6.5).fillColor('#14302B')
      let alturaMax = 10
      for (const c of cols) {
        const valor = c.get(fila as Record<string, unknown>)
        doc.text(valor, x, y, { width: c.width - 2 })
        const alto = doc.heightOfString(valor, { width: c.width - 2 })
        if (alto > alturaMax) alturaMax = alto
        x += c.width
      }
      doc.y = y + alturaMax + 3
      doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#e8e8e2').lineWidth(0.5).stroke()
      doc.y += 1
    }
  }

  dibujarPieOficialEnTodasLasPaginas(doc)
  doc.end()

  const buffer = await listo
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${tipoExport === 'inventario' ? 'FSG-39' : 'FSG-40'}.pdf"`,
    },
  })
}
