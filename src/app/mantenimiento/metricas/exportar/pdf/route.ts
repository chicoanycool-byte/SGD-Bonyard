import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { dibujarEncabezadoOficial, dibujarPieOficialEnTodasLasPaginas } from '@/lib/pdf/plantillaOficial'

const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function pct(real: number, prog: number) {
  return prog > 0 ? (real / prog) * 100 : null
}

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const anio = Number(request.nextUrl.searchParams.get('anio') ?? new Date().getFullYear())

  const supabase = await createClient()

  const { data: catalogo } = await supabase
    .from('mantenimiento_catalogo')
    .select('id, nave, nombre, orden')
    .eq('tipo', 'mantenimiento')
    .order('nave')
    .order('orden')

  const ids = (catalogo ?? []).map((c) => c.id)
  const { data: mensual } = ids.length
    ? await supabase.from('mantenimiento_mensual').select('item_id, mes, programado, realizado').in('item_id', ids).eq('anio', anio)
    : { data: [] }

  const { data: registrosLimpieza } = await supabase
    .from('limpieza_checklist_registros')
    .select('nave, fecha, respuestas:limpieza_checklist_respuestas(cumple)')
    .gte('fecha', `${anio}-01-01`)
    .lte('fecha', `${anio}-12-31`)

  const naves = [...new Set((catalogo ?? []).map((c) => c.nave))].sort()
  const naveIds = new Map<string, Set<string>>()
  for (const it of catalogo ?? []) {
    if (!naveIds.has(it.nave)) naveIds.set(it.nave, new Set())
    naveIds.get(it.nave)!.add(it.id)
  }

  const doc = new PDFDocument({ size: 'A4', margin: 30, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  dibujarEncabezadoOficial(doc, { titulo: `Métricas de Mantenimiento — ${anio}`, codigo: 'FMT-01 / FMT-04', version: '01' })

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right

  doc.fontSize(10).fillColor('#14302B').text('Cumplimiento general por nave (Programa de Mantenimiento)', left, doc.y)
  doc.moveDown(0.3)

  for (const nave of naves) {
    const idsNave = naveIds.get(nave) ?? new Set()
    const filas = (mensual ?? []).filter((m) => idsNave.has(m.item_id))
    const prog = filas.filter((f) => f.programado).length
    const real = filas.filter((f) => f.realizado).length
    const p = pct(real, prog)
    doc.fontSize(8.5).fillColor('#5f5e5a').text(`${nave}: ${real}/${prog} actividades — ${p != null ? p.toFixed(1) + '%' : '—'}`, left, doc.y)
  }

  doc.moveDown(0.8)
  doc.fontSize(10).fillColor('#14302B').text('Cumplimiento por mes', left, doc.y)
  doc.moveDown(0.3)

  const colNave = 60
  const colMes = (right - left - colNave) / 12
  let y = doc.y
  doc.fontSize(6.5).fillColor('#5f5e5a')
  doc.text('Nave', left, y, { width: colNave })
  MESES_LARGO.forEach((m, i) => doc.text(m.slice(0, 3), left + colNave + i * colMes, y, { width: colMes, align: 'center' }))
  doc.moveDown(0.5)

  for (const nave of naves) {
    const idsNave = naveIds.get(nave) ?? new Set()
    y = doc.y
    doc.fontSize(7).fillColor('#14302B').text(nave, left, y, { width: colNave })
    for (let mes = 1; mes <= 12; mes++) {
      const filas = (mensual ?? []).filter((m) => idsNave.has(m.item_id) && m.mes === mes)
      const prog = filas.filter((f) => f.programado).length
      const real = filas.filter((f) => f.realizado).length
      const p = pct(real, prog)
      doc.fillColor(p != null && p >= 90 ? '#3d6b53' : '#a13c33')
      doc.text(p != null ? `${p.toFixed(0)}%` : '—', left + colNave + (mes - 1) * colMes, y, { width: colMes, align: 'center' })
    }
    doc.moveDown(0.5)
  }

  doc.moveDown(0.8)
  doc.fontSize(10).fillColor('#14302B').text('Check List de Limpieza e Integridad de la Nave — resultados del año', left, doc.y)
  doc.moveDown(0.3)

  const porMesLimpieza = new Map<string, { si: number; total: number }>()
  for (const r of registrosLimpieza ?? []) {
    const mes = new Date((r.fecha as string) + 'T00:00:00').getMonth() + 1
    const key = `${r.nave}-${mes}`
    const respuestas = (r.respuestas ?? []) as { cumple: string }[]
    const evaluables = respuestas.filter((x) => x.cumple !== 'NA')
    const si = respuestas.filter((x) => x.cumple === 'SI').length
    const actual = porMesLimpieza.get(key) ?? { si: 0, total: 0 }
    actual.si += si
    actual.total += evaluables.length
    porMesLimpieza.set(key, actual)
  }

  if ((registrosLimpieza ?? []).length === 0) {
    doc.fontSize(8).fillColor('#5f5e5a').text('Sin checklists de limpieza capturados en este año.', left, doc.y)
  } else {
    for (const nave of naves) {
      y = doc.y
      doc.fontSize(7).fillColor('#14302B').text(nave, left, y, { width: colNave })
      for (let mes = 1; mes <= 12; mes++) {
        const d = porMesLimpieza.get(`${nave}-${mes}`)
        const p = d && d.total > 0 ? (d.si / d.total) * 100 : null
        doc.fillColor(p != null && p >= 85 ? '#3d6b53' : '#a13c33')
        doc.text(p != null ? `${p.toFixed(0)}%` : '—', left + colNave + (mes - 1) * colMes, y, { width: colMes, align: 'center' })
      }
      doc.moveDown(0.5)
    }
  }

  dibujarPieOficialEnTodasLasPaginas(doc)
  doc.end()

  const buffer = await listo
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="metricas-mantenimiento-${anio}.pdf"`,
    },
  })
}
