import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('bpa_respuestas')
    .select(
      'observaciones, estatus, fecha_compromiso, checklist:bpa_checklist(area, subarea, pregunta, nivel_riesgo), recorrido:bpa_recorridos(fecha), responsable:usuarios!bpa_respuestas_responsable_id_fkey(nombre)'
    )
    .eq('respuesta', 'no_cumple')
    .order('creado_en', { ascending: true })

  const hallazgos = data ?? []

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  doc.fontSize(14).fillColor('#08495C').text('REGISTRO DE HALLAZGOS — INSPECCIÓN BPA / SQF', { align: 'center' })
  doc.fontSize(9).fillColor('#666').text('BONYARD Servicios', { align: 'center' })
  doc.moveDown(1)

  const columnas = [
    { titulo: 'Fecha', ancho: 55 },
    { titulo: 'Área', ancho: 90 },
    { titulo: 'Subárea', ancho: 100 },
    { titulo: 'Hallazgo', ancho: 260 },
    { titulo: 'Riesgo', ancho: 50 },
    { titulo: 'Responsable', ancho: 90 },
    { titulo: 'F. compromiso', ancho: 60 },
    { titulo: 'Estatus', ancho: 55 },
  ]

  let y = doc.y
  let x = doc.page.margins.left

  function encabezado() {
    x = doc.page.margins.left
    doc.rect(x, y, columnas.reduce((a, c) => a + c.ancho, 0), 16).fill('#08495C')
    doc.fillColor('#FFFFFF').fontSize(7)
    for (const col of columnas) {
      doc.text(col.titulo, x + 2, y + 4, { width: col.ancho - 4 })
      x += col.ancho
    }
    y += 16
  }

  encabezado()
  doc.fontSize(7).fillColor('#222')

  for (const h of hallazgos) {
    if (y > doc.page.height - 50) {
      doc.addPage()
      y = doc.page.margins.top
      encabezado()
      doc.fontSize(7).fillColor('#222')
    }

    const c = h.checklist as unknown as {
      area: string | null
      subarea: string | null
      pregunta: string
      nivel_riesgo: string | null
    } | null
    const rec = h.recorrido as unknown as { fecha: string } | null

    x = doc.page.margins.left
    const valores = [
      rec?.fecha ? new Date(rec.fecha + 'T00:00:00').toLocaleDateString('es-MX') : '',
      c?.area ?? '',
      c?.subarea ?? '',
      c?.pregunta ?? '',
      c?.nivel_riesgo ?? '',
      (h.responsable as unknown as { nombre: string } | null)?.nombre ?? '',
      h.fecha_compromiso ? new Date(h.fecha_compromiso + 'T00:00:00').toLocaleDateString('es-MX') : '',
      h.estatus === 'cerrado' ? 'Cerrado' : 'Abierto',
    ]

    const alturaFila = 16
    for (let i = 0; i < columnas.length; i++) {
      doc.text(String(valores[i] ?? ''), x + 2, y + 2, {
        width: columnas[i].ancho - 4,
        height: alturaFila,
        ellipsis: true,
      })
      x += columnas[i].ancho
    }
    doc
      .moveTo(doc.page.margins.left, y + alturaFila)
      .lineTo(x, y + alturaFila)
      .strokeColor('#e0e0e0')
      .stroke()
    y += alturaFila
  }

  doc.end()
  const buffer = await listo

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Recorridos_BPA_Registro_Hallazgos.pdf"`,
    },
  })
}
