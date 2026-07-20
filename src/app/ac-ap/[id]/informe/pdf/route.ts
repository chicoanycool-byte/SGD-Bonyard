import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

type Medida = { accion: string; responsable: string; fecha: string; seguimiento: string }
type PlanItem = {
  actividad: string
  responsable: string
  fecha_termino: string
  resultado_esperado: string
  verificacion_eficacia: string
}

const CATEGORIAS_CAUSA: { clave: string; label: string }[] = [
  { clave: 'metodo', label: 'Método' },
  { clave: 'mano_obra', label: 'Mano de obra' },
  { clave: 'maquinaria', label: 'Maquinaria' },
  { clave: 'materiales', label: 'Materiales' },
  { clave: 'medio_ambiente', label: 'Medio ambiente' },
  { clave: 'otro', label: 'Otro' },
]

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requerirUsuario()
  const supabase = await createClient()

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select(
      'folio, descripcion, origen, tipo_accion, creado_en, definicion_problema, equipo_lider, equipo_miembros, medidas_contencion, analisis_causas, causa_raiz, plan_trabajo, evidencia_cierre, responsable:usuarios!acciones_correctivas_responsable_id_fkey(nombre)'
    )
    .eq('id', id)
    .single()

  if (!accion) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  const medidas = (accion.medidas_contencion ?? []) as Medida[]
  const plan = (accion.plan_trabajo ?? []) as PlanItem[]
  const causas = (accion.analisis_causas ?? {}) as Record<string, { texto: string; impacto: string }>
  const responsable = accion.responsable as unknown as { nombre: string } | null

  const doc = new PDFDocument({ size: 'A4', margin: 40 })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const listo = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  doc.fontSize(15).fillColor('#08495C').text('REGISTRO DE ACCIÓN CORRECTIVA', { align: 'center' })
  doc.fontSize(11).fillColor('#666').text(`FSG-09  ·  No. ${accion.folio ?? ''}`, { align: 'center' })
  doc.moveDown(1)

  function seccion(titulo: string) {
    doc.fontSize(11).fillColor('#08495C').text(titulo, { underline: false })
    doc.moveDown(0.3)
    doc.fillColor('#222').fontSize(9.5)
  }

  function campo(label: string, valor: string) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#555').text(label)
    doc.font('Helvetica').fontSize(9.5).fillColor('#222').text(valor || '—')
    doc.moveDown(0.5)
  }

  seccion('DATOS GENERALES')
  campo('Origen', String(accion.origen ?? ''))
  campo('Tipo de acción', String(accion.tipo_accion ?? ''))
  campo('Fecha', accion.creado_en ? new Date(accion.creado_en).toLocaleDateString('es-MX') : '')

  seccion('DEFINICIÓN DEL PROBLEMA')
  campo('Definición', accion.definicion_problema || accion.descripcion || '')

  seccion('EQUIPO DE MEJORA')
  campo('Líder del equipo', accion.equipo_lider || responsable?.nombre || '')
  campo('Miembros del equipo', accion.equipo_miembros || '')

  seccion('MEDIDAS DE CONTENCIÓN / CORRECCIÓN')
  if (medidas.length === 0) {
    doc.fontSize(9.5).fillColor('#888').text('Sin medidas capturadas.')
  } else {
    medidas.forEach((m, i) => {
      campo(`${i + 1}. ${m.accion || '—'}`, `Responsable: ${m.responsable || '—'}  ·  Fecha: ${m.fecha || '—'}  ·  Seguimiento: ${m.seguimiento || '—'}`)
    })
  }
  doc.moveDown(0.3)

  seccion('ANÁLISIS CAUSA - EFECTO')
  for (const { clave, label } of CATEGORIAS_CAUSA) {
    const c = causas[clave]
    if (c?.texto || c?.impacto) {
      campo(`${label} (impacto: ${c?.impacto || '—'})`, c?.texto || '—')
    }
  }

  seccion('CAUSA RAÍZ')
  doc.fontSize(9.5).fillColor('#222').text(accion.causa_raiz || '—')
  doc.moveDown(0.5)

  seccion('PLAN DE TRABAJO (ACCIÓN CORRECTIVA PERMANENTE)')
  if (plan.length === 0) {
    doc.fontSize(9.5).fillColor('#888').text('Sin plan de trabajo capturado.')
  } else {
    plan.forEach((p, i) => {
      campo(
        `${i + 1}. ${p.actividad || '—'}`,
        `Responsable: ${p.responsable || '—'}  ·  Término: ${p.fecha_termino || '—'}  ·  Resultado esperado: ${p.resultado_esperado || '—'}  ·  Verificación: ${p.verificacion_eficacia || '—'}`
      )
    })
  }

  seccion('EVIDENCIA DE CIERRE')
  doc.fontSize(9.5).fillColor('#222').text(accion.evidencia_cierre || '—')

  doc.end()
  const buffer = await listo
  const nombreArchivo = `FSG-09_Accion_Correctiva_${accion.folio ?? id}.pdf`.replace(/\//g, '-')

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    },
  })
}
