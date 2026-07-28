import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { dibujarEncabezadoOficial, dibujarPieOficialEnTodasLasPaginas } from '@/lib/pdf/plantillaOficial'

const CUMPLE_LABEL: Record<string, string> = { SI: 'SÍ', NO: 'NO', NA: 'NA' }

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

  const supabase = await createClient()

  const { data: registro } = await supabase
    .from('limpieza_checklist_registros')
    .select('id, folio, nave, fecha, auditor_nombre, receptor_nombre, comentarios_extra')
    .eq('id', id)
    .single()

  if (!registro) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { data: catalogo } = await supabase.from('limpieza_checklist_catalogo').select('id, categoria, item, orden').order('orden')
  const { data: respuestas } = await supabase
    .from('limpieza_checklist_respuestas')
    .select('item_id, cumple, ubicacion_dano, comentarios')
    .eq('registro_id', id)

  const respPorItem = new Map((respuestas ?? []).map((r) => [r.item_id, r]))

  const doc = new PDFDocument({ size: 'A4', margin: 30, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  dibujarEncabezadoOficial(doc, { titulo: 'Check List de Limpieza e Integridad de la Nave', codigo: 'FMT-04', version: '01' })

  doc.fontSize(9).fillColor('#14302B')
  doc.text(`Folio: ${registro.folio ?? '—'}     Nave: ${registro.nave}     Fecha: ${new Date(registro.fecha + 'T00:00:00').toLocaleDateString('es-MX')}`)
  doc.moveDown(0.5)

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const colItem = 190
  const colCumple = 60
  const colUbic = 130
  const colComent = right - left - colItem - colCumple - colUbic

  let categoriaActual = ''
  for (const it of catalogo ?? []) {
    if (doc.y > doc.page.height - 80) doc.addPage()

    if (it.categoria !== categoriaActual) {
      categoriaActual = it.categoria
      doc.moveDown(0.3)
      doc.rect(left, doc.y, right - left, 14).fill('#14302B')
      doc.fillColor('#FFFFFF').fontSize(8).text(categoriaActual, left + 4, doc.y - 11)
      doc.moveDown(0.6)
      doc.fillColor('#000000')
    }

    const r = respPorItem.get(it.id)
    const yFila = doc.y
    doc.fontSize(7.5).fillColor('#14302B')
    doc.text(it.item, left, yFila, { width: colItem })
    doc.text(r ? CUMPLE_LABEL[r.cumple] ?? '—' : '—', left + colItem, yFila, { width: colCumple })
    doc.fillColor('#5f5e5a')
    doc.text(r?.ubicacion_dano ?? '—', left + colItem + colCumple, yFila, { width: colUbic })
    doc.text(r?.comentarios ?? '—', left + colItem + colCumple + colUbic, yFila, { width: colComent })
    doc.moveDown(0.4)
  }

  if (registro.comentarios_extra) {
    doc.moveDown(0.5)
    doc.fontSize(8).fillColor('#14302B').text('Comentarios extras:', { continued: false })
    doc.fontSize(7.5).fillColor('#5f5e5a').text(registro.comentarios_extra)
  }

  doc.moveDown(1.5)
  const yFirmas = doc.y
  doc.fontSize(8).fillColor('#14302B')
  doc.text('_____________________________', left, yFirmas)
  doc.text('Nombre y firma del auditor', left, yFirmas + 12)
  doc.text(registro.auditor_nombre ?? '', left, yFirmas + 24)

  doc.text('_____________________________', left + 280, yFirmas)
  doc.text('Nombre y firma del que recibe por enterado', left + 280, yFirmas + 12)
  doc.text(registro.receptor_nombre ?? '', left + 280, yFirmas + 24)

  dibujarPieOficialEnTodasLasPaginas(doc)
  doc.end()

  const buffer = await listo
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="checklist-limpieza-${registro.folio ?? registro.id}.pdf"`,
    },
  })
}
