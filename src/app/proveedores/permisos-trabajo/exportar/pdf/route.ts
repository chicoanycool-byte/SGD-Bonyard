import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { dibujarEncabezadoOficial, dibujarPieOficialEnTodasLasPaginas } from '@/lib/pdf/plantillaOficial'

type Vehiculo = { marca: string; modelo: string; placas: string }
type Persona = { nombre: string; nss: string }
type Protocolo = { protocolo: string; seleccionado: boolean; descripcion: string }

const SINO = (v: boolean | null) => (v === true ? 'Sí' : v === false ? 'No' : '—')

export async function GET(request: NextRequest) {
  await requerirUsuario()
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

  const supabase = await createClient()
  const { data: p } = await supabase.from('permisos_trabajo').select('*').eq('id', id).single()
  if (!p) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const doc = new PDFDocument({ size: 'A4', margin: 30, bufferPages: true })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  dibujarEncabezadoOficial(doc, { titulo: 'Permiso de Trabajo', codigo: 'FSG-25', version: '02' })

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const anchoTotal = right - left

  function seccion(titulo: string) {
    if (doc.y > doc.page.height - 60) doc.addPage()
    doc.moveDown(0.4)
    doc.rect(left, doc.y, anchoTotal, 13).fill('#14302B')
    doc.fillColor('#FFFFFF').fontSize(8).text(titulo, left + 4, doc.y - 10)
    doc.moveDown(0.5)
    doc.fillColor('#14302B')
  }

  function campo(label: string, valor: string) {
    doc.fontSize(8).fillColor('#5f5e5a').text(`${label}: `, { continued: true }).fillColor('#14302B').text(valor || '—')
  }

  seccion('Datos de proveedor')
  campo('Nombre empresa', p.nombre_empresa)
  campo('Razón social', p.razon_social ?? '')
  campo('Fecha', p.fecha ? new Date(p.fecha as string).toLocaleDateString('es-MX') : '')
  campo('Vigencia', p.vigencia ? new Date(p.vigencia as string).toLocaleDateString('es-MX') : '')
  campo('Tipo de ingreso', p.tipo_ingreso ?? '')
  campo('Se identifica con', p.identificacion ?? '')
  campo('EPP', [p.epp_casco && 'Casco', p.epp_chaleco && 'Chaleco', p.epp_botas && 'Botas'].filter(Boolean).join(', '))

  const vehiculos = (p.vehiculos ?? []) as Vehiculo[]
  if (vehiculos.length > 0) {
    seccion('Datos del vehículo a ingresar')
    for (const v of vehiculos) campo('Vehículo', `${v.marca} — ${v.modelo} — Placas: ${v.placas}`)
  }

  const personal = (p.personal ?? []) as Persona[]
  if (personal.length > 0) {
    seccion('Datos de personal a ingresar')
    for (const x of personal) campo('Persona', `${x.nombre} — NSS: ${x.nss}`)
  }

  seccion('Datos del mantenimiento')
  campo('Tipo de mantenimiento', p.tipo_mantenimiento ?? '')
  campo('Solicitante Bonyard', p.solicitante_bonyard ?? '')
  doc.fontSize(8).fillColor('#5f5e5a').text('Descripción del trabajo a realizar:')
  doc.fontSize(8).fillColor('#14302B').text(p.descripcion_trabajo ?? '—')
  campo('Hojas de seguridad anexas', p.hojas_seguridad_anexas ?? '')
  doc.fontSize(8).fillColor('#5f5e5a').text('Herramientas y equipo de trabajo:')
  doc.fontSize(8).fillColor('#14302B').text(p.herramientas_equipo ?? '—')

  seccion('Evaluación de riesgos ambientales / seguridad')
  campo('Emisiones al aire', SINO(p.emisiones_aire as boolean | null) + (p.emisiones_aire_detalle ? ` — ${p.emisiones_aire_detalle}` : ''))
  campo('Descargas de agua', SINO(p.descargas_agua as boolean | null) + (p.descargas_agua_detalle ? ` — ${p.descargas_agua_detalle}` : ''))
  campo('Trabajo en alturas', SINO(p.trabajo_alturas as boolean | null) + (p.trabajo_alturas_detalle ? ` — ${p.trabajo_alturas_detalle}` : ''))
  campo('Trabajos confinados', SINO(p.trabajos_confinados as boolean | null) + (p.trabajos_confinados_detalle ? ` — ${p.trabajos_confinados_detalle}` : ''))
  campo('Soldadura / fuentes de calor', SINO(p.soldadura_calor as boolean | null) + (p.soldadura_calor_detalle ? ` — ${p.soldadura_calor_detalle}` : ''))
  campo('Generación de desperdicios', SINO(p.generacion_desperdicios as boolean | null) + (p.desperdicios_detalle ? ` — ${p.desperdicios_detalle}` : ''))
  campo('Desperdicio reciclable', SINO(p.desperdicio_reciclable as boolean | null) + (p.reciclable_detalle ? ` — ${p.reciclable_detalle}` : ''))
  campo('Consume energía', SINO(p.consume_energia as boolean | null) + (p.energia_tipo ? ` — ${p.energia_tipo}` : '') + (p.energia_detalle ? ` — ${p.energia_detalle}` : ''))

  const protocolos = (p.protocolos ?? []) as Protocolo[]
  seccion('Protocolos para evitar la contaminación cruzada')
  if (protocolos.length === 0) {
    doc.fontSize(8).fillColor('#14302B').text('No se seleccionaron protocolos.')
  } else {
    for (const pr of protocolos) {
      doc.fontSize(8).fillColor('#14302B').text(`• ${pr.protocolo}${pr.descripcion ? ` — ${pr.descripcion}` : ''}`)
    }
  }

  if (p.comentarios_adicionales) {
    seccion('Comentarios adicionales')
    doc.fontSize(8).fillColor('#14302B').text(p.comentarios_adicionales as string)
  }

  seccion('Firmas')
  campo('Solicitante', p.firma_solicitante ?? '')
  campo('Seguridad Patrimonial', p.firma_seguridad_patrimonial ?? '')
  campo('Contratista', p.firma_contratista ?? '')
  campo('Coordinador del SGI', p.firma_coordinador_sgi ?? '')
  if (p.firma_solicitante_vobo) {
    campo('Vo.Bo. Solicitante (al término de los trabajos)', p.firma_solicitante_vobo as string)
  }

  dibujarPieOficialEnTodasLasPaginas(doc)
  doc.end()

  const buffer = await listo
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="permiso-trabajo-${p.folio ?? p.id}.pdf"`,
    },
  })
}
