import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

type Vehiculo = { marca: string; modelo: string; placas: string }
type Persona = { nombre: string; nss: string }
type Protocolo = { protocolo: string; seleccionado: boolean; descripcion: string }

const SINO = (v: boolean | null) => (v === true ? 'Sí' : v === false ? 'No' : '')

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase.from('permisos_trabajo').select('*').order('creado_en', { ascending: true })

  const filas = (data ?? []).map((p) => ({
    Folio: p.folio ?? '',
    'Nombre Empresa': p.nombre_empresa,
    'Razón Social': p.razon_social ?? '',
    Fecha: p.fecha ? new Date(p.fecha as string).toLocaleDateString('es-MX') : '',
    Vigencia: p.vigencia ? new Date(p.vigencia as string).toLocaleDateString('es-MX') : '',
    'Tipo de Ingreso': p.tipo_ingreso ?? '',
    'Se identifica con': p.identificacion ?? '',
    'EPP Casco': p.epp_casco ? 'Sí' : 'No',
    'EPP Chaleco': p.epp_chaleco ? 'Sí' : 'No',
    'EPP Botas': p.epp_botas ? 'Sí' : 'No',
    Vehículos: ((p.vehiculos ?? []) as Vehiculo[]).map((v) => `${v.marca} ${v.modelo} (${v.placas})`).join(' / '),
    Personal: ((p.personal ?? []) as Persona[]).map((x) => `${x.nombre} (NSS: ${x.nss})`).join(' / '),
    'Tipo de Mantenimiento': p.tipo_mantenimiento ?? '',
    'Solicitante Bonyard': p.solicitante_bonyard ?? '',
    'Descripción del trabajo': p.descripcion_trabajo ?? '',
    'Hojas de Seguridad Anexas': p.hojas_seguridad_anexas ?? '',
    'Herramientas y Equipo': p.herramientas_equipo ?? '',
    'Emisiones al Aire': SINO(p.emisiones_aire as boolean | null),
    'Detalle Emisiones': p.emisiones_aire_detalle ?? '',
    'Descargas de Agua': SINO(p.descargas_agua as boolean | null),
    'Detalle Descargas': p.descargas_agua_detalle ?? '',
    'Trabajo en Alturas': SINO(p.trabajo_alturas as boolean | null),
    'Detalle Alturas': p.trabajo_alturas_detalle ?? '',
    'Trabajos Confinados': SINO(p.trabajos_confinados as boolean | null),
    'Detalle Confinados': p.trabajos_confinados_detalle ?? '',
    'Soldadura/Calor': SINO(p.soldadura_calor as boolean | null),
    'Detalle Soldadura': p.soldadura_calor_detalle ?? '',
    'Genera Desperdicios': SINO(p.generacion_desperdicios as boolean | null),
    'Detalle Desperdicios': p.desperdicios_detalle ?? '',
    'Desperdicio Reciclable': SINO(p.desperdicio_reciclable as boolean | null),
    'Detalle Reciclable': p.reciclable_detalle ?? '',
    'Consume Energía': SINO(p.consume_energia as boolean | null),
    'Tipo de Energía': p.energia_tipo ?? '',
    'Detalle Energía': p.energia_detalle ?? '',
    Protocolos: ((p.protocolos ?? []) as Protocolo[]).map((x) => x.protocolo).join(', '),
    'Comentarios Adicionales': p.comentarios_adicionales ?? '',
    'Firma Solicitante': p.firma_solicitante ?? '',
    'Firma Seguridad Patrimonial': p.firma_seguridad_patrimonial ?? '',
    'Firma Contratista': p.firma_contratista ?? '',
    'Firma Coordinador del SGI': p.firma_coordinador_sgi ?? '',
    'Vo.Bo. Solicitante (cierre)': p.firma_solicitante_vobo ?? '',
    Estatus: p.estatus,
  }))

  const ws = XLSX.utils.json_to_sheet(filas)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Permisos de Trabajo')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="FSG-25_Permisos_de_Trabajo.xlsx"',
    },
  })
}
