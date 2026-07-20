import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

function cumpleMeta(operador: string, metaValor: number, valor: number) {
  if (operador === 'gte') return valor >= metaValor
  if (operador === 'lte') return valor <= metaValor
  if (operador === 'lt') return valor < metaValor
  if (operador === 'eq') return valor === metaValor
  return true
}

export async function GET() {
  await requerirUsuario()
  const supabase = await createClient()
  const anio = new Date().getFullYear()

  const [{ data: valoresData }] = await Promise.all([
    supabase.from('indicadores_valores').select('indicador_id, mes, valor').eq('anio', anio),
  ])

  // Consulta el catálogo incluyendo id para poder mapear los valores por indicador
  const { data: catalogoConId } = await supabase
    .from('indicadores_catalogo')
    .select(
      'id, numero, proceso, nombre, unidad, meta_texto, meta_operador, meta_valor, periodo, responsable_puesto, responsable:usuarios!indicadores_catalogo_responsable_id_fkey(nombre)'
    )
    .order('numero')

  const filasFinal = (catalogoConId ?? []).map((ind) => {
    const valoresInd = (valoresData ?? []).filter((v) => v.indicador_id === ind.id)
    const porMes: Record<string, number | string> = {}
    let suma = 0
    let cuenta = 0
    for (let m = 1; m <= 12; m++) {
      const v = valoresInd.find((x) => x.mes === m)
      porMes[MESES[m - 1]] = v?.valor ?? ''
      if (v?.valor !== undefined && v.valor !== null) {
        suma += Number(v.valor)
        cuenta++
      }
    }
    const promedio = cuenta > 0 ? Math.round((suma / cuenta) * 100) / 100 : ''
    const semaforo =
      cuenta === 0
        ? 'SIN DATO'
        : cumpleMeta(ind.meta_operador as string, Number(ind.meta_valor), suma / cuenta)
          ? 'VERDE'
          : 'ROJO'

    return {
      '#': ind.numero,
      Proceso: ind.proceso,
      Indicador: ind.nombre,
      Unidad: ind.unidad,
      Meta: ind.meta_texto,
      ...porMes,
      'Promedio Anual': promedio,
      Semáforo: semaforo,
      Responsable:
        (ind.responsable as unknown as { nombre: string } | null)?.nombre ??
        ind.responsable_puesto ??
        '',
      Período: ind.periodo,
    }
  })

  const hoja = XLSX.utils.json_to_sheet(filasFinal)
  hoja['!cols'] = Object.keys(filasFinal[0] ?? {}).map(() => ({ wch: 14 }))

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, `FSG-06 ${anio}`)

  const buffer = XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="FSG-06_Tablero_de_Indicadores_${anio}.xlsx"`,
    },
  })
}
