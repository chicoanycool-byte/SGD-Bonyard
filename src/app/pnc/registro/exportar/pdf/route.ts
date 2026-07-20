import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase.from('pnc_registros').select('*').order('creado_en', { ascending: true })
  const registros = data ?? []

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  doc.fontSize(14).fillColor('#08495C').text('CONTROL DE PRODUCTO NO CONFORME — FSG-11', { align: 'center' })
  doc.fontSize(9).fillColor('#666').text('BONYARD Servicios', { align: 'center' })
  doc.moveDown(1)

  const columnas = [
    { titulo: 'Folio', ancho: 55 },
    { titulo: 'Tipo', ancho: 50 },
    { titulo: 'Fecha', ancho: 55 },
    { titulo: 'Cliente/Proveedor', ancho: 100 },
    { titulo: 'Producto/Equipo', ancho: 110 },
    { titulo: 'Descripción', ancho: 220 },
    { titulo: 'Disposición', ancho: 140 },
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

  for (const r of registros) {
    if (y > doc.page.height - 50) {
      doc.addPage()
      y = doc.page.margins.top
      encabezado()
      doc.fontSize(7).fillColor('#222')
    }

    x = doc.page.margins.left
    const valores = [
      r.folio ?? '',
      r.tipo,
      r.fecha ? new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-MX') : '',
      r.cliente ?? r.nombre_proveedor ?? '',
      r.nombre_producto ?? r.tipo_equipo ?? '',
      r.descripcion_nc ?? r.descripcion_falla ?? '',
      r.disposicion ?? '',
      r.estatus === 'cerrado' ? 'Cerrado' : 'Abierto',
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
      'Content-Disposition': `attachment; filename="FSG-11_Control_de_Producto_No_Conforme.pdf"`,
    },
  })
}
