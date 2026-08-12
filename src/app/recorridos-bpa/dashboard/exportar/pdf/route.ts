import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { dibujarEncabezadoOficial, dibujarPieOficialEnTodasLasPaginas } from '@/lib/pdf/plantillaOficial'

type Hallazgo = {
  area: string | null
  respuesta: string | null
  estatus: string
  fecha_compromiso: string | null
  fecha_cierre_real: string | null
  recorrido_fecha: string
  nave: string | null
}

function pct(cumple: number, total: number) {
  return total > 0 ? (cumple / total) * 100 : null
}

const COLORES = ['#14302B', '#2296ad', '#9a6b1c', '#6b4fa0', '#a13c33']

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const sp = request.nextUrl.searchParams
  const desde = sp.get('desde') || ''
  const hasta = sp.get('hasta') || ''
  const naveFiltro = sp.get('nave') || ''
  const areaFiltro = sp.get('area') || ''

  const supabase = await createClient()
  const { data } = await supabase
    .from('bpa_respuestas')
    .select(
      'respuesta, estatus, fecha_compromiso, fecha_cierre_real, checklist:bpa_checklist(area), recorrido:bpa_recorridos(fecha, naves_inspeccionadas)'
    )

  const todos: Hallazgo[] = (data ?? []).map((h) => {
    const checklist = h.checklist as unknown as { area: string | null } | null
    const recorrido = h.recorrido as unknown as { fecha: string; naves_inspeccionadas: string | null } | null
    return {
      area: checklist?.area ?? null,
      respuesta: h.respuesta as string | null,
      estatus: h.estatus as string,
      fecha_compromiso: h.fecha_compromiso as string | null,
      fecha_cierre_real: h.fecha_cierre_real as string | null,
      recorrido_fecha: recorrido?.fecha ?? '',
      nave: recorrido?.naves_inspeccionadas ?? null,
    }
  })

  const filtrados = todos.filter((h) => {
    if (desde && h.recorrido_fecha < desde) return false
    if (hasta && h.recorrido_fecha > hasta) return false
    if (naveFiltro && h.nave !== naveFiltro) return false
    if (areaFiltro && h.area !== areaFiltro) return false
    return true
  })

  const evaluables = filtrados.filter((h) => h.respuesta === 'cumple' || h.respuesta === 'no_cumple')
  const cumplen = evaluables.filter((h) => h.respuesta === 'cumple').length
  const cumplimientoGeneral = pct(cumplen, evaluables.length)

  const naves = naveFiltro ? [naveFiltro] : [...new Set(todos.map((h) => h.nave).filter(Boolean) as string[])].sort()
  const sinNave = filtrados.some((h) => !h.nave)
  const gruposNave = [...naves, ...(sinNave && !naveFiltro ? ['Sin nave registrada'] : [])]

  const porNave = gruposNave.map((n) => {
    const grupo = filtrados.filter((h) => (n === 'Sin nave registrada' ? !h.nave : h.nave === n))
    const ev = grupo.filter((h) => h.respuesta === 'cumple' || h.respuesta === 'no_cumple')
    const c = ev.filter((h) => h.respuesta === 'cumple').length
    return { nave: n, total: ev.length, cumplen: c, pct: pct(c, ev.length) }
  })

  const areas = areaFiltro ? [areaFiltro] : [...new Set(filtrados.map((h) => h.area).filter(Boolean) as string[])].sort()
  const porProceso = areas
    .map((a) => {
      const grupo = filtrados.filter((h) => h.area === a)
      const ev = grupo.filter((h) => h.respuesta === 'cumple' || h.respuesta === 'no_cumple')
      const c = ev.filter((h) => h.respuesta === 'cumple').length
      return { area: a, total: ev.length, cumplen: c, pct: pct(c, ev.length) }
    })
    .sort((x, y) => (x.pct ?? 100) - (y.pct ?? 100))

  const mesesMap = new Map<string, { total: number; cumplen: number }>()
  for (const h of filtrados) {
    if (h.respuesta !== 'cumple' && h.respuesta !== 'no_cumple') continue
    if (!h.recorrido_fecha) continue
    const mes = h.recorrido_fecha.slice(0, 7)
    const actual = mesesMap.get(mes) ?? { total: 0, cumplen: 0 }
    actual.total++
    if (h.respuesta === 'cumple') actual.cumplen++
    mesesMap.set(mes, actual)
  }
  const meses = [...mesesMap.keys()].sort()
  const porMesPorNave = meses.map((mes) => {
    const valores: Record<string, number | null> = {}
    for (const n of naves) {
      const grupo = filtrados.filter(
        (h) => h.nave === n && h.recorrido_fecha.slice(0, 7) === mes && (h.respuesta === 'cumple' || h.respuesta === 'no_cumple')
      )
      const c = grupo.filter((h) => h.respuesta === 'cumple').length
      valores[n] = pct(c, grupo.length)
    }
    return { mes, valores }
  })

  const doc = new PDFDocument({ size: 'A4', margin: 30, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  dibujarEncabezadoOficial(doc, {
    titulo: `Reporte de Cumplimiento de BPA${naveFiltro ? ' — ' + naveFiltro : ''}${desde || hasta ? ` (${desde || '…'} a ${hasta || '…'})` : ''}`,
    codigo: 'PBAL-02',
    version: '01',
  })

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right

  doc.fontSize(11).fillColor('#14302B').text(
    `Cumplimiento general: ${cumplimientoGeneral != null ? cumplimientoGeneral.toFixed(1) + '%' : '—'} (${cumplen}/${evaluables.length} puntos evaluados)`,
    left,
    doc.y
  )
  doc.moveDown(0.8)

  function tabla(titulo: string, filas: { label: string; total: number; cumplen: number; pct: number | null }[]) {
    doc.fontSize(10).fillColor('#14302B').text(titulo, left, doc.y)
    doc.moveDown(0.3)
    const colLabel = 220
    const colNum = 80
    let y = doc.y
    doc.rect(left, y, right - left, 14).fill('#14302B')
    doc.fillColor('#FFFFFF').fontSize(7.5)
    doc.text('Nave / Proceso', left + 4, y + 4, { width: colLabel })
    doc.text('Evaluados', left + colLabel, y + 4, { width: colNum })
    doc.text('Cumplen', left + colLabel + colNum, y + 4, { width: colNum })
    doc.text('% Cumplimiento', left + colLabel + colNum * 2, y + 4, { width: colNum })
    doc.y = y + 16

    for (const f of filas) {
      y = doc.y
      doc.fontSize(8).fillColor('#14302B')
      doc.text(f.label, left + 4, y, { width: colLabel })
      doc.text(String(f.total), left + colLabel, y, { width: colNum })
      doc.text(String(f.cumplen), left + colLabel + colNum, y, { width: colNum })
      doc.fillColor(f.pct != null && f.pct >= 90 ? '#3d6b53' : f.pct != null && f.pct >= 75 ? '#9a6b1c' : '#a13c33')
      doc.text(f.pct != null ? `${f.pct.toFixed(1)}%` : '—', left + colLabel + colNum * 2, y, { width: colNum })
      doc.y = y + 13
    }
    doc.moveDown(0.6)
  }

  tabla('Cumplimiento por nave', porNave.map((n) => ({ label: n.nave, total: n.total, cumplen: n.cumplen, pct: n.pct })))
  tabla('Cumplimiento por proceso / área', porProceso.map((p) => ({ label: p.area, total: p.total, cumplen: p.cumplen, pct: p.pct })))

  // Gráfico comparativo por mes
  if (meses.length > 0) {
    if (doc.y > doc.page.height - 220) doc.addPage()
    doc.fontSize(10).fillColor('#14302B').text('Comparativa de cumplimiento por mes', left, doc.y)
    doc.moveDown(0.4)

    const chartTop = doc.y
    const chartH = 140
    const chartW = right - left
    const grupoAncho = chartW / meses.length
    const barraAncho = Math.min(20, (grupoAncho - 10) / Math.max(naves.length, 1))

    // ejes
    ;[0, 25, 50, 75, 100].forEach((v) => {
      const y = chartTop + chartH - (v / 100) * chartH
      doc.moveTo(left, y).lineTo(right, y).strokeColor('#eceee9').lineWidth(0.5).stroke()
      doc.fontSize(6.5).fillColor('#8a8a85').text(`${v}%`, left - 22, y - 3, { width: 20, align: 'right' })
    })

    porMesPorNave.forEach((d, gi) => {
      const gx = left + gi * grupoAncho + (grupoAncho - barraAncho * naves.length) / 2
      naves.forEach((n, ni) => {
        const valor = d.valores[n]
        if (valor == null) return
        const barH = (valor / 100) * chartH
        const x = gx + ni * barraAncho
        const y = chartTop + chartH - barH
        doc.rect(x, y, barraAncho - 1.5, barH).fill(COLORES[ni % COLORES.length])
      })
      doc.fontSize(6.5).fillColor('#8a8a85').text(d.mes, left + gi * grupoAncho, chartTop + chartH + 4, { width: grupoAncho, align: 'center' })
    })

    doc.y = chartTop + chartH + 18
    // leyenda
    let lx = left
    naves.forEach((n, i) => {
      doc.rect(lx, doc.y, 8, 8).fill(COLORES[i % COLORES.length])
      doc.fontSize(7.5).fillColor('#5f5e5a').text(n, lx + 11, doc.y + 0.5)
      lx += 11 + doc.widthOfString(n) + 16
    })
    doc.moveDown(1.2)
  }

  dibujarPieOficialEnTodasLasPaginas(doc)
  doc.end()

  const buffer = await listo
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="Reporte_Cumplimiento_BPA.pdf"',
    },
  })
}
