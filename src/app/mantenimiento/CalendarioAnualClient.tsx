'use client'

import { useMemo, useState, useTransition } from 'react'
import { crearItemCatalogo, eliminarItemCatalogo, editarItemCatalogo, alternarProgramado, alternarRealizado } from './actions'

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

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
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
  const [editando, setEditando] = useState<string | null>(null)

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
          <a
            href={`/mantenimiento/programa/exportar/pdf?nave=${encodeURIComponent(nave)}&anio=${anio}`}
            target="_blank"
            className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary"
          >
            Descargar PDF
          </a>
        </div>
      </div>

      <div className="rounded-lg bg-[#f4f6f6] px-4 py-3">
        <p className="mb-1 text-[11px] text-by-gray-light">Cumplimiento {nave} — {anio}</p>
        <p className="text-[22px] font-medium text-by-primary">
          {cumplimiento.toFixed(1)}% <span className="text-[13px] font-normal text-by-gray-light">({totalReal}/{totalProg} actividades)</span>
        </p>
      </div>

      <p className="text-[10.5px] text-by-gray-light">
        Meses: haz clic para marcar <strong>programado</strong> (azul), un segundo clic lo marca <strong>realizado</strong> (verde), un tercer clic lo limpia.
        {puedeGestionar && <> Usa <strong>Editar</strong> para modificar el ID, equipo, tipo, descripción o frecuencia.</>}
      </p>

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[11.5px]">
          <thead>
            <tr className="border-b border-black/5 bg-[#14302B] text-[10px] uppercase text-white">
              <th className="px-2 py-2 font-normal">ID</th>
              <th className="w-[140px] max-w-[140px] px-3 py-2 font-normal">Equipos / Instalaciones</th>
              <th className="px-2 py-2 font-normal">Tipo:<br />Crítico / NA</th>
              <th className="min-w-[220px] px-3 py-2 font-normal">Descripción general de mantenimiento</th>
              <th className="px-2 py-2 font-normal">Frecuencia</th>
              {MESES.map((m, i) => (
                <th key={i} className="w-11 px-1 py-2 text-center font-normal">{m}</th>
              ))}
              <th className="px-2 py-2 text-center font-normal">%</th>
              {puedeGestionar && <th className="px-2 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const enEdicion = editando === it.id
              let progFila = 0
              let realFila = 0
              for (let m = 1; m <= 12; m++) {
                const c = celda(it.id, m)
                if (c.programado) progFila++
                if (c.realizado) realFila++
              }
              const pctFila = progFila > 0 ? Math.round((realFila / progFila) * 100) : null

              if (enEdicion) {
                return (
                  <tr key={it.id} className="border-b border-black/5 bg-[#fafbfa] align-top last:border-0">
                    <td colSpan={puedeGestionar ? 5 + 12 + 2 : 5 + 12 + 1} className="px-3 py-3">
                      <form
                        action={(fd) =>
                          startTransition(async () => {
                            await editarItemCatalogo(fd)
                            setEditando(null)
                          })
                        }
                        className="grid grid-cols-6 gap-2"
                      >
                        <input type="hidden" name="id" value={it.id} />
                        <input type="hidden" name="tipo" value={tipo} />
                        <input type="hidden" name="documento_registro" value={it.documento_registro ?? ''} />
                        <div>
                          <label className="mb-1 block text-[10px] text-by-gray-light">ID</label>
                          <input name="numero" type="number" defaultValue={it.numero ?? ''} className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
                        </div>
                        <div className="col-span-2">
                          <label className="mb-1 block text-[10px] text-by-gray-light">Equipos / Instalaciones</label>
                          <input name="nombre" defaultValue={it.nombre} required className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] text-by-gray-light">Tipo</label>
                          <select name="criticidad" defaultValue={it.criticidad ?? 'NA'} className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]">
                            <option value="NA">NA</option>
                            <option value="CRITICO">Crítico</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] text-by-gray-light">Frecuencia</label>
                          <input name="frecuencia" defaultValue={it.frecuencia ?? ''} className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
                        </div>
                        <div className="flex items-end gap-2">
                          <button disabled={pendiente} className="h-8 rounded-md bg-by-primary px-3 text-[12px] font-medium text-white disabled:opacity-50">
                            Guardar
                          </button>
                          <button type="button" onClick={() => setEditando(null)} className="h-8 rounded-md border border-black/10 px-3 text-[12px] text-by-gray-light">
                            Cancelar
                          </button>
                        </div>
                        <div className="col-span-6">
                          <label className="mb-1 block text-[10px] text-by-gray-light">Descripción general de mantenimiento</label>
                          <textarea name="descripcion" defaultValue={it.descripcion ?? ''} rows={2} className="w-full rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
                        </div>
                      </form>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={it.id} className="border-b border-black/5 last:border-0">
                  <td className="px-2 py-2 text-by-gray-light">{it.numero ?? '—'}</td>
                  <td className="w-[140px] max-w-[140px] truncate px-3 py-2 text-by-gray-dark" title={it.nombre}>{it.nombre}</td>
                  <td className="px-2 py-2">
                    <span
                      className={
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium ' +
                        (it.criticidad === 'CRITICO' ? 'bg-[#fdecea] text-[#a13c33]' : 'bg-[#f1efe8] text-[#5f5e5a]')
                      }
                    >
                      {it.criticidad === 'CRITICO' ? 'Crítico' : 'NA'}
                    </span>
                  </td>
                  <td className="min-w-[220px] max-w-[320px] px-3 py-2 text-by-gray-light">{it.descripcion ?? '—'}</td>
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
                      <div className="flex flex-col gap-1">
                        <button onClick={() => setEditando(it.id)} className="text-[10.5px] text-by-accent hover:underline">
                          Editar
                        </button>
                        <button
                          onClick={() => startTransition(() => eliminarItemCatalogo(it.id, tipo))}
                          disabled={pendiente}
                          className="text-[10.5px] text-red-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={19} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
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
