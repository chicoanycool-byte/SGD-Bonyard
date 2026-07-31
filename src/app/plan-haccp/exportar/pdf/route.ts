import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { dibujarEncabezadoOficial, dibujarPieOficialEnTodasLasPaginas } from '@/lib/pdf/plantillaOficial'

function txt(v: unknown) {
  return v != null ? String(v) : ''
}

type Col = { header: string; width: number; get: (r: Record<string, unknown>) => string }

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const [{ data: equipo }, { data: procesos }, { data: productos }, { data: plan }] = await Promise.all([
    supabase.from('haccp_equipo').select('*').order('nave').order('rol_equipo'),
    supabase.from('haccp_analisis_procesos').select('*').order('nave').order('area').order('orden'),
    supabase.from('haccp_analisis_productos').select('*').order('nave').order('categoria').order('orden'),
    supabase.from('haccp_plan').select('*').order('nave').order('orden'),
  ])

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 26, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right

  function tabla(titulo: string, codigo: string, filas: Record<string, unknown>[], cols: Col[]) {
    dibujarEncabezadoOficial(doc, { titulo, codigo, version: '01' })

    function encabezado() {
      const y = doc.y
      doc.rect(left, y, right - left, 15).fill('#14302B')
      doc.fillColor('#FFFFFF').fontSize(7)
      let x = left + 2
      for (const c of cols) {
        doc.text(c.header, x, y + 4, { width: c.width })
        x += c.width
      }
      doc.y = y + 17
    }
    encabezado()

    for (const fila of filas) {
      if (doc.y > doc.page.height - 30) {
        doc.addPage()
        encabezado()
      }
      const y = doc.y
      let x = left + 2
      doc.fontSize(6.5).fillColor('#14302B')
      let alturaMax = 10
      for (const c of cols) {
        const valor = c.get(fila)
        doc.text(valor, x, y, { width: c.width - 2 })
        const alto = doc.heightOfString(valor, { width: c.width - 2 })
        if (alto > alturaMax) alturaMax = alto
        x += c.width
      }
      doc.y = y + alturaMax + 3
      doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#e8e8e2').lineWidth(0.5).stroke()
      doc.y += 1
    }
  }

  tabla('Equipo HACCP', 'FSG-29', equipo ?? [], [
    { header: 'Nave', width: 55, get: (r) => txt(r.nave) },
    { header: 'Nombre', width: 130, get: (r) => txt(r.nombre) },
    { header: 'Puesto', width: 110, get: (r) => txt(r.puesto) },
    { header: 'Rol', width: 60, get: (r) => txt(r.rol_equipo) },
    { header: 'Escolaridad', width: 80, get: (r) => txt(r.escolaridad) },
    { header: 'Conocimientos', width: 200, get: (r) => txt(r.conocimientos) },
    { header: 'Experiencia', width: 200, get: (r) => txt(r.experiencia) },
  ])

  doc.addPage()
  tabla('Análisis de Peligros de Procesos', 'FSG-49', procesos ?? [], [
    { header: 'Nave', width: 40, get: (r) => txt(r.nave) },
    { header: 'Área', width: 55, get: (r) => txt(r.area) },
    { header: 'Etapa', width: 90, get: (r) => txt(r.etapa_proceso) },
    { header: 'Actividad', width: 90, get: (r) => txt(r.actividad) },
    { header: 'Tipo', width: 45, get: (r) => txt(r.tipo_peligro) },
    { header: 'Peligro', width: 140, get: (r) => txt(r.peligro) },
    { header: 'S·P·R', width: 40, get: (r) => `${txt(r.severidad)}·${txt(r.probabilidad)}·${txt(r.riesgo)}` },
    { header: 'Nivel', width: 55, get: (r) => txt(r.nivel_riesgo) },
    { header: 'Medidas de control', width: 160, get: (r) => txt(r.medidas_control) },
    { header: 'PCC', width: 40, get: (r) => txt(r.pcc) },
  ])

  doc.addPage()
  tabla('Análisis de Peligros de Productos', 'FSG-50', productos ?? [], [
    { header: 'Nave', width: 40, get: (r) => txt(r.nave) },
    { header: 'Categoría', width: 90, get: (r) => txt(r.categoria) },
    { header: 'Producto', width: 140, get: (r) => txt(r.producto) },
    { header: 'Tipo', width: 45, get: (r) => txt(r.tipo_peligro) },
    { header: 'Peligro', width: 150, get: (r) => txt(r.peligro) },
    { header: 'S·P·R', width: 40, get: (r) => `${txt(r.severidad)}·${txt(r.probabilidad)}·${txt(r.riesgo)}` },
    { header: 'Nivel', width: 55, get: (r) => txt(r.nivel_riesgo) },
    { header: 'Medidas de control', width: 170, get: (r) => txt(r.medidas_control) },
    { header: 'PCC', width: 40, get: (r) => txt(r.pcc) },
  ])

  doc.addPage()
  tabla('Plan HACCP', 'FSG-51', plan ?? [], [
    { header: 'Nave', width: 40, get: (r) => txt(r.nave) },
    { header: 'Proceso', width: 100, get: (r) => txt(r.proceso) },
    { header: 'Etapa / Material', width: 100, get: (r) => txt(r.etapa_material) },
    { header: 'PCC', width: 40, get: (r) => txt(r.pcc) },
    { header: 'Descripción del peligro', width: 150, get: (r) => txt(r.descripcion_peligro) },
    { header: 'Límites críticos', width: 130, get: (r) => txt(r.limites_criticos) },
    { header: 'Frecuencia', width: 100, get: (r) => txt(r.frecuencia) },
    { header: 'Responsable', width: 90, get: (r) => txt(r.responsable_monitoreo) },
  ])

  dibujarPieOficialEnTodasLasPaginas(doc)
  doc.end()

  const buffer = await listo
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="Plan_HACCP_Completo.pdf"',
    },
  })
}
