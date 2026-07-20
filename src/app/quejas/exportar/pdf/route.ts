import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

const SERVICIO_LABEL: Record<string, string> = {
  almacenaje: 'Almacenaje',
  transporte: 'Transporte',
  seguro_mercancia: 'Seguro de mercancía',
}

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('quejas')
    .select(
      'folio, tipo, creado_en, nombre_cliente, correo_cliente, descripcion, servicio, criticidad, tipo_queja, respuesta_cliente, escalada_ac, correccion, usuario_responsable_id, responsable:usuarios!quejas_usuario_responsable_id_fkey(nombre), fecha_limite, fecha_cierre, estatus'
    )
    .order('creado_en', { ascending: true })

  const quejas = data ?? []

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))

  const listo = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  doc
    .fontSize(14)
    .fillColor('#08495C')
    .text('REGISTRO DE QUEJAS — FSG-03', { align: 'center' })
  doc.fontSize(9).fillColor('#666').text('BONYARD Servicios', { align: 'center' })
  doc.moveDown(1)

  const columnas = [
    { titulo: 'Folio', ancho: 45 },
    { titulo: 'Tipo', ancho: 45 },
    { titulo: 'Fecha', ancho: 55 },
    { titulo: 'Cliente', ancho: 75 },
    { titulo: 'Descripción', ancho: 150 },
    { titulo: 'Servicio', ancho: 60 },
    { titulo: 'Criticidad', ancho: 50 },
    { titulo: 'Tipo de queja', ancho: 75 },
    { titulo: 'Req. AC', ancho: 40 },
    { titulo: 'Responsable', ancho: 75 },
    { titulo: 'F. programada', ancho: 55 },
    { titulo: 'F. cierre', ancho: 55 },
    { titulo: 'Estatus', ancho: 45 },
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
  for (const q of quejas) {
    if (y > doc.page.height - 50) {
      doc.addPage()
      y = doc.page.margins.top
      encabezado()
      doc.fontSize(7).fillColor('#222')
    }

    x = doc.page.margins.left
    const valores = [
      q.folio ?? '',
      q.tipo === 'inocuidad' ? 'Inocuidad' : q.tipo === 'calidad' ? 'Calidad' : '',
      q.creado_en ? new Date(q.creado_en as string).toLocaleDateString('es-MX') : '',
      q.nombre_cliente as string,
      q.descripcion as string,
      SERVICIO_LABEL[q.servicio as string] ?? (q.servicio as string),
      q.criticidad ? String(q.criticidad) : '',
      q.tipo_queja as string,
      q.escalada_ac ? 'Sí' : 'No',
      (q.responsable as unknown as { nombre: string } | null)?.nombre ?? '',
      q.fecha_limite ? new Date(q.fecha_limite as string + 'T00:00:00').toLocaleDateString('es-MX') : '',
      q.fecha_cierre ? new Date(q.fecha_cierre as string).toLocaleDateString('es-MX') : '',
      q.estatus === 'cerrada' ? 'C' : (q.estatus as string),
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
      'Content-Disposition': `attachment; filename="FSG-03_Registro_de_Quejas.pdf"`,
    },
  })
}
