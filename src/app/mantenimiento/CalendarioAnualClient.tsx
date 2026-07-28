'use client'

import { Fragment, useMemo, useState, useTransition } from 'react'
import { crearItemCatalogo, eliminarItemCatalogo, alternarProgramado, alternarRealizado } from './actions'

type Mensual = { item_id: string; mes: number; programado: boolean; realizado: boolean }
type ItemCatalogo = {
  id: string
  nave: string
  numero: number | null
  nombre: string
  criticidad: string | null
  descripcion: string | null
  frecuencia: string | null
  documento_registro: string | null
}

const MESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function CalendarioAnualClient({
  tipo,
  titulo,
  codigo,
  puedeGestionar,
  catalogo,
  mensual,
  anioInicial,
}: {
  tipo: 'mantenimiento' | 'limpieza'
  titulo: string
  codigo: string
  puedeGestionar: boolean
  catalogo: ItemCatalogo[]
  mensual: Mensual[]
  anioInicial: number
}) {
  const [pendiente, startTransition] = useTransition()
  const [anio, setAnio] = useState(anioInicial)
  const [expandido, setExpandido] = useState<string | null>(null)

  const naves = useMemo(() => [...new Set(catalogo.map((c) => c.nave))].sort(), [catalogo])
  const [nave, setNave] = useState(naves[0] ?? 'Nave 1')

  const items = catalogo.filter((c) => c.nave === nave)
  const mensualPorItem = useMemo(() => {
    const map = new Map<string, Map<number, Mensual>>()
    for (const m of mensual) {
      if (!map.has(m.item_id)) map.set(m.item_id, new Map())
      map.get(m.item_id)!.set(m.mes, m)
    }
    return map
  }, [mensual])

  function celda(itemId: string, mes: number): Mensual {
    return mensualPorItem.get(itemId)?.get(mes) ?? { item_id: itemId, mes, programado: false, realizado: false }
  }

  let totalProg = 0
  let totalReal = 0
  for (const it of items) {
    for (let m = 1; m <= 12; m++) {
      const c = celda(it.id, m)
      if (c.programado) totalProg++
      if (c.realizado) totalReal++
    }
  }
  const cumplimiento = totalProg > 0 ? (totalReal / totalProg) * 100 : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">
          {titulo} <span className="text-[11px] font-normal text-by-gray-light">({codigo})</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {naves.map((n) => (
              <button
                key={n}
                onClick={() => setNave(n)}
                className={
                  'rounded-md px-3 py-1.5 text-[12px] ' +
                  (nave === n ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')
                }
              >
                {n}
              </button>
            ))}
          </div>
          <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
            {[anioInicial - 1, anioInicial, anioInicial + 1].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-[#f4f6f6] px-4 py-3">
        <p className="mb-1 text-[11px] text-by-gray-light">Cumplimiento {nave} — {anio}</p>
        <p className="text-[22px] font-medium text-by-primary">
          {cumplimiento.toFixed(1)}% <span className="text-[13px] font-normal text-by-gray-light">({totalReal}/{totalProg} actividades)</span>
        </p>
      </div>

      <p className="text-[10.5px] text-by-gray-light">
        Instrucciones: haz clic en un mes para marcarlo <strong>programado</strong> (azul). Un segundo clic lo marca <strong>realizado</strong> (verde). Un tercer clic lo limpia.
      </p>

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[11.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
              <th className="sticky left-0 z-10 bg-white px-3 py-2 font-normal">Equipo / Área</th>
              <th className="px-2 py-2 font-normal">Frecuencia</th>
              {MESES.map((m, i) => (
                <th key={i} className="w-8 px-1 py-2 text-center font-normal">{m}</th>
              ))}
              <th className="px-2 py-2 text-center font-normal">%</th>
              {puedeGestionar && <th className="px-2 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const abierto = expandido === it.id
              let progFila = 0
              let realFila = 0
              for (let m = 1; m <= 12; m++) {
                const c = celda(it.id, m)
                if (c.programado) progFila++
                if (c.realizado) realFila++
              }
              const pctFila = progFila > 0 ? Math.round((realFila / progFila) * 100) : null
              return (
                <Fragment key={it.id}>
                  <tr className="border-b border-black/5 last:border-0">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2">
                      <button onClick={() => setExpandido(abierto ? null : it.id)} className="text-left text-by-gray-dark hover:underline">
                        {it.nombre}
                      </button>
                      {it.criticidad === 'CRITICO' && (
                        <span className="ml-1.5 rounded-full bg-[#fdecea] px-1.5 py-0.5 text-[9.5px] text-[#a13c33]">Crítico</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-by-gray-light">{it.frecuencia ?? '—'}</td>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
                      const c = celda(it.id, mes)
                      const estilo = c.realizado
                        ? 'bg-[#3d6b53] text-white'
                        : c.programado
                        ? 'bg-[#e6f0fa] text-[#2d5f8a]'
                        : 'bg-[#f4f6f6] text-transparent'
                      return (
                        <td key={mes} className="px-1 py-2 text-center">
                          <button
                            disabled={!puedeGestionar || pendiente}
                            onClick={() => {
                              if (!c.programado) startTransition(() => alternarProgramado(it.id, anio, mes, tipo))
                              else if (c.programado && !c.realizado) startTransition(() => alternarRealizado(it.id, anio, mes, tipo))
                              else startTransition(() => alternarProgramado(it.id, anio, mes, tipo))
                            }}
                            className={'h-6 w-6 rounded text-[10px] font-medium ' + estilo}
                            title={MESES_LARGO[mes - 1]}
                          >
                            {c.realizado ? '✓' : c.programado ? '•' : ''}
                          </button>
                        </td>
                      )
                    })}
                    <td className="px-2 py-2 text-center text-by-gray-light">{pctFila != null ? `${pctFila}%` : '—'}</td>
                    {puedeGestionar && (
                      <td className="px-2 py-2">
                        <button
                          onClick={() => startTransition(() => eliminarItemCatalogo(it.id, tipo))}
                          disabled={pendiente}
                          className="text-[10.5px] text-red-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                  {abierto && (
                    <tr className="border-b border-black/5 bg-[#fafbfa]">
                      <td colSpan={16} className="px-4 py-2 text-[11px] text-by-gray-dark">
                        <span className="text-by-gray-light">Descripción: </span>
                        {it.descripcion ?? '—'}
                        <br />
                        <span className="text-by-gray-light">Documento de registro: </span>
                        {it.documento_registro ?? '—'}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={16} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin elementos capturados para {nave}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {puedeGestionar && (
        <form action={(fd) => startTransition(() => crearItemCatalogo(fd))} className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">
            Agregar {tipo === 'limpieza' ? 'área / actividad de limpieza' : 'equipo / instalación'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            <input type="hidden" name="tipo" value={tipo} />
            <select name="nave" defaultValue={nave} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="Nave 1">Nave 1</option>
              <option value="Nave 2">Nave 2</option>
            </select>
            <input name="nombre" placeholder="Nombre" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <select name="criticidad" defaultValue="NA" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="NA">NA</option>
              <option value="CRITICO">Crítico</option>
            </select>
            <textarea name="descripcion" placeholder="Descripción" rows={2} className="col-span-4 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <input name="frecuencia" placeholder="Frecuencia (ej. Trimestral)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="documento_registro" placeholder="Documento de registro" className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="col-span-4 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Agregar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
