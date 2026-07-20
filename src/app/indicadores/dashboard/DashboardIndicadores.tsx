'use client'

type Indicador = {
  id: string
  proceso: string
  nombre: string
  meta_texto: string
  meta_operador: string
  meta_valor: number
  periodo: string
  responsable_nombre: string | null
}

type Valor = { indicador_id: string; anio: number; mes: number; valor: number | null }

function cumpleMeta(operador: string, metaValor: number, valor: number) {
  if (operador === 'gte') return valor >= metaValor
  if (operador === 'lte') return valor <= metaValor
  if (operador === 'lt') return valor < metaValor
  if (operador === 'eq') return valor === metaValor
  return true
}

function promedio(nums: number[]) {
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

export default function DashboardIndicadores({
  indicadores,
  valores,
  anio,
}: {
  indicadores: Indicador[]
  valores: Valor[]
  anio: number
}) {
  const evaluados = indicadores.map((ind) => {
    const propios = valores.filter((v) => v.indicador_id === ind.id && v.anio === anio && v.valor !== null)
    const porMes = (m: number) => propios.find((v) => v.mes === m)?.valor ?? null

    const q1 = promedio([porMes(1), porMes(2), porMes(3)].filter((v): v is number => v !== null))
    const q2 = promedio([porMes(4), porMes(5), porMes(6)].filter((v): v is number => v !== null))
    const q3 = promedio([porMes(7), porMes(8), porMes(9)].filter((v): v is number => v !== null))
    const q4 = promedio([porMes(10), porMes(11), porMes(12)].filter((v): v is number => v !== null))
    const anual = promedio(propios.map((v) => v.valor as number))

    const semaforo =
      anual === null
        ? 'sin_dato'
        : cumpleMeta(ind.meta_operador, ind.meta_valor, anual)
          ? 'verde'
          : 'rojo'

    let tendencia: 'mejorando' | 'decayendo' | 'estable' | null = null
    if (q1 !== null && q2 !== null) {
      tendencia = q2 > q1 ? 'mejorando' : q2 < q1 ? 'decayendo' : 'estable'
    }

    return { ind, q1, q2, q3, q4, anual, semaforo, tendencia }
  })

  const enMeta = evaluados.filter((e) => e.semaforo === 'verde').length
  const enAtencion = evaluados.filter((e) => e.semaforo === 'amarillo').length
  const accionUrgente = evaluados.filter((e) => e.semaforo === 'rojo').length
  const sinDato = evaluados.filter((e) => e.semaforo === 'sin_dato').length
  const conDato = evaluados.length - sinDato
  const cumplimientoGlobal = conDato > 0 ? Math.round((enMeta / conDato) * 100) : null

  const porProceso = new Map<string, typeof evaluados>()
  for (const e of evaluados) {
    const lista = porProceso.get(e.ind.proceso) ?? []
    lista.push(e)
    porProceso.set(e.ind.proceso, lista)
  }

  const filasProceso = [...porProceso.entries()].map(([proceso, lista]) => {
    const verdes = lista.filter((e) => e.semaforo === 'verde').length
    const rojos = lista.filter((e) => e.semaforo === 'rojo').length
    const total = lista.length
    const pctMeta = total > 0 ? Math.round((verdes / total) * 100) : 0
    const estado = rojos > 0 ? '🔴 ACCIÓN REQUERIDA' : verdes < total ? '🟡 REVISAR' : '🟢 OK'
    const promAnual = promedio(lista.map((e) => e.anual).filter((v): v is number => v !== null))
    const promQ1 = promedio(lista.map((e) => e.q1).filter((v): v is number => v !== null))
    const promQ2 = promedio(lista.map((e) => e.q2).filter((v): v is number => v !== null))
    const promQ3 = promedio(lista.map((e) => e.q3).filter((v): v is number => v !== null))
    const promQ4 = promedio(lista.map((e) => e.q4).filter((v): v is number => v !== null))
    let tendencia = '→'
    if (promQ1 !== null && promQ2 !== null) {
      tendencia = promQ2 > promQ1 ? '↑ Mejorando' : promQ2 < promQ1 ? '↓ Decayendo' : '→'
    }
    return { proceso, total, verdes, rojos, pctMeta, estado, tendencia, promAnual, promQ1, promQ2, promQ3, promQ4 }
  })

  const fmt = (n: number | null) => (n === null ? '—' : Math.round(n * 100) / 100)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-5 gap-3">
        <div className="rounded-lg bg-[#eaf5f0] px-4 py-3 text-[#3d6b53]">
          <p className="text-[22px] font-semibold">{enMeta}</p>
          <p className="text-[11px] opacity-80">Indicadores en meta</p>
        </div>
        <div className="rounded-lg bg-[#fdf3e3] px-4 py-3 text-[#9a6b1c]">
          <p className="text-[22px] font-semibold">{enAtencion}</p>
          <p className="text-[11px] opacity-80">En atención</p>
        </div>
        <div className="rounded-lg bg-[#fdecea] px-4 py-3 text-[#a13c33]">
          <p className="text-[22px] font-semibold">{accionUrgente}</p>
          <p className="text-[11px] opacity-80">Requieren acción urgente</p>
        </div>
        <div className="rounded-lg bg-[#f1efe8] px-4 py-3 text-[#5f5e5a]">
          <p className="text-[22px] font-semibold">{sinDato}</p>
          <p className="text-[11px] opacity-80">Sin dato / pendiente</p>
        </div>
        <div className="rounded-lg bg-[#f4f6f6] px-4 py-3 text-by-primary">
          <p className="text-[22px] font-semibold">
            {cumplimientoGlobal !== null ? `${cumplimientoGlobal}%` : '—'}
          </p>
          <p className="text-[11px] opacity-80">% cumplimiento global</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <div className="border-b border-black/5 px-4 py-2">
          <p className="text-[13px] font-medium text-by-gray-dark">📋 Resumen ejecutivo por proceso</p>
        </div>
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
              <th className="whitespace-nowrap px-3 py-2 font-normal">Proceso</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Total Ind.</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">🟢 Verde</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">🔴 Rojo</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">% Meta</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Estado actual</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Tend.</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Prom. Anual</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Q1</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Q2</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Q3</th>
              <th className="whitespace-nowrap px-3 py-2 font-normal">Q4</th>
            </tr>
          </thead>
          <tbody>
            {filasProceso.map((f) => (
              <tr key={f.proceso} className="border-b border-black/5 last:border-0">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-by-gray-dark">{f.proceso}</td>
                <td className="px-3 py-2 text-by-gray-light">{f.total}</td>
                <td className="px-3 py-2 text-by-gray-light">{f.verdes}</td>
                <td className="px-3 py-2 text-by-gray-light">{f.rojos}</td>
                <td className="px-3 py-2 text-by-gray-light">{f.pctMeta}%</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{f.estado}</td>
                <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{f.tendencia}</td>
                <td className="px-3 py-2 text-by-gray-light">{fmt(f.promAnual)}</td>
                <td className="px-3 py-2 text-by-gray-light">{fmt(f.promQ1)}</td>
                <td className="px-3 py-2 text-by-gray-light">{fmt(f.promQ2)}</td>
                <td className="px-3 py-2 text-by-gray-light">{fmt(f.promQ3)}</td>
                <td className="px-3 py-2 text-by-gray-light">{fmt(f.promQ4)}</td>
              </tr>
            ))}
            <tr className="bg-[#f4f6f6] font-medium text-by-gray-dark">
              <td className="whitespace-nowrap px-3 py-2">▶ TOTAL</td>
              <td className="px-3 py-2">{evaluados.length}</td>
              <td className="px-3 py-2">{enMeta}</td>
              <td className="px-3 py-2">{accionUrgente}</td>
              <td className="px-3 py-2">{cumplimientoGlobal ?? '—'}%</td>
              <td className="px-3 py-2" colSpan={7}>
                {accionUrgente > 0 ? '🔴 REVISAR' : '🟢 OK'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
