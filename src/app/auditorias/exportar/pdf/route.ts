import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { dibujarEncabezadoOficial, dibujarPieOficialEnTodasLasPaginas } from '@/lib/pdf/plantillaOficial'

const NORMA_LABEL: Record<string, string> = { iso_9001: 'ISO 9001:2015', sqf: 'SQF', ambas: 'ISO 9001:2015 + SQF' }

function txt(v: unknown) {
  return v != null ? String(v) : ''
}

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('auditorias')
    .select(
      'fecha, norma, tipo, proceso, cliente_nombre, nave, estatus, auditor_lider:usuarios!auditorias_auditor_lider_id_fkey(nombre), auditado:usuarios!auditorias_auditado_id_fkey(nombre)'
    )
    .order('fecha', { ascending: true })

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 28, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  dibujarEncabezadoOficial(doc, { titulo: 'Programa de Auditorías', codigo: 'FSG-56', version: '01' })

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right

  const cols = [
    { header: 'Fecha', width: 55, get: (r: Record<string, unknown>) => (r.fecha ? new Date(r.fecha as string).toLocaleDateString('es-MX') : '') },
    { header: 'Norma', width: 90, get: (r: Record<string, unknown>) => NORMA_LABEL[r.norma as string] ?? txt(r.norma) },
    { header: 'Tipo', width: 55, get: (r: Record<string, unknown>) => txt(r.tipo) },
    { header: 'Proceso', width: 110, get: (r: Record<string, unknown>) => txt(r.proceso) },
    { header: 'Cliente', width: 90, get: (r: Record<string, unknown>) => txt(r.cliente_nombre) },
    { header: 'Nave', width: 55, get: (r: Record<string, unknown>) => txt(r.nave) },
    { header: 'Auditor líder', width: 100, get: (r: Record<string, unknown>) => (r.auditor_lider as { nombre: string } | null)?.nombre ?? '' },
    { header: 'Auditado', width: 100, get: (r: Record<string, unknown>) => (r.auditado as { nombre: string } | null)?.nombre ?? '' },
    { header: 'Estatus', width: 70, get: (r: Record<string, unknown>) => txt(r.estatus) },
  ]

  function encabezado() {
    const y = doc.y
    doc.rect(left, y, right - left, 15).fill('#14302B')
    doc.fillColor('#FFFFFF').fontSize(7.5)
    let x = left + 2
    for (const c of cols) {
      doc.text(c.header, x, y + 4, { width: c.width })
      x += c.width
    }
    doc.y = y + 17
  }
  encabezado()

  for (const fila of data ?? []) {
    if (doc.y > doc.page.height - 30) {
      doc.addPage()
      encabezado()
    }
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

  dibujarPieOficialEnTodasLasPaginas(doc)
  doc.end()

  const buffer = await listo
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="Programa_de_Auditorias.pdf"',
    },
  })
}
