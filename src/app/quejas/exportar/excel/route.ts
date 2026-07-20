import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

const SERVICIO_LABEL: Record<string, string> = {
  almacenaje: 'Almacenaje',
  transporte: 'Transporte',
  seguro_mercancia: 'Seguro de mercancía',
}

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('quejas')
    .select(
      'folio, tipo, creado_en, nombre_cliente, correo_cliente, descripcion, servicio, criticidad, tipo_queja, respuesta_cliente, escalada_ac, accion_correctiva_id, correccion, usuario_responsable_id, responsable:usuarios!quejas_usuario_responsable_id_fkey(nombre), fecha_limite, fecha_cierre, estatus'
    )
    .order('creado_en', { ascending: true })

  const filas = (data ?? []).map((q) => ({
    Folio: q.folio ?? '',
    TIPO: q.tipo === 'inocuidad' ? 'Inocuidad' : q.tipo === 'calidad' ? 'Calidad' : '',
    Fecha: q.creado_en ? new Date(q.creado_en as string).toLocaleDateString('es-MX') : '',
    Cliente: q.nombre_cliente,
    'Teléfono y/o correo o medio de contacto': q.correo_cliente ?? '',
    'Descripción de la queja': q.descripcion,
    Servicio: SERVICIO_LABEL[q.servicio as string] ?? q.servicio,
    Criticidad: q.criticidad
      ? (q.criticidad as string).charAt(0).toUpperCase() + (q.criticidad as string).slice(1)
      : '',
    'Tipo de queja': q.tipo_queja,
    'Respuesta al cliente': q.respuesta_cliente ?? '',
    'Requiere acción correctiva': q.escalada_ac ? 'Sí' : 'No',
    'Número de acción correctiva': q.accion_correctiva_id
      ? String(q.accion_correctiva_id).slice(0, 8)
      : '',
    'Descripción de la corrección (Actividades a realizar)': q.correccion ?? '',
    Responsable: (q.responsable as unknown as { nombre: string } | null)?.nombre ?? '',
    'Fecha programada': q.fecha_limite
      ? new Date(q.fecha_limite as string + 'T00:00:00').toLocaleDateString('es-MX')
      : '',
    'Fecha real de cierre': q.fecha_cierre
      ? new Date(q.fecha_cierre as string).toLocaleDateString('es-MX')
      : '',
    'Estatus (C: cerrado)': q.estatus === 'cerrada' ? 'C' : (q.estatus as string),
  }))

  const hoja = XLSX.utils.json_to_sheet(filas)
  hoja['!cols'] = Object.keys(filas[0] ?? {}).map(() => ({ wch: 22 }))

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Registro de quejas SGI')

  const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="FSG-03_Registro_de_Quejas.xlsx"`,
    },
  })
}
