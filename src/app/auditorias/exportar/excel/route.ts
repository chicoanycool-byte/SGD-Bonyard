import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

const NORMA_LABEL: Record<string, string> = { iso_9001: 'ISO 9001:2015', sqf: 'SQF', ambas: 'ISO 9001:2015 + SQF' }

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('auditorias')
    .select(
      'fecha, norma, tipo, proceso, cliente_nombre, nave, estatus, alcance, objetivo, informe_resumen, informe_conclusiones, auditor_lider:usuarios!auditorias_auditor_lider_id_fkey(nombre), auditor_auxiliar:usuarios!auditorias_auditor_auxiliar_id_fkey(nombre), auditado:usuarios!auditorias_auditado_id_fkey(nombre)'
    )
    .order('fecha', { ascending: true })

  const filas = (data ?? []).map((a) => ({
    Fecha: a.fecha ? new Date(a.fecha as string).toLocaleDateString('es-MX') : '',
    Norma: NORMA_LABEL[a.norma as string] ?? a.norma,
    Tipo: a.tipo,
    Proceso: a.proceso ?? '',
    Cliente: a.cliente_nombre ?? '',
    Nave: a.nave ?? '',
    'Auditor líder': (a.auditor_lider as unknown as { nombre: string } | null)?.nombre ?? '',
    'Auditor auxiliar': (a.auditor_auxiliar as unknown as { nombre: string } | null)?.nombre ?? '',
    Auditado: (a.auditado as unknown as { nombre: string } | null)?.nombre ?? '',
    Estatus: a.estatus,
    Alcance: a.alcance ?? '',
    Objetivo: a.objetivo ?? '',
    'Resumen del informe': a.informe_resumen ?? '',
    Conclusiones: a.informe_conclusiones ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(filas)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Auditorías')
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Programa_de_Auditorias.xlsx"',
    },
  })
}
