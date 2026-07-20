'use client'

import { useMemo, useState, useTransition } from 'react'
import { capturarValorIndicador, generarAccionDesdeIndicador, asignarResponsableIndicador, enviarRecordatoriosMes } from './actions'

type Indicador = {
  id: string
  numero: number
  proceso: string
  nombre: string
  unidad: string
  meta_texto: string
  meta_operador: string
  meta_valor: number
  periodo: string
  responsable_puesto: string | null
  responsable_id: string | null
  meses_activos: string[]
}

type Usuario = { id: string; nombre: string }

type Valor = {
  id: string
  indicador_id: string
  anio: number
  mes: number
  valor: number | null
  comentario: string | null
  requiere_ac: boolean
  comentario_ia: string | null
  accion_correctiva_id: string | null
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function cumpleMeta(operador: string, metaValor: number, valor: number) {
  if (operador === 'gte') return valor >= metaValor
  if (operador === 'lte') return valor <= metaValor
  if (operador === 'lt') return valor < metaValor
  if (operador === 'eq') return valor === metaValor
  return true
}

export default function TableroIndicadores({
  indicadores,
  valores,
  usuarios,
  esCoordinador,
  usuarioActualId,
  anioInicial,
  mesInicial,
}: {
  indicadores: Indicador[]
  valores: Valor[]
  usuarios: Usuario[]
  esCoordinador: boolean
  usuarioActualId: string
  anioInicial: number
  mesInicial: number
}) {
  const [anio, setAnio] = useState(anioInicial)
  const [mes, setMes] = useState(mesInicial)
  const [proceso, setProceso] = useState('')
  const [pending, startTransition] = useTransition()
  const [inputs, setInputs] = useState<Record<string, { valor: string; comentario: string }>>({})

  const procesos = useMemo(
    () => [...new Set(indicadores.map((i) => i.proceso))].sort(),
    [indicadores]
  )

  const nombreMes = MESES[mes - 1]

  const aplicables = useMemo(() => {
    return indicadores.filter((i) => {
      if (proceso && i.proceso !== proceso) return false
      return i.meses_activos.includes(nombreMes)
    })
  }, [indicadores, proceso, nombreMes])

  function valorDe(indicadorId: string) {
    return valores.find((v) => v.indicador_id === indicadorId && v.anio === anio && v.mes === mes)
  }

  function guardar(indicadorId: string) {
    const datos = inputs[indicadorId]
    if (!datos || datos.valor === '') return
    startTransition(() =>
      capturarValorIndicador(indicadorId, anio, mes, Number(datos.valor), datos.comentario ?? '')
    )
  }

  const inputCls =
    'h-8 rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-medium text-by-gray-dark">Filtros</p>
          {esCoordinador && (
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const n = await enviarRecordatoriosMes(anio, mes)
                  alert(`Se enviaron ${n} recordatorio(s) a los responsables.`)
                })
              }
              className="h-8 rounded-md border border-by-accent px-3 text-[12px] font-medium text-by-accent hover:bg-by-accent/10 disabled:opacity-50"
            >
              Enviar recordatorios de {nombreMes}
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Mes</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className={inputCls + ' w-full'}>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Año</label>
            <input
              type="number"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className={inputCls + ' w-full'}
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[11px] text-by-gray-dark">Proceso</label>
            <select value={proceso} onChange={(e) => setProceso(e.target.value)} className={inputCls + ' w-full'}>
              <option value="">Todos</option>
              {procesos.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">#</th>
              <th className="px-3 py-2 font-normal">Proceso</th>
              <th className="px-3 py-2 font-normal">Indicador</th>
              <th className="px-3 py-2 font-normal">Meta</th>
              <th className="px-3 py-2 font-normal">Responsable</th>
              <th className="min-w-[100px] px-3 py-2 font-normal">Valor ({nombreMes})</th>
              <th className="px-3 py-2 font-normal">Semáforo</th>
              <th className="min-w-[160px] px-3 py-2 font-normal">Comentario</th>
              <th className="px-3 py-2 font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {aplicables.map((ind) => {
              const v = valorDe(ind.id)
              const draft = inputs[ind.id] ?? {
                valor: v?.valor?.toString() ?? '',
                comentario: v?.comentario ?? '',
              }
              const tieneValor = v?.valor !== null && v?.valor !== undefined
              const cumple = tieneValor ? cumpleMeta(ind.meta_operador, ind.meta_valor, v!.valor!) : null
              const puedeEditarFila = esCoordinador || ind.responsable_id === usuarioActualId

              return (
                <tr key={ind.id} className="border-b border-black/5 last:border-0 align-top">
                  <td className="px-3 py-2 text-by-gray-light">{ind.numero}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{ind.proceso}</td>
                  <td className="min-w-[180px] px-3 py-2 text-by-gray-dark">{ind.nombre}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">{ind.meta_texto}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-by-gray-light">
                    {esCoordinador ? (
                      <select
                        defaultValue={ind.responsable_id ?? ''}
                        onChange={(e) =>
                          startTransition(() => asignarResponsableIndicador(ind.id, e.target.value))
                        }
                        className={inputCls}
                      >
                        <option value="">— {ind.responsable_puesto ?? 'Sin asignar'} —</option>
                        {usuarios.map((u) => (
                          <option key={u.id} value={u.id}>{u.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      ind.responsable_puesto ?? '—'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="any"
                      disabled={!puedeEditarFila}
                      value={draft.valor}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [ind.id]: { ...draft, valor: e.target.value },
                        }))
                      }
                      className={inputCls + ' w-20 disabled:bg-black/5'}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {cumple === null ? (
                      <span className="rounded-full bg-[#f1efe8] px-2 py-0.5 text-[11px] text-[#5f5e5a]">
                        Sin dato
                      </span>
                    ) : cumple ? (
                      <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[11px] text-[#3d6b53]">
                        Verde
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[11px] text-[#a13c33]">
                        Rojo
                      </span>
                    )}
                  </td>
                  <td className="min-w-[160px] px-3 py-2">
                    <input
                      value={draft.comentario}
                      placeholder="Observaciones"
                      disabled={!puedeEditarFila}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [ind.id]: { ...draft, comentario: e.target.value },
                        }))
                      }
                      className={inputCls + ' w-full disabled:bg-black/5'}
                    />
                    {v?.comentario_ia && (
                      <p className="mt-1 text-[10.5px] italic text-by-gray-light">
                        IA: {v.comentario_ia}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex flex-col gap-1">
                      {puedeEditarFila && (
                        <button
                          disabled={pending}
                          onClick={() => guardar(ind.id)}
                          className="text-[12px] text-by-accent hover:underline disabled:opacity-50"
                        >
                          Guardar
                        </button>
                      )}
                      {v?.requiere_ac && esCoordinador && !v.accion_correctiva_id && (
                        <button
                          disabled={pending}
                          onClick={() => startTransition(() => generarAccionDesdeIndicador(v.id))}
                          className="text-[12px] text-red-600 hover:underline disabled:opacity-50"
                        >
                          Generar AC
                        </button>
                      )}
                      {v?.accion_correctiva_id && (
                        <span className="text-[11px] text-by-gray-light">AC generada</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {aplicables.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  Ningún indicador aplica para {nombreMes} con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
