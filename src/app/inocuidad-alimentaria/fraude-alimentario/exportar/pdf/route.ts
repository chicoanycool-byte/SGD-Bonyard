import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { dibujarEncabezadoOficial, dibujarPieOficialEnTodasLasPaginas } from '@/lib/pdf/plantillaOficial'

function txt(v: unknown) {
  return v != null ? String(v) : ''
}

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const sp = request.nextUrl.searchParams
  const tipo = sp.get('tipo') ?? 'vulnerabilidad'
  const supabase = await createClient()

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 24, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right

  function tabla(cols: { header: string; width: number; get: (r: Record<string, unknown>) => string }[], filas: Record<string, unknown>[]) {
    function encabezado() {
      const y = doc.y
      doc.rect(left, y, right - left, 14).fill('#14302B')
      doc.fillColor('#FFFFFF').fontSize(7)
      let x = left + 2
      for (const c of cols) {
        doc.text(c.header, x, y + 4, { width: c.width })
        x += c.width
      }
      doc.y = y + 16
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

  if (tipo === 'vulnerabilidad') {
    const nave = sp.get('nave') ?? 'Nave 1'
    const { data } = await supabase.from('fraude_vulnerabilidad_procesos').select('*').eq('nave', nave).order('orden')
    dibujarEncabezadoOficial(doc, { titulo: `Evaluación de Vulnerabilidades en los Procesos — ${nave}`, codigo: 'FSG-33', version: '01' })
    tabla(
      [
        { header: 'Área', width: 60, get: (r) => txt(r.area) },
        { header: 'Proceso', width: 130, get: (r) => txt(r.proceso) },
        { header: 'Tipos de fraude aplicables', width: 220, get: (r) =>
          ['dilucion','sustitucion','ocultamiento','mejoras_no_aprobadas','mercado_negro','mal_etiquetado','falsificacion']
            .map((k) => (r[k] === 'X' ? k : null)).filter(Boolean).join(', ') },
        { header: 'Vuln.', width: 30, get: (r) => txt(r.vulnerabilidad) },
        { header: 'Sev.', width: 30, get: (r) => txt(r.severidad) },
        { header: 'Prob.', width: 30, get: (r) => txt(r.probabilidad) },
        { header: 'Suma', width: 30, get: (r) => txt(r.sumatoria) },
        { header: 'Nivel', width: 70, get: (r) => txt(r.nivel_riesgo) },
        { header: 'Medidas de control', width: 200, get: (r) => txt(r.medidas_control) },
      ],
      data ?? []
    )
  } else if (tipo === 'productos') {
    const { data } = await supabase.from('fraude_analisis_productos').select('*').order('orden')
    dibujarEncabezadoOficial(doc, { titulo: 'Análisis de Productos para la Prevención de Fraude Alimentario', codigo: 'FSG-32', version: '01' })
    tabla(
      [
        { header: 'Producto', width: 130, get: (r) => txt(r.producto) },
        { header: 'Proveedor', width: 130, get: (r) => txt(r.proveedor) },
        { header: 'Cliente', width: 130, get: (r) => txt(r.cliente) },
        { header: 'Origen', width: 60, get: (r) => txt(r.origen_materia_prima) },
        { header: 'Costo/Disp.', width: 45, get: (r) => txt(r.costo_disponibilidad) },
        { header: 'País/Dist.', width: 45, get: (r) => txt(r.pais_origen_distancia) },
        { header: 'Prov. cert.', width: 45, get: (r) => txt(r.proveedor_certificado) },
        { header: 'Identidad', width: 45, get: (r) => txt(r.identidad_preservada) },
        { header: 'Severidad', width: 45, get: (r) => txt(r.severidad_fraude) },
        { header: 'Nivel riesgo', width: 55, get: (r) => txt(r.nivel_riesgo) },
        { header: 'Medida de control', width: 150, get: (r) => txt(r.medida_control) },
      ],
      data ?? []
    )
  } else {
    const { data } = await supabase.from('fraude_plan_mitigacion').select('*').order('orden')
    dibujarEncabezadoOficial(doc, { titulo: 'Plan de Mitigación de Fraude Alimentario', codigo: 'FSG-34', version: '01' })
    tabla(
      [
        { header: 'Tipo de fraude', width: 120, get: (r) => txt(r.tipo_fraude) },
        { header: 'Medida', width: 300, get: (r) => txt(r.medida) },
        { header: 'Responsable', width: 130, get: (r) => txt(r.responsable) },
        { header: 'Frecuencia', width: 150, get: (r) => txt(r.frecuencia) },
        { header: 'Acción correctiva', width: 250, get: (r) => txt(r.accion_correctiva) },
      ],
      data ?? []
    )
  }

  dibujarPieOficialEnTodasLasPaginas(doc)
  doc.end()

  const buffer = await listo
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Fraude_Alimentario_${tipo}.pdf"`,
    },
  })
}
