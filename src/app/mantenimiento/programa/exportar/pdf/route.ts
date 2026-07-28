import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { dibujarEncabezadoOficial, dibujarPieOficialEnTodasLasPaginas } from '@/lib/pdf/plantillaOficial'

const MESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const nave = request.nextUrl.searchParams.get('nave') ?? 'Nave 1'
  const anio = Number(request.nextUrl.searchParams.get('anio') ?? new Date().getFullYear())

  const supabase = await createClient()

  const { data: catalogo } = await supabase
    .from('mantenimiento_catalogo')
    .select('id, numero, nombre, criticidad, frecuencia')
    .eq('tipo', 'mantenimiento')
    .eq('nave', nave)
    .order('orden')

  const ids = (catalogo ?? []).map((c) => c.id)
  const { data: mensual } = ids.length
    ? await supabase.from('mantenimiento_mensual').select('item_id, mes, programado, realizado').in('item_id', ids).eq('anio', anio)
    : { data: [] }

  const mapaCeldas = new Map<string, { programado: boolean; realizado: boolean }>()
  for (const m of mensual ?? []) {
    mapaCeldas.set(`${m.item_id}-${m.mes}`, { programado: m.programado, realizado: m.realizado })
  }

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 24, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  dibujarEncabezadoOficial(doc, { titulo: `Programa de Mantenimiento Preventivo — ${nave} (${anio})`, codigo: 'FMT-01', version: '01' })

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const colId = 22
  const colEquipo = 130
  const colTipo = 34
  const colFrec = 55
  const colMes = (right - left - colId - colEquipo - colTipo - colFrec - 30) / 12
  const colPct = 30

  function encabezadoTabla() {
    const y = doc.y
    doc.rect(left, y, right - left, 14).fill('#14302B')
    doc.fillColor('#FFFFFF').fontSize(6.5)
    let x = left + 2
    doc.text('ID', x, y + 4, { width: colId }); x += colId
    doc.text('Equipo', x, y + 4, { width: colEquipo }); x += colEquipo
    doc.text('Tipo', x, y + 4, { width: colTipo }); x += colTipo
    doc.text('Frecuencia', x, y + 4, { width: colFrec }); x += colFrec
    for (const m of MESES) {
      doc.text(m, x, y + 4, { width: colMes, align: 'center' })
      x += colMes
    }
    doc.text('%', x, y + 4, { width: colPct, align: 'center' })
    doc.y = y + 15
  }

  encabezadoTabla()

  for (const it of catalogo ?? []) {
    if (doc.y > doc.page.height - 40) {
      doc.addPage()
      encabezadoTabla()
    }
    const yFila = doc.y
    let x = left + 2
    doc.fontSize(6.5).fillColor('#14302B')
    doc.text(String(it.numero ?? ''), x, yFila, { width: colId }); x += colId
    doc.text(it.nombre, x, yFila, { width: colEquipo }); x += colEquipo
    doc.text(it.criticidad === 'CRITICO' ? 'CRIT' : 'NA', x, yFila, { width: colTipo }); x += colTipo
    doc.text(it.frecuencia ?? '', x, yFila, { width: colFrec }); x += colFrec

    let progFila = 0
    let realFila = 0
    for (let mes = 1; mes <= 12; mes++) {
      const c = mapaCeldas.get(`${it.id}-${mes}`)
      if (c?.programado) progFila++
      if (c?.realizado) realFila++
      const simbolo = c?.realizado ? '✓' : c?.programado ? '•' : ''
      const color = c?.realizado ? '#3d6b53' : c?.programado ? '#2d5f8a' : '#000000'
      doc.fillColor(color).text(simbolo, x, yFila, { width: colMes, align: 'center' })
      x += colMes
    }
    const pctFila = progFila > 0 ? Math.round((realFila / progFila) * 100) : null
    doc.fillColor('#14302B').text(pctFila != null ? `${pctFila}%` : '—', x, yFila, { width: colPct, align: 'center' })

    doc.y = yFila + 10
    doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#e8e8e2').lineWidth(0.5).stroke()
    doc.y += 1
  }

  dibujarPieOficialEnTodasLasPaginas(doc)
  doc.end()

  const buffer = await listo
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="programa-mantenimiento-${nave.replace(/\s+/g, '_')}-${anio}.pdf"`,
    },
  })
}
