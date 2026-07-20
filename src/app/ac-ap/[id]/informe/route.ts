import { NextRequest, NextResponse } from 'next/server'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  VerticalAlign,
  ShadingType,
  BorderStyle,
} from 'docx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

const BORDE = {
  top: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
  left: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
  right: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
}

function celdaEtiqueta(texto: string) {
  return new TableCell({
    borders: BORDE,
    shading: { type: ShadingType.SOLID, color: '08495C', fill: '08495C' },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [new TextRun({ text: texto, bold: true, color: 'FFFFFF', size: 18 })],
      }),
    ],
  })
}

function celdaTexto(texto: string) {
  return new TableCell({
    borders: BORDE,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text: texto || '—', size: 18 })] })],
  })
}

function tituloSeccion(texto: string) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: texto, bold: true, size: 20, color: '08495C' })],
  })
}

type Medida = { accion: string; responsable: string; fecha: string; seguimiento: string }
type PlanItem = {
  actividad: string
  responsable: string
  fecha_termino: string
  seguimiento: string
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
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requerirUsuario()
  const supabase = await createClient()

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .select(
      'folio, descripcion, origen, tipo_accion, creado_en, definicion_problema, equipo_lider, equipo_miembros, medidas_contencion, analisis_causas, causa_raiz, plan_trabajo, responsable:usuarios!acciones_correctivas_responsable_id_fkey(nombre)'
    )
    .eq('id', id)
    .single()

  if (!accion) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  const medidas = (accion.medidas_contencion ?? []) as Medida[]
  const plan = (accion.plan_trabajo ?? []) as PlanItem[]
  const causas = (accion.analisis_causas ?? {}) as Record<
    string,
    { texto: string; impacto: string }
  >
  const responsable = accion.responsable as unknown as { nombre: string } | null

  const encabezado = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: BORDE,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'REGISTRO DE ACCIÓN CORRECTIVA', bold: true, size: 24 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: BORDE,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'FSG-09', bold: true, size: 20 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'VERSIÓN: 01', size: 16 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `No. ${accion.folio ?? ''}`, size: 16 })] }),
            ],
          }),
        ],
      }),
    ],
  })

  const tablaOrigen = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [celdaEtiqueta('Origen de la no conformidad'), celdaEtiqueta('Fecha'), celdaEtiqueta('Tipo')] }),
      new TableRow({
        children: [
          celdaTexto(String(accion.origen ?? '')),
          celdaTexto(accion.creado_en ? new Date(accion.creado_en as string).toLocaleDateString('es-MX') : ''),
          celdaTexto(String(accion.tipo_accion ?? '')),
        ],
      }),
    ],
  })

  const tablaEquipo = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [celdaEtiqueta('Líder del equipo'), celdaEtiqueta('Miembros del equipo')] }),
      new TableRow({
        children: [
          celdaTexto(accion.equipo_lider ?? responsable?.nombre ?? ''),
          celdaTexto(accion.equipo_miembros ?? ''),
        ],
      }),
    ],
  })

  const tablaMedidas = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          celdaEtiqueta('No.'),
          celdaEtiqueta('Acción'),
          celdaEtiqueta('Responsable'),
          celdaEtiqueta('Fecha'),
          celdaEtiqueta('Seguimiento y cierre'),
        ],
      }),
      ...(medidas.length > 0
        ? medidas.map(
            (m, i) =>
              new TableRow({
                children: [
                  celdaTexto(String(i + 1)),
                  celdaTexto(m.accion),
                  celdaTexto(m.responsable),
                  celdaTexto(m.fecha),
                  celdaTexto(m.seguimiento),
                ],
              })
          )
        : [new TableRow({ children: [celdaTexto('—'), celdaTexto(''), celdaTexto(''), celdaTexto(''), celdaTexto('')] })]),
    ],
  })

  const tablaCausas = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [celdaEtiqueta('Categoría'), celdaEtiqueta('Causa'), celdaEtiqueta('Impacto')] }),
      ...CATEGORIAS_CAUSA.map(
        ({ clave, label }) =>
          new TableRow({
            children: [
              celdaTexto(label),
              celdaTexto(causas[clave]?.texto ?? ''),
              celdaTexto(causas[clave]?.impacto ?? ''),
            ],
          })
      ),
    ],
  })

  const tablaPlan = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          celdaEtiqueta('No.'),
          celdaEtiqueta('Actividad (acción correctiva permanente)'),
          celdaEtiqueta('Responsable'),
          celdaEtiqueta('Fecha término'),
          celdaEtiqueta('Resultado esperado'),
          celdaEtiqueta('Verificación de eficacia'),
        ],
      }),
      ...(plan.length > 0
        ? plan.map(
            (p, i) =>
              new TableRow({
                children: [
                  celdaTexto(String(i + 1)),
                  celdaTexto(p.actividad),
                  celdaTexto(p.responsable),
                  celdaTexto(p.fecha_termino),
                  celdaTexto(p.resultado_esperado),
                  celdaTexto(p.verificacion_eficacia),
                ],
              })
          )
        : [
            new TableRow({
              children: [celdaTexto('—'), celdaTexto(''), celdaTexto(''), celdaTexto(''), celdaTexto(''), celdaTexto('')],
            }),
          ]),
    ],
  })

  const doc = new Document({
    sections: [
      {
        children: [
          encabezado,
          new Paragraph({ text: '' }),
          tablaOrigen,
          new Paragraph({ text: '' }),
          tituloSeccion('DEFINICIÓN DEL PROBLEMA'),
          new Paragraph({ children: [new TextRun({ text: accion.definicion_problema || accion.descripcion || '', size: 18 })] }),
          new Paragraph({ text: '' }),
          tituloSeccion('EQUIPO DE MEJORA'),
          tablaEquipo,
          new Paragraph({ text: '' }),
          tituloSeccion('MEDIDAS DE CONTENCIÓN / CORRECCIÓN'),
          tablaMedidas,
          new Paragraph({ text: '' }),
          tituloSeccion('ANÁLISIS CAUSA - EFECTO'),
          tablaCausas,
          new Paragraph({ text: '' }),
          tituloSeccion('CAUSAS RAÍZ'),
          new Paragraph({ children: [new TextRun({ text: accion.causa_raiz || '', size: 18 })] }),
          new Paragraph({ text: '' }),
          tituloSeccion('PLAN DE TRABAJO'),
          tablaPlan,
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const nombreArchivo = `FSG-09_Registro_Accion_Correctiva_${accion.folio ?? id}.docx`.replace(/\//g, '-')

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    },
  })
}
