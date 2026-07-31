import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { dibujarEncabezadoOficial, dibujarPieOficialEnTodasLasPaginas } from '@/lib/pdf/plantillaOficial'

function txt(v: unknown) {
  return v != null ? String(v) : ''
}

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const nave = request.nextUrl.searchParams.get('nave') ?? 'Nave 1'
  const supabase = await createClient()

  const { data: catalogo } = await supabase.from('defensa_alimentaria_catalogo').select('*').order('orden')
  const { data: respuestas } = await supabase.from('defensa_alimentaria_respuestas').select('*').eq('nave', nave)

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 26, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  dibujarEncabezadoOficial(doc, { titulo: `Evaluación de Defensa Alimentaria — ${nave}`, codigo: 'FSG-30', version: '01' })

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right

  const cols = [
    { header: 'Ítem', width: 260, get: (r: Record<string, unknown>) => txt(r.item) },
    { header: 'SI', width: 25, get: (r: Record<string, unknown>) => (r.respuesta === 'SI' ? 'X' : '') },
    { header: 'NO', width: 25, get: (r: Record<string, unknown>) => (r.respuesta === 'NO' ? 'X' : '') },
    { header: 'N/A', width: 25, get: (r: Record<string, unknown>) => (r.respuesta === 'NA' ? 'X' : '') },
    { header: 'Hallazgos', width: 160, get: (r: Record<string, unknown>) => txt(r.hallazgos) },
    { header: 'Acciones de mejora', width: 160, get: (r: Record<string, unknown>) => txt(r.acciones_mejora) },
    { header: 'Responsable', width: 90, get: (r: Record<string, unknown>) => txt(r.responsable) },
  ]

  let seccionActual = ''
  function encabezadoTabla() {
    const y = doc.y
    doc.rect(left, y, right - left, 14).fill('#14302B')
    doc.fillColor('#FFFFFF').fontSize(7)
    let x = left + 2
    for (const c of cols) {
      doc.text(c.header, x, y + 4, { width: c.width })
      x += c.width
    }
    doc.y = y + 16
  }
  encabezadoTabla()

  for (const it of catalogo ?? []) {
    if (doc.y > doc.page.height - 30) {
      doc.addPage()
      encabezadoTabla()
    }
    if (it.seccion !== seccionActual) {
      seccionActual = it.seccion
      doc.rect(left, doc.y, right - left, 12).fill('#e6f0fa')
      doc.fillColor('#2d5f8a').fontSize(7).text(seccionActual, left + 3, doc.y + 3)
      doc.y += 13
    }
    const r = (respuestas ?? []).find((x) => x.item_id === it.id) ?? {}
    const y = doc.y
    let x = left + 2
    doc.fontSize(6.5).fillColor('#14302B')
    let alturaMax = 10
    for (const c of cols) {
      const valor = c.get(r as Record<string, unknown> ?? {})
      const texto = c.header === 'Ítem' ? it.item : valor
      doc.text(texto, x, y, { width: c.width - 2 })
      const alto = doc.heightOfString(texto, { width: c.width - 2 })
      if (alto > alturaMax) alturaMax = alto
      x += c.width
    }
    doc.y = y + alturaMax + 3
    doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#e8e8e2').lineWidth(0.5).stroke()
    doc.y += 1
  }

  dibujarPieOficialEnTodasLasPaginas(doc)
  doc.end()

  const buffer = await listo
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="FSG-30_Defensa_Alimentaria_${nave.replace(/\s+/g, '_')}.pdf"`,
    },
  })
}
