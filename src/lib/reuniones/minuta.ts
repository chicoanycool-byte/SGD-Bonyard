import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  VerticalAlign,
  BorderStyle,
} from 'docx'
import type { Acuerdo } from './actions'

const BORDE = {
  top: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
  left: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
  right: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
}

function celdaEtiqueta(texto: string) {
  return new TableCell({
    borders: BORDE,
    shading: { type: 'solid' as never, color: '08495C', fill: '08495C' },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [new TextRun({ text: texto, bold: true, color: 'FFFFFF', size: 17 })],
      }),
    ],
  })
}

function celdaTexto(texto: string, ancho?: number) {
  return new TableCell({
    borders: BORDE,
    width: ancho ? { size: ancho, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ children: [new TextRun({ text: texto || '—', size: 17 })] })],
  })
}

function tituloSeccion(texto: string) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: texto, bold: true, size: 20, color: '08495C' })],
  })
}

const TITULOS: Record<string, string> = {
  haccp: 'MINUTA DE LA REUNIÓN DEL EQUIPO HACCP',
  revision_direccion: 'MINUTA DE LA REVISIÓN POR LA DIRECCIÓN',
}

export function generarMinutaDocx(datos: {
  tipo: string
  fecha: string
  hora: string | null
  lugar: string | null
  linkVirtual: string | null
  convocanteNombre: string | null
  invitados: { nombre: string; puesto: string | null }[]
  asistentes: string | null
  agenda: string | null
  desarrollo: string | null
  conclusiones: string | null
  acuerdos: Acuerdo[]
}) {
  const titulo = TITULOS[datos.tipo] ?? 'MINUTA DE REUNIÓN'
  const fechaFmt = new Date(datos.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const encabezado = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: BORDE,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: titulo, bold: true, size: 24 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: BORDE,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'BONYARD Servicios', size: 16 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: fechaFmt, size: 16 })] }),
            ],
          }),
        ],
      }),
    ],
  })

  const tablaDatos = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [celdaEtiqueta('Fecha'), celdaTexto(fechaFmt), celdaEtiqueta('Hora'), celdaTexto(datos.hora ?? '—')] }),
      new TableRow({
        children: [
          celdaEtiqueta('Lugar'),
          celdaTexto(datos.lugar ?? '—'),
          celdaEtiqueta('Modera'),
          celdaTexto(datos.convocanteNombre ?? '—'),
        ],
      }),
      ...(datos.linkVirtual
        ? [new TableRow({ children: [celdaEtiqueta('Liga virtual'), celdaTexto(datos.linkVirtual)] })]
        : []),
    ],
  })

  const tablaAsistentes = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [celdaEtiqueta('Nombre'), celdaEtiqueta('Puesto / Área'), celdaEtiqueta('Firma')] }),
      ...(datos.invitados.length > 0
        ? datos.invitados.map(
            (i) =>
              new TableRow({
                children: [celdaTexto(i.nombre), celdaTexto(i.puesto ?? '—'), celdaTexto('')],
              })
          )
        : [new TableRow({ children: [celdaTexto('—'), celdaTexto(''), celdaTexto('')] })]),
    ],
  })

  const tablaAcuerdos = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          celdaEtiqueta('No.'),
          celdaEtiqueta('Actividad / Acuerdo'),
          celdaEtiqueta('Responsable'),
          celdaEtiqueta('Fecha compromiso'),
          celdaEtiqueta('Estatus'),
        ],
      }),
      ...(datos.acuerdos.length > 0
        ? datos.acuerdos.map(
            (a, i) =>
              new TableRow({
                children: [
                  celdaTexto(String(i + 1)),
                  celdaTexto(a.acuerdo),
                  celdaTexto(a.responsable_nombre),
                  celdaTexto(a.fecha_compromiso),
                  celdaTexto(a.estatus === 'cerrado' ? 'Cerrado' : 'Abierto'),
                ],
              })
          )
        : [new TableRow({ children: [celdaTexto('—'), celdaTexto(''), celdaTexto(''), celdaTexto(''), celdaTexto('')] })]),
    ],
  })

  return new Document({
    sections: [
      {
        children: [
          encabezado,
          new Paragraph({ text: '' }),
          tituloSeccion('I. DATOS DE LA REUNIÓN'),
          tablaDatos,
          new Paragraph({ text: '' }),
          tituloSeccion('II. ASISTENTES / INVITADOS'),
          tablaAsistentes,
          new Paragraph({ text: '' }),
          tituloSeccion('III. AGENDA'),
          new Paragraph({ children: [new TextRun({ text: datos.agenda || '—', size: 18 })] }),
          new Paragraph({ text: '' }),
          tituloSeccion('IV. DESARROLLO'),
          new Paragraph({ children: [new TextRun({ text: datos.desarrollo || '—', size: 18 })] }),
          new Paragraph({ text: '' }),
          tituloSeccion('V. ACUERDOS, COMPROMISOS Y ACCIONES'),
          tablaAcuerdos,
          new Paragraph({ text: '' }),
          tituloSeccion('VI. CONCLUSIONES'),
          new Paragraph({ children: [new TextRun({ text: datos.conclusiones || '—', size: 18 })] }),
        ],
      },
    ],
  })
}
