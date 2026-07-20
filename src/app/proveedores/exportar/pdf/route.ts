import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { CATEGORIA_LABEL } from '@/lib/criteriosProveedores'

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('evaluaciones_proveedor')
    .select(
      'fecha_evaluacion, es_na, calificacion_pct, clasificacion, observaciones, proveedor:proveedores(nombre, categoria)'
    )
    .order('fecha_evaluacion', { ascending: true })

  const evaluaciones = data ?? []

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  doc.fontSize(14).fillColor('#08495C').text('EVALUACIÓN CONTINUA DE PROVEEDORES CRÍTICOS — FCO-05', { align: 'center' })
  doc.fontSize(9).fillColor('#666').text('BONYARD Servicios', { align: 'center' })
  doc.moveDown(1)

  const columnas = [
    { titulo: 'Proveedor', ancho: 180 },
    { titulo: 'Categoría', ancho: 100 },
    { titulo: 'Fecha', ancho: 70 },
    { titulo: 'Calificación', ancho: 70 },
    { titulo: 'Clasificación', ancho: 80 },
    { titulo: 'Observaciones', ancho: 220 },
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

  for (const e of evaluaciones) {
    if (y > doc.page.height - 50) {
      doc.addPage()
      y = doc.page.margins.top
      encabezado()
      doc.fontSize(7).fillColor('#222')
    }

    const p = e.proveedor as unknown as { nombre: string; categoria: string } | null
    x = doc.page.margins.left
    const valores = [
      p?.nombre ?? '',
      CATEGORIA_LABEL[p?.categoria ?? ''] ?? p?.categoria ?? '',
      new Date(e.fecha_evaluacion + 'T00:00:00').toLocaleDateString('es-MX'),
      e.es_na ? 'N/A' : e.calificacion_pct ? `${Math.round(Number(e.calificacion_pct) * 100)}%` : '—',
      e.es_na ? 'N/A' : e.clasificacion === 'tipo_a' ? 'TIPO A' : e.clasificacion === 'tipo_b' ? 'TIPO B' : '—',
      e.observaciones ?? '',
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
      'Content-Disposition': `attachment; filename="FCO-05_Evaluacion_Proveedores.pdf"`,
    },
  })
}
