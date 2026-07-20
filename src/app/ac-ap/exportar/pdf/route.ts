import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('acciones_correctivas')
    .select(
      'folio, tipo_accion, descripcion, creado_en, fecha_compromiso, estatus, responsable:usuarios!acciones_correctivas_responsable_id_fkey(nombre)'
    )
    .order('creado_en', { ascending: true })

  const acciones = data ?? []

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  doc.fontSize(14).fillColor('#08495C').text('CONTROL DE ACCIONES CORRECTIVAS — FSG-10', { align: 'center' })
  doc.fontSize(9).fillColor('#666').text('BONYARD Servicios', { align: 'center' })
  doc.moveDown(1)

  const columnas = [
    { titulo: 'No.', ancho: 30 },
    { titulo: 'Tipo', ancho: 60 },
    { titulo: 'Folio', ancho: 50 },
    { titulo: 'Descripción', ancho: 280 },
    { titulo: 'Responsable', ancho: 100 },
    { titulo: 'F. inicio', ancho: 60 },
    { titulo: 'F. prog. cierre', ancho: 65 },
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

  acciones.forEach((a, i) => {
    if (y > doc.page.height - 50) {
      doc.addPage()
      y = doc.page.margins.top
      encabezado()
      doc.fontSize(7).fillColor('#222')
    }

    x = doc.page.margins.left
    const valores = [
      String(i + 1),
      a.tipo_accion === 'preventiva' ? 'Preventiva' : 'Correctiva',
      a.folio ?? '',
      a.descripcion as string,
      (a.responsable as unknown as { nombre: string } | null)?.nombre ?? '',
      a.creado_en ? new Date(a.creado_en as string).toLocaleDateString('es-MX') : '',
      a.fecha_compromiso ? new Date(a.fecha_compromiso as string + 'T00:00:00').toLocaleDateString('es-MX') : '',
      a.estatus === 'cerrada' ? 'Cerrada' : 'Abierta',
    ]

    const alturaFila = 16
    for (let c = 0; c < columnas.length; c++) {
      doc.text(String(valores[c] ?? ''), x + 2, y + 2, {
        width: columnas[c].ancho - 4,
        height: alturaFila,
        ellipsis: true,
      })
      x += columnas[c].ancho
    }
    doc
      .moveTo(doc.page.margins.left, y + alturaFila)
      .lineTo(x, y + alturaFila)
      .strokeColor('#e0e0e0')
      .stroke()
    y += alturaFila
  })

  doc.end()
  const buffer = await listo

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="FSG-10_Control_de_Acciones_Correctivas.pdf"`,
    },
  })
}
