'use client'

import { useMemo, useState, useTransition } from 'react'
import { actualizarRespuestaDefensa, actualizarEncabezadoDefensa } from './actions'

type ItemCatalogo = { id: string; seccion: string; pregunta_grupo: string | null; item: string; orden: number }
type Respuesta = {
  item_id: string; nave: string; respuesta: string | null; hallazgos: string | null
  acciones_mejora: string | null; responsable: string | null
  fecha_programada_cierre: string | null; fecha_real_cierre: string | null
}
type Encabezado = { nave: string; fecha: string | null; proxima_revision: string | null; realizado_por: string | null }

const RESPUESTA_STYLE: Record<string, string> = {
  SI: 'bg-[#eaf5f0] text-[#3d6b53]',
  NO: 'bg-[#fdecea] text-[#a13c33]',
  NA: 'bg-[#f1efe8] text-[#5f5e5a]',
}

export default function DefensaAlimentariaClient({
  esCoordinador,
  catalogo,
  respuestas,
  encabezados,
}: {
  esCoordinador: boolean
  catalogo: ItemCatalogo[]
  respuestas: Respuesta[]
  encabezados: Encabezado[]
}) {
  const [pendiente, startTransition] = useTransition()
  const [nave, setNave] = useState('Nave 1')
  const [editando, setEditando] = useState<string | null>(null)
  const [soloIncompletos, setSoloIncompletos] = useState(false)

  const encabezado = encabezados.find((e) => e.nave === nave) ?? null

  function respuestaDe(itemId: string) {
    return respuestas.find((r) => r.item_id === itemId && r.nave === nave)
  }

  const secciones = useMemo(() => {
    const grupos: { seccion: string; items: ItemCatalogo[] }[] = []
    for (const it of catalogo) {
      let g = grupos.find((x) => x.seccion === it.seccion)
      if (!g) {
        g = { seccion: it.seccion, items: [] }
        grupos.push(g)
      }
      g.items.push(it)
    }
    return grupos
  }, [catalogo])

  let totalSi = 0
  let totalNo = 0
  for (const it of catalogo) {
    const r = respuestaDe(it.id)
    if (r?.respuesta === 'SI') totalSi++
    if (r?.respuesta === 'NO') totalNo++
  }
  const pctCumplimiento = totalSi + totalNo > 0 ? (totalSi / (totalSi + totalNo)) * 100 : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Evaluación de Defensa Alimentaria <span className="text-[11px] font-normal text-by-gray-light">(FSG-30)</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {['Nave 1', 'Nave 2'].map((n) => (
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
          <a href={`/inocuidad-alimentaria/defensa-alimentaria/exportar/excel?nave=${encodeURIComponent(nave)}`} className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">
            Excel
          </a>
          <a href={`/inocuidad-alimentaria/defensa-alimentaria/exportar/pdf?nave=${encodeURIComponent(nave)}`} target="_blank" className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">
            PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className={'rounded-lg px-4 py-3 ' + (pctCumplimiento != null && pctCumplimiento >= 85 ? 'bg-[#eaf5f0]' : 'bg-[#fdf3e3]')}>
          <p className="mb-1 text-[11px] text-by-gray-light">% Cumplimiento (SI / SI+NO)</p>
          <p className="text-[22px] font-medium text-by-primary">{pctCumplimiento != null ? `${pctCumplimiento.toFixed(1)}%` : '—'}</p>
        </div>
        <div className="rounded-lg bg-[#f4f6f6] px-4 py-3">
          <p className="mb-1 text-[11px] text-by-gray-light">Fecha de evaluación</p>
          <p className="text-[13px] font-medium text-by-primary">{encabezado?.fecha ? new Date(encabezado.fecha).toLocaleDateString('es-MX') : '—'}</p>
        </div>
        <div className="rounded-lg bg-[#f4f6f6] px-4 py-3">
          <p className="mb-1 text-[11px] text-by-gray-light">Próxima revisión</p>
          <p className="text-[13px] font-medium text-by-primary">{encabezado?.proxima_revision ? new Date(encabezado.proxima_revision).toLocaleDateString('es-MX') : '—'}</p>
        </div>
        <div className="rounded-lg bg-[#f4f6f6] px-4 py-3">
          <p className="mb-1 text-[11px] text-by-gray-light">Realizado por</p>
          <p className="text-[13px] font-medium text-by-primary">{encabezado?.realizado_por ?? '—'}</p>
        </div>
      </div>

      {esCoordinador && (
        <form action={(fd) => startTransition(() => actualizarEncabezadoDefensa(fd))} className="flex flex-wrap items-end gap-2 rounded-xl border border-black/5 bg-white p-3">
          <input type="hidden" name="nave" value={nave} />
          <div>
            <label className="mb-1 block text-[10px] text-by-gray-light">Fecha de evaluación</label>
            <input name="fecha" type="date" defaultValue={encabezado?.fecha ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-by-gray-light">Próxima revisión</label>
            <input name="proxima_revision" type="date" defaultValue={encabezado?.proxima_revision ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-by-gray-light">Realizado por</label>
            <input name="realizado_por" defaultValue={encabezado?.realizado_por ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
          </div>
          <button disabled={pendiente} className="h-8 rounded-md border border-by-accent px-3 text-[12px] text-by-accent">Guardar</button>
        </form>
      )}

      <button
        onClick={() => setSoloIncompletos(!soloIncompletos)}
        className={'w-fit rounded-md px-3 py-1.5 text-[12px] ' + (soloIncompletos ? 'bg-[#fdecea] text-[#a13c33]' : 'bg-white text-by-gray-light border border-black/10')}
      >
        {soloIncompletos ? 'Mostrando solo NO / sin respuesta' : 'Ver solo NO / sin respuesta'}
      </button>

      <div className="flex flex-col gap-3">
        {secciones.map((sec) => {
          const itemsFiltrados = soloIncompletos
            ? sec.items.filter((it) => {
                const r = respuestaDe(it.id)
                return !r || r.respuesta === 'NO' || !r.respuesta
              })
            : sec.items

          if (itemsFiltrados.length === 0) return null

          let grupoActual = ''
          return (
            <div key={sec.seccion} className="overflow-hidden rounded-xl border border-black/5 bg-white">
              <div className="bg-[#14302B] px-3 py-1.5">
                <p className="text-[11.5px] font-medium uppercase text-white">{sec.seccion}</p>
              </div>
              <div>
                {itemsFiltrados.map((it) => {
                  const mostrarGrupo = it.pregunta_grupo !== grupoActual
                  grupoActual = it.pregunta_grupo ?? ''
                  const r = respuestaDe(it.id)
                  const enEdicion = editando === it.id
                  return (
                    <div key={it.id}>
                      {mostrarGrupo && it.pregunta_grupo && (
                        <div className="bg-[#f9faf9] px-3 py-1.5">
                          <p className="text-[11px] italic text-by-gray-light">{it.pregunta_grupo}</p>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-3 border-b border-black/5 px-3 py-2 last:border-0">
                        <p className="flex-1 text-[12.5px] text-by-gray-dark">{it.item}</p>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + (r?.respuesta ? RESPUESTA_STYLE[r.respuesta] : 'bg-[#f4f6f6] text-by-gray-light')}>
                            {r?.respuesta ?? '—'}
                          </span>
                          {esCoordinador && (
                            <button onClick={() => setEditando(enEdicion ? null : it.id)} className="text-[11px] text-by-accent hover:underline">
                              {enEdicion ? 'Cerrar' : 'Editar'}
                            </button>
                          )}
                        </div>
                      </div>
                      {enEdicion && (
                        <form
                          action={(fd) =>
                            startTransition(async () => {
                              await actualizarRespuestaDefensa(fd)
                              setEditando(null)
                            })
                          }
                          className="grid grid-cols-3 gap-2 border-b border-black/5 bg-[#fafbfa] px-3 py-3"
                        >
                          <input type="hidden" name="item_id" value={it.id} />
                          <input type="hidden" name="nave" value={nave} />
                          <div className="col-span-3 flex gap-3">
                            {['SI', 'NO', 'NA'].map((v) => (
                              <label key={v} className="flex items-center gap-1 text-[12px]">
                                <input type="radio" name="respuesta" value={v} defaultChecked={r?.respuesta === v} /> {v}
                              </label>
                            ))}
                          </div>
                          <textarea name="hallazgos" placeholder="Hallazgos" defaultValue={r?.hallazgos ?? ''} rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1 text-[11.5px]" />
                          <textarea name="acciones_mejora" placeholder="Acciones de mejora" defaultValue={r?.acciones_mejora ?? ''} rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1 text-[11.5px]" />
                          <input name="responsable" placeholder="Responsable" defaultValue={r?.responsable ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[11.5px]" />
                          <input name="fecha_programada_cierre" placeholder="Fecha programada de cierre" defaultValue={r?.fecha_programada_cierre ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[11.5px]" />
                          <input name="fecha_real_cierre" placeholder="Fecha real de cierre" defaultValue={r?.fecha_real_cierre ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[11.5px]" />
                          <button disabled={pendiente} className="col-span-3 h-8 w-fit rounded-md bg-by-primary px-4 text-[12px] font-medium text-white disabled:opacity-50">
                            {pendiente ? 'Guardando…' : 'Guardar'}
                          </button>
                        </form>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
