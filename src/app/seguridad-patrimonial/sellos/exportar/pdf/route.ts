import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { dibujarEncabezadoOficial, dibujarPieOficialEnTodasLasPaginas } from '@/lib/pdf/plantillaOficial'

type Columna = { header: string; width: number; get: (row: Record<string, unknown>) => string; esImagen?: boolean }

function fecha(v: unknown) {
  return v ? new Date(v as string).toLocaleDateString('es-MX') : ''
}
function txt(v: unknown) {
  return v != null ? String(v) : ''
}

const CONFIG: Record<string, { titulo: string; tabla: string; orderCol: string; columnas: Columna[] }> = {
  recepcion: {
    titulo: 'Bitácora de Control de Sellos — Recepción',
    tabla: 'sellos_recepcion',
    orderCol: 'numero',
    columnas: [
      { header: 'No.', width: 20, get: (r) => txt(r.numero) },
      { header: 'Fecha', width: 45, get: (r) => fecha(r.fecha_recepcion) },
      { header: 'Origen', width: 40, get: (r) => txt(r.origen) },
      { header: 'Cliente/Proveedor', width: 75, get: (r) => txt(r.cliente_proveedor) },
      { header: 'Sello inicial', width: 50, get: (r) => txt(r.sello_inicial) },
      { header: 'Sello final', width: 50, get: (r) => txt(r.sello_final) },
      { header: 'Cant.', width: 30, get: (r) => txt(r.cantidad) },
      { header: 'Tipo', width: 40, get: (r) => txt(r.tipo_sello) },
      { header: 'Recibido por', width: 60, get: (r) => txt(r.recibido_por) },
      { header: 'Observaciones', width: 80, get: (r) => txt(r.observaciones) },
      { header: 'Firma', width: 55, get: (r) => txt(r.firma), esImagen: true },
    ],
  },
  entrega: {
    titulo: 'Bitácora de Control de Sellos — Entrega',
    tabla: 'sellos_entrega',
    orderCol: 'numero',
    columnas: [
      { header: 'No.', width: 20, get: (r) => txt(r.numero) },
      { header: 'Fecha', width: 45, get: (r) => fecha(r.fecha_entrega) },
      { header: 'A quien se entrega', width: 75, get: (r) => txt(r.entregado_a) },
      { header: 'Puesto', width: 60, get: (r) => txt(r.puesto) },
      { header: 'Sello inicial', width: 50, get: (r) => txt(r.sello_inicial) },
      { header: 'Sello final', width: 50, get: (r) => txt(r.sello_final) },
      { header: 'Cant.', width: 30, get: (r) => txt(r.cantidad) },
      { header: 'Tipo', width: 40, get: (r) => txt(r.tipo_sello) },
      { header: 'Recibido por', width: 60, get: (r) => txt(r.recibido_por) },
      { header: 'Observaciones', width: 70, get: (r) => txt(r.observaciones) },
      { header: 'Firma', width: 45, get: (r) => txt(r.firma), esImagen: true },
    ],
  },
  anomalias: {
    titulo: 'Bitácora de Control de Sellos — Anomalías',
    tabla: 'sellos_anomalias',
    orderCol: 'numero',
    columnas: [
      { header: 'No.', width: 20, get: (r) => txt(r.numero) },
      { header: 'Fecha', width: 42, get: (r) => fecha(r.fecha) },
      { header: 'Sello esperado', width: 55, get: (r) => txt(r.sello_esperado) },
      { header: 'Sello suplantado', width: 58, get: (r) => txt(r.sello_suplantado) },
      { header: 'Unidad/Placas', width: 55, get: (r) => txt(r.unidad_placas) },
      { header: 'Tipo anomalía', width: 60, get: (r) => txt(r.tipo_anomalia) },
      { header: 'Acción tomada', width: 65, get: (r) => txt(r.accion_tomada) },
      { header: 'Notificado a', width: 55, get: (r) => txt(r.notificado_a) },
      { header: 'Responsable', width: 55, get: (r) => txt(r.responsable_registro) },
      { header: 'Firma', width: 40, get: (r) => txt(r.firma), esImagen: true },
    ],
  },
}

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const formato = request.nextUrl.searchParams.get('formato') ?? 'recepcion'
  const config = CONFIG[formato]
  if (!config) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })

  const supabase = await createClient()
  const { data } = await supabase.from(config.tabla).select('*').order(config.orderCol)

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 28, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  dibujarEncabezadoOficial(doc, { titulo: config.titulo, codigo: 'FSP-06', version: '01' })

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right

  function encabezadoTabla() {
    const y = doc.y
    doc.rect(left, y, right - left, 16).fill('#14302B')
    doc.fillColor('#FFFFFF').fontSize(7)
    let x = left + 2
    for (const col of config.columnas) {
      doc.text(col.header, x, y + 5, { width: col.width })
      x += col.width
    }
    doc.y = y + 17
  }

  encabezadoTabla()

  for (const fila of data ?? []) {
    if (doc.y > doc.page.height - 35) {
      doc.addPage()
      encabezadoTabla()
    }
    const yFila = doc.y
    let x = left + 2
    doc.fontSize(6.8).fillColor('#14302B')
    let alturaMax = 14
    for (const col of config.columnas) {
      const valor = col.get(fila as Record<string, unknown>)
      if (col.esImagen && valor.startsWith('data:image')) {
        try {
          const base64 = valor.split(',')[1]
          const buffer = Buffer.from(base64, 'base64')
          doc.image(buffer, x, yFila, { fit: [col.width - 2, 20] })
        } catch {
          // si la imagen no se puede decodificar, se omite silenciosamente
        }
      } else {
        doc.text(valor, x, yFila, { width: col.width - 2 })
        const alto = doc.heightOfString(valor, { width: col.width - 2 })
        if (alto > alturaMax) alturaMax = alto
      }
      x += col.width
    }
    doc.y = yFila + alturaMax + 4
    doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#e8e8e2').lineWidth(0.5).stroke()
    doc.y += 1
  }

  dibujarPieOficialEnTodasLasPaginas(doc)
  doc.end()

  const buffer = await listo
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="FSP-06-${formato}.pdf"`,
    },
  })
}
