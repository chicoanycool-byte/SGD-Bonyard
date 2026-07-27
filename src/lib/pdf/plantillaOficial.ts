import PDFDocument from 'pdfkit'

/**
 * Encabezado/pie estándar de Bonyard Servicios, replicando el formato
 * de los formatos oficiales (FSG-58, FSG-08, etc.):
 * - Barra superior: "PROCEDIMIENTO CONTROL DE DOCUMENTOS · PR-SGI-001"
 * - Caja de título con código de documento, versión y fecha
 * - Pie de página: Elaboró / Revisó / Página X de Y en cada hoja
 */

export function dibujarEncabezadoOficial(
  doc: PDFKit.PDFDocument,
  opciones: { titulo: string; codigo?: string; version?: string }
) {
  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const anchoTotal = right - left

  // Barra superior gris con la referencia al procedimiento de control de documentos
  doc
    .fontSize(6.5)
    .fillColor('#8a8a85')
    .text('PROCEDIMIENTO CONTROL DE DOCUMENTOS  ·  CÓDIGO: PR-SGI-001  ·  REVISIÓN Nº 6  ·  AGOSTO 2009', left, doc.y, {
      width: anchoTotal,
    })
  doc.moveDown(0.4)

  // Caja de título con código / versión / fecha, como en los formatos oficiales
  const yCaja = doc.y
  const altoCaja = 30
  doc.rect(left, yCaja, anchoTotal, altoCaja).stroke('#c9c9c2')
  const anchoDatos = 150
  doc
    .moveTo(right - anchoDatos, yCaja)
    .lineTo(right - anchoDatos, yCaja + altoCaja)
    .stroke('#c9c9c2')

  doc
    .fontSize(11)
    .fillColor('#14302B')
    .text(opciones.titulo, left + 8, yCaja + 9, { width: anchoTotal - anchoDatos - 16 })

  const fechaHoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  doc
    .fontSize(7.5)
    .fillColor('#5f5e5a')
    .text(`CÓDIGO: ${opciones.codigo ?? '—'}`, right - anchoDatos + 8, yCaja + 5, { width: anchoDatos - 16 })
    .text(`VERSIÓN: ${opciones.version ?? '01'}`, right - anchoDatos + 8, yCaja + 15, { width: anchoDatos - 16 })
    .text(`GENERADO: ${fechaHoy}`, right - anchoDatos + 8, yCaja + 25, { width: anchoDatos - 16 })

  doc.y = yCaja + altoCaja + 10
  doc.fontSize(8).fillColor('#5f5e5a').text('BONYARD Servicios', left, doc.y)
  doc.moveDown(0.6)
}

export function dibujarPieOficialEnTodasLasPaginas(doc: PDFKit.PDFDocument) {
  const rango = doc.bufferedPageRange()
  for (let i = rango.start; i < rango.start + rango.count; i++) {
    doc.switchToPage(i)
    const left = doc.page.margins.left
    const right = doc.page.width - doc.page.margins.right
    const y = doc.page.height - doc.page.margins.bottom + 8

    doc
      .moveTo(left, y - 4)
      .lineTo(right, y - 4)
      .stroke('#e0e0da')

    doc
      .fontSize(7)
      .fillColor('#8a8a85')
      .text('Elaboró: Sistema SGD Bonyard', left, y, { continued: false })
      .text('Revisó: Coordinador del SGI', left + 180, y)
      .text(`Página ${i - rango.start + 1} de ${rango.count}`, right - 100, y, { width: 100, align: 'right' })
  }
}
