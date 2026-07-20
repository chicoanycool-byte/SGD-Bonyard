import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ImageRun,
  WidthType,
  AlignmentType,
  VerticalAlign,
  ShadingType,
  BorderStyle,
} from 'docx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

const NORMA_LABEL: Record<string, string> = {
  iso_9001: 'ISO 9001:2015',
  sqf: 'SQF',
  ambas: 'ISO 9001:2015 + SQF',
}

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

function celdaTexto(texto: string, opciones: { negrita?: boolean; centrado?: boolean } = {}) {
  return new TableCell({
    borders: BORDE,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: opciones.centrado ? AlignmentType.CENTER : undefined,
        children: [
          new TextRun({ text: texto || '—', bold: opciones.negrita, size: 18 }),
        ],
      }),
    ],
  })
}

function seccionSimple(titulo: string, contenido: string) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [celdaEtiqueta(titulo)] }),
      new TableRow({ children: [celdaTexto(contenido)] }),
    ],
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requerirUsuario()
  const supabase = await createClient()

  const { data: auditoria } = await supabase
    .from('auditorias')
    .select(
      'fecha, norma, tipo, proceso, alcance, objetivo, observaciones, informe_resumen, informe_conclusiones, auditor_lider:usuarios!auditorias_auditor_lider_id_fkey(nombre), auditor_auxiliar:usuarios!auditorias_auditor_auxiliar_id_fkey(nombre), auditado:usuarios!auditorias_auditado_id_fkey(nombre)'
    )
    .eq('id', id)
    .single()

  if (!auditoria) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  const { data: hallazgos } = await supabase
    .from('auditoria_hallazgos')
    .select('requisito, evidencia, conformidad, tipo_nc, comentario')
    .eq('auditoria_id', id)
    .order('orden')

  const lider = auditoria.auditor_lider as unknown as { nombre: string } | null
  const auxiliar = auditoria.auditor_auxiliar as unknown as { nombre: string } | null
  const auditado = auditoria.auditado as unknown as { nombre: string } | null

  const noConformidades = (hallazgos ?? []).filter((h) => h.conformidad === 'no_conforme')
  const oportunidades = (hallazgos ?? []).filter((h) => h.conformidad === 'oportunidad_mejora')

  let logoBuffer: Buffer | null = null
  try {
    logoBuffer = await fs.readFile(path.join(process.cwd(), 'public', 'logo-bonyard.png'))
  } catch {
    logoBuffer = null
  }

  const encabezado = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            borders: BORDE,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: logoBuffer
                  ? [
                      new ImageRun({
                        data: logoBuffer,
                        transformation: { width: 90, height: 30 },
                        type: 'png',
                      }),
                    ]
                  : [new TextRun({ text: 'BON YARD', bold: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders: BORDE,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'INFORME DE AUDITORIA', bold: true, size: 24 }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders: BORDE,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'FSG-58', bold: true, size: 20 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'VERSIÓN: 01', size: 16 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `FECHA: ${new Date().toLocaleDateString('es-MX')}`,
                    size: 16,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })

  const tablaHallazgos = (
    lista: typeof noConformidades,
    conMayorMenor: boolean
  ) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            celdaEtiqueta('No.'),
            celdaEtiqueta('Norma'),
            celdaEtiqueta('Requisito'),
            celdaEtiqueta(conMayorMenor ? 'Descripción de la no conformidad' : 'Descripción'),
            ...(conMayorMenor ? [celdaEtiqueta('Mayor / Menor / Crítica')] : []),
          ],
        }),
        ...(lista.length > 0
          ? lista.map(
              (h, i) =>
                new TableRow({
                  children: [
                    celdaTexto(String(i + 1), { centrado: true }),
                    celdaTexto(NORMA_LABEL[auditoria.norma] ?? auditoria.norma),
                    celdaTexto(h.requisito),
                    celdaTexto(h.evidencia ?? h.comentario ?? ''),
                    ...(conMayorMenor ? [celdaTexto(h.tipo_nc ?? '', { centrado: true })] : []),
                  ],
                })
            )
          : [
              new TableRow({
                children: [
                  celdaTexto('—', { centrado: true }),
                  celdaTexto(''),
                  celdaTexto('Sin hallazgos en esta categoría'),
                  celdaTexto(''),
                  ...(conMayorMenor ? [celdaTexto('')] : []),
                ],
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
          seccionSimple('FECHA DE LA AUDITORÍA', new Date(auditoria.fecha + 'T00:00:00').toLocaleDateString('es-MX')),
          new Paragraph({ text: '' }),
          seccionSimple('PROCESO AUDITADO', auditoria.proceso ?? ''),
          new Paragraph({ text: '' }),
          seccionSimple('ALCANCE DE LA AUDITORIA', auditoria.alcance ?? `Auditoría ${auditoria.tipo} bajo la norma ${NORMA_LABEL[auditoria.norma]}.`),
          new Paragraph({ text: '' }),
          seccionSimple('OBJETIVO DE LA AUDITORIA', auditoria.objetivo ?? 'Verificar el cumplimiento de los requisitos del sistema de gestión.'),
          new Paragraph({ text: '' }),
          seccionSimple(
            'AUDITOR LÍDER / AUDITORES / OBSERVADORES',
            `Líder: ${lider?.nombre ?? 'N/A'}  ·  Auxiliar: ${auxiliar?.nombre ?? 'N/A'}  ·  Auditado: ${auditado?.nombre ?? 'N/A'}`
          ),
          new Paragraph({ text: '' }),
          seccionSimple('RESUMEN DE LA AUDITORIA', auditoria.informe_resumen ?? ''),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [new TextRun({ text: 'NO CONFORMIDADES', bold: true, size: 20 })],
          }),
          tablaHallazgos(noConformidades, true),
          new Paragraph({ text: '' }),
          seccionSimple('OBSERVACIONES', auditoria.observaciones ?? ''),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [new TextRun({ text: 'OPORTUNIDADES DE MEJORA', bold: true, size: 20 })],
          }),
          tablaHallazgos(oportunidades, false),
          new Paragraph({ text: '' }),
          seccionSimple('CONCLUSIONES', auditoria.informe_conclusiones ?? ''),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  celdaEtiqueta('Elaboró'),
                  celdaEtiqueta('Revisó'),
                  celdaEtiqueta('Página'),
                ],
              }),
              new TableRow({
                children: [
                  celdaTexto('Sistema SGD Bonyard (IA)'),
                  celdaTexto(lider?.nombre ?? 'Líder del SGI'),
                  celdaTexto('1 de 1', { centrado: true }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  const nombreArchivo = `FSG-58_Informe_Auditoria_${auditoria.fecha}.docx`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    },
  })
}
