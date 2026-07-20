'use client'

import { useMemo, useState } from 'react'

type Indicador = {
  id: string
  numero: number
  proceso: string
  nombre: string
  meta_texto: string
  meta_operador: string
  meta_valor: number
}

type Valor = { indicador_id: string; mes: number; valor: number | null }

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function cumpleMeta(operador: string, metaValor: number, valor: number) {
  if (operador === 'gte') return valor >= metaValor
  if (operador === 'lte') return valor <= metaValor
  if (operador === 'lt') return valor < metaValor
  if (operador === 'eq') return valor === metaValor
  return true
}

export default function HistoricoIndicadores({
  indicadores,
  valores,
  anioInicial,
}: {
  indicadores: Indicador[]
  valores: Valor[]
  anioInicial: number
}) {
  const anio = anioInicial
  const [proceso, setProceso] = useState('')

  const procesos = useMemo(
    () => [...new Set(indicadores.map((i) => i.proceso))].sort(),
    [indicadores]
  )

  const filtrados = proceso ? indicadores.filter((i) => i.proceso === proceso) : indicadores

  function valorMes(indicadorId: string, mes: number) {
    return valores.find((v) => v.indicador_id === indicadorId && v.mes === mes)?.valor ?? null
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Año</label>
            <p className="flex h-8 items-center text-[12.5px] text-by-gray-dark">{anio}</p>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[11px] text-by-gray-dark">Proceso</label>
            <select
              value={proceso}
              onChange={(e) => setProceso(e.target.value)}
              className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
            >
              <option value="">Todos</option>
              {procesos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[11.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
              <th className="sticky left-0 min-w-[220px] bg-white px-3 py-2 font-normal">Indicador</th>
              <th className="px-2 py-2 font-normal">Meta</th>
              {MESES.map((m) => (
                <th key={m} className="px-2 py-2 text-center font-normal">{m}</th>
              ))}
              <th className="px-2 py-2 text-center font-normal">Prom.</th>
              <th className="px-2 py-2 text-center font-normal">Semáforo</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((ind) => {
              const valoresAnio = MESES.map((_, i) => valorMes(ind.id, i + 1))
              const conDato = valoresAnio.filter((v): v is number => v !== null)
              const promedio =
                conDato.length > 0
                  ? Math.round((conDato.reduce((a, b) => a + b, 0) / conDato.length) * 100) / 100
                  : null
              const cumple = promedio !== null ? cumpleMeta(ind.meta_operador, ind.meta_valor, promedio) : null

              return (
                <tr key={ind.id} className="border-b border-black/5 last:border-0">
                  <td className="sticky left-0 whitespace-nowrap bg-white px-3 py-2 text-by-gray-dark">
                    {ind.numero}. {ind.nombre}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-by-gray-light">{ind.meta_texto}</td>
                  {valoresAnio.map((v, i) => (
                    <td key={i} className="px-2 py-2 text-center text-by-gray-light">
                      {v ?? '—'}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center font-medium text-by-gray-dark">
                    {promedio ?? '—'}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {cumple === null ? (
                      <span className="rounded-full bg-[#f1efe8] px-2 py-0.5 text-[10px] text-[#5f5e5a]">—</span>
                    ) : cumple ? (
                      <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[10px] text-[#3d6b53]">Verde</span>
                    ) : (
                      <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[10px] text-[#a13c33]">Rojo</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
