import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

function cumpleMeta(operador: string, metaValor: number, valor: number) {
  if (operador === 'gte') return valor >= metaValor
  if (operador === 'lte') return valor <= metaValor
  if (operador === 'lt') return valor < metaValor
  if (operador === 'eq') return valor === metaValor
  return true
}

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()
  const anio = new Date().getFullYear()

  const [{ data: catalogo }, { data: valoresData }] = await Promise.all([
    supabase
      .from('indicadores_catalogo')
      .select(
        'id, numero, proceso, nombre, meta_texto, meta_operador, meta_valor, responsable:usuarios!indicadores_catalogo_responsable_id_fkey(nombre)'
      )
      .order('numero'),
    supabase.from('indicadores_valores').select('indicador_id, mes, valor').eq('anio', anio),
  ])

  const filas = (catalogo ?? []).map((ind) => {
    const valoresInd = (valoresData ?? []).filter((v) => v.indicador_id === ind.id)
    const conDato = valoresInd.filter((v) => v.valor !== null)
    const promedio =
      conDato.length > 0
        ? conDato.reduce((a, b) => a + Number(b.valor), 0) / conDato.length
        : null
    const semaforo =
      promedio === null
        ? 'SIN DATO'
        : cumpleMeta(ind.meta_operador as string, Number(ind.meta_valor), promedio)
          ? 'VERDE'
          : 'ROJO'
    return { ind, promedio, semaforo }
  })

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  doc.fontSize(14).fillColor('#08495C').text('TABLERO DE INDICADORES — FSG-06', { align: 'center' })
  doc.fontSize(9).fillColor('#666').text(`BONYARD Servicios · ${anio}`, { align: 'center' })
  doc.moveDown(1)

  const columnas = [
    { titulo: '#', ancho: 25 },
    { titulo: 'Proceso', ancho: 80 },
    { titulo: 'Indicador', ancho: 240 },
    { titulo: 'Meta', ancho: 60 },
    { titulo: 'Prom. Anual', ancho: 60 },
    { titulo: 'Semáforo', ancho: 60 },
    { titulo: 'Responsable', ancho: 130 },
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

  for (const { ind, promedio, semaforo } of filas) {
    if (y > doc.page.height - 50) {
      doc.addPage()
      y = doc.page.margins.top
      encabezado()
      doc.fontSize(7).fillColor('#222')
    }

    x = doc.page.margins.left
    const valores = [
      String(ind.numero),
      ind.proceso as string,
      ind.nombre as string,
      ind.meta_texto as string,
      promedio !== null ? String(Math.round(promedio * 100) / 100) : '—',
      semaforo,
      (ind.responsable as unknown as { nombre: string } | null)?.nombre ?? '',
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
      'Content-Disposition': `attachment; filename="FSG-06_Tablero_de_Indicadores_${anio}.pdf"`,
    },
  })
}
