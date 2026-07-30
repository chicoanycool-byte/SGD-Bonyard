'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  crearItemInventario, eliminarItemInventario, guardarValorInventario,
  crearIncidenteVidrio, eliminarIncidenteVidrio,
} from './actions'

type Item = { id: string; nave: string; area: string; nombre_item: string; orden: number }
type Valor = {
  id: string; item_id: string; anio: number; bimestre: number
  cantidad: number | null; vidrio: number | null; acrilico: number | null
  condicion: string | null; observaciones: string | null
}
type Incidente = {
  id: string; folio: string | null; nave: string | null; fecha: string; ubicacion: string | null
  descripcion: string | null; tipo: string | null; reportado_por: string | null
  contamino_producto: boolean | null; producto_afectado: string | null; disposicion_producto: string | null
  acciones_tomadas: string | null; disposicion_vidrio: string | null; responsable_reinspeccion: string | null
  observaciones: string | null
}

const BIMESTRES = [
  { id: 1, label: 'Enero–Febrero' },
  { id: 2, label: 'Marzo–Abril' },
  { id: 3, label: 'Mayo–Junio' },
  { id: 4, label: 'Julio–Agosto' },
  { id: 5, label: 'Septiembre–Octubre' },
  { id: 6, label: 'Noviembre–Diciembre' },
]

function FilaInventario({
  item,
  valor,
  anio,
  bimestre,
  esCoordinador,
  onEliminar,
}: {
  item: Item
  valor: Valor | undefined
  anio: number
  bimestre: number
  esCoordinador: boolean
  onEliminar: () => void
}) {
  const [pendiente, startTransition] = useTransition()
  const [guardado, setGuardado] = useState(false)

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          await guardarValorInventario(fd)
          setGuardado(true)
          setTimeout(() => setGuardado(false), 1500)
        })
      }
      className="grid grid-cols-12 items-center gap-1.5 border-b border-black/5 px-3 py-1.5 last:border-0"
    >
      <input type="hidden" name="item_id" value={item.id} />
      <input type="hidden" name="anio" value={anio} />
      <input type="hidden" name="bimestre" value={bimestre} />
      <span className="col-span-3 text-[12px] text-by-gray-dark">{item.nombre_item}</span>
      <input name="cantidad" type="number" defaultValue={valor?.cantidad ?? ''} placeholder="Cant." disabled={!esCoordinador} className="col-span-1 h-7 rounded-md border border-black/10 px-1.5 text-[11.5px]" />
      <input name="vidrio" type="number" defaultValue={valor?.vidrio ?? ''} placeholder="Vidrio" disabled={!esCoordinador} className="col-span-1 h-7 rounded-md border border-black/10 px-1.5 text-[11.5px]" />
      <input name="acrilico" type="number" defaultValue={valor?.acrilico ?? ''} placeholder="Acríl." disabled={!esCoordinador} className="col-span-1 h-7 rounded-md border border-black/10 px-1.5 text-[11.5px]" />
      <select name="condicion" defaultValue={valor?.condicion ?? ''} disabled={!esCoordinador} className="col-span-2 h-7 rounded-md border border-black/10 px-1.5 text-[11.5px]">
        <option value="">—</option>
        <option value="bueno">Buen estado</option>
        <option value="malo">Mal estado</option>
      </select>
      <input name="observaciones" defaultValue={valor?.observaciones ?? ''} placeholder="Obs." disabled={!esCoordinador} className="col-span-3 h-7 rounded-md border border-black/10 px-1.5 text-[11.5px]" />
      {esCoordinador && (
        <div className="col-span-1 flex items-center gap-2">
          <button disabled={pendiente} className="text-[10.5px] text-by-accent hover:underline">
            {pendiente ? '…' : guardado ? '✓' : 'Guardar'}
          </button>
          <button type="button" onClick={onEliminar} className="text-[10.5px] text-red-500 hover:underline">×</button>
        </div>
      )}
    </form>
  )
}

export default function VidrioPlasticoClient({
  esCoordinador,
  items,
  valores,
  incidentes,
}: {
  esCoordinador: boolean
  items: Item[]
  valores: Valor[]
  incidentes: Incidente[]
}) {
  const [tab, setTab] = useState<'inventario' | 'incidentes'>('inventario')
  const [pendiente, startTransition] = useTransition()

  // ---------- Inventario ----------
  const hoy = new Date()
  const naves = useMemo(() => [...new Set(items.map((i) => i.nave))].sort(), [items])
  const [naveSel, setNaveSel] = useState<string>('')
  const [anioSel, setAnioSel] = useState<number>(hoy.getFullYear())
  const [bimestreSel, setBimestreSel] = useState<number | null>(null)
  const [mostrarAgregar, setMostrarAgregar] = useState(false)

  const itemsNave = items.filter((i) => i.nave === naveSel)
  const areas = useMemo(() => {
    const grupos: { area: string; items: Item[] }[] = []
    for (const it of itemsNave) {
      let g = grupos.find((x) => x.area === it.area)
      if (!g) {
        g = { area: it.area, items: [] }
        grupos.push(g)
      }
      g.items.push(it)
    }
    return grupos
  }, [itemsNave])

  function valorDe(itemId: string) {
    return valores.find((v) => v.item_id === itemId && v.anio === anioSel && v.bimestre === bimestreSel)
  }

  // ---------- Incidentes filtros ----------
  const [filtroNave, setFiltroNave] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [mostrarFormIncidente, setMostrarFormIncidente] = useState(false)

  const incidentesFiltrados = incidentes.filter((i) => {
    if (filtroNave && i.nave !== filtroNave) return false
    if (filtroDesde && i.fecha < filtroDesde) return false
    if (filtroHasta && i.fecha > filtroHasta) return false
    return true
  })

  const paramsExport = new URLSearchParams()
  if (filtroNave) paramsExport.set('nave', filtroNave)
  if (filtroDesde) paramsExport.set('desde', filtroDesde)
  if (filtroHasta) paramsExport.set('hasta', filtroHasta)

  const paramsInventario = new URLSearchParams()
  if (naveSel) paramsInventario.set('nave', naveSel)
  paramsInventario.set('anio', String(anioSel))
  if (bimestreSel) paramsInventario.set('bimestre', String(bimestreSel))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">Vidrio y Plástico Duro Quebradizo</p>
        <div className="flex gap-2">
          <button onClick={() => setTab('inventario')} className={'rounded-md px-3 py-1.5 text-[12px] ' + (tab === 'inventario' ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')}>
            Inventario (FSG-39)
          </button>
          <button onClick={() => setTab('incidentes')} className={'rounded-md px-3 py-1.5 text-[12px] ' + (tab === 'incidentes' ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')}>
            Reporte de Incidentes (FSG-40)
          </button>
        </div>
      </div>

      {tab === 'inventario' && (
        <>
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-black/5 bg-white p-4">
            <div>
              <label className="mb-1 block text-[10.5px] text-by-gray-light">Nave</label>
              <select value={naveSel} onChange={(e) => setNaveSel(e.target.value)} className="h-8 w-40 rounded-md border border-black/10 px-2 text-[12px]">
                <option value="">Selecciona…</option>
                {[...new Set([...naves, 'Nave 1', 'Nave 2'])].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] text-by-gray-light">Año</label>
              <select value={anioSel} onChange={(e) => setAnioSel(Number(e.target.value))} className="h-8 w-28 rounded-md border border-black/10 px-2 text-[12px]">
                {[hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] text-by-gray-light">Periodo (bimestre)</label>
              <select value={bimestreSel ?? ''} onChange={(e) => setBimestreSel(e.target.value ? Number(e.target.value) : null)} className="h-8 w-44 rounded-md border border-black/10 px-2 text-[12px]">
                <option value="">Selecciona…</option>
                {BIMESTRES.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </div>
            {naveSel && bimestreSel && (
              <div className="ml-auto flex gap-2">
                <a href={`/inocuidad-alimentaria/vidrio-plastico/exportar/pdf?tipo=inventario&${paramsInventario.toString()}`} target="_blank" className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">
                  PDF
                </a>
                <a href={`/inocuidad-alimentaria/vidrio-plastico/exportar/excel?tipo=inventario&${paramsInventario.toString()}`} className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">
                  Excel
                </a>
              </div>
            )}
          </div>

          {!naveSel || !bimestreSel ? (
            <div className="rounded-xl border border-black/5 bg-white p-8 text-center text-[12.5px] text-by-gray-light">
              Selecciona nave y periodo para ver y llenar el inventario.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
                <div className="grid grid-cols-12 gap-1.5 border-b border-black/5 bg-[#14302B] px-3 py-2 text-[10px] uppercase text-white">
                  <span className="col-span-3">Artículo</span>
                  <span className="col-span-1">Cant.</span>
                  <span className="col-span-1">Vidrio</span>
                  <span className="col-span-1">Acríl.</span>
                  <span className="col-span-2">Condición</span>
                  <span className="col-span-3">Observaciones</span>
                  {esCoordinador && <span className="col-span-1"></span>}
                </div>
                {areas.map((g) => (
                  <div key={g.area}>
                    <div className="bg-[#f4f6f6] px-3 py-1.5">
                      <p className="text-[11px] font-medium uppercase text-by-gray-dark">{g.area}</p>
                    </div>
                    {g.items.map((it) => (
                      <FilaInventario
                        key={it.id}
                        item={it}
                        valor={valorDe(it.id)}
                        anio={anioSel}
                        bimestre={bimestreSel}
                        esCoordinador={esCoordinador}
                        onEliminar={() => startTransition(() => eliminarItemInventario(it.id))}
                      />
                    ))}
                  </div>
                ))}
                {areas.length === 0 && (
                  <div className="px-3 py-6 text-center text-[12px] text-by-gray-light">Sin artículos capturados para {naveSel}.</div>
                )}
              </div>

              {esCoordinador && (
                <div className="rounded-xl border border-black/5 bg-white p-4">
                  <button onClick={() => setMostrarAgregar(!mostrarAgregar)} className="text-[12px] text-by-accent hover:underline">
                    {mostrarAgregar ? 'Cancelar' : '+ Agregar artículo'}
                  </button>
                  {mostrarAgregar && (
                    <form
                      action={(fd) =>
                        startTransition(async () => {
                          await crearItemInventario(fd)
                          setMostrarAgregar(false)
                        })
                      }
                      className="mt-3 grid grid-cols-4 gap-2"
                    >
                      <input type="hidden" name="nave" value={naveSel} />
                      <input name="area" placeholder="Área (ej. OFICINA)" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                      <input name="nombre_item" placeholder="Artículo" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                      <button className="h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">Agregar</button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'incidentes' && (
        <>
          <div className="flex flex-wrap items-end gap-2 rounded-xl border border-black/5 bg-white p-4">
            <div>
              <label className="mb-1 block text-[10.5px] text-by-gray-light">Nave</label>
              <select value={filtroNave} onChange={(e) => setFiltroNave(e.target.value)} className="h-8 w-36 rounded-md border border-black/10 px-2 text-[12px]">
                <option value="">Todas</option>
                <option value="Nave 1">Nave 1</option>
                <option value="Nave 2">Nave 2</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] text-by-gray-light">Desde</label>
              <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] text-by-gray-light">Hasta</label>
              <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            </div>
            <div className="ml-auto flex gap-2">
              <a href={`/inocuidad-alimentaria/vidrio-plastico/exportar/pdf?tipo=incidentes&${paramsExport.toString()}`} target="_blank" className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">
                PDF
              </a>
              <a href={`/inocuidad-alimentaria/vidrio-plastico/exportar/excel?tipo=incidentes&${paramsExport.toString()}`} className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">
                Excel
              </a>
              {esCoordinador && (
                <button onClick={() => setMostrarFormIncidente(!mostrarFormIncidente)} className="h-8 rounded-md bg-by-primary px-4 text-[12px] font-medium text-white">
                  {mostrarFormIncidente ? 'Cancelar' : 'Nuevo incidente'}
                </button>
              )}
            </div>
          </div>

          {mostrarFormIncidente && (
            <form
              action={(fd) =>
                startTransition(async () => {
                  await crearIncidenteVidrio(fd)
                  setMostrarFormIncidente(false)
                })
              }
              className="grid grid-cols-3 gap-2 rounded-xl border border-black/5 bg-white p-4"
            >
              <select name="nave" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                <option value="">Nave…</option>
                <option value="Nave 1">Nave 1</option>
                <option value="Nave 2">Nave 2</option>
              </select>
              <input name="fecha" type="date" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="ubicacion" placeholder="Ubicación del incidente" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <textarea name="descripcion" placeholder="Descripción del incidente" required rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
              <select name="tipo" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                <option value="" disabled>Tipo…</option>
                <option value="Vidrio">Vidrio</option>
                <option value="Plástico duro">Plástico duro</option>
                <option value="Materia extraña">Materia extraña</option>
              </select>
              <input name="reportado_por" placeholder="Reportado por" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <select name="contamino_producto" defaultValue="no" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                <option value="no">¿Contaminó producto? No</option>
                <option value="si">¿Contaminó producto? Sí</option>
              </select>
              <input name="producto_afectado" placeholder="Producto afectado y cantidad (si aplica)" className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="disposicion_producto" placeholder="Disposición final del producto afectado" className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <textarea name="acciones_tomadas" placeholder="Acciones tomadas para atender el incidente" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
              <input name="disposicion_vidrio" placeholder="Disposición del vidrio/plástico/materia extraña" className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="responsable_reinspeccion" placeholder="Responsable de la re-inspección y liberación" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="observaciones" placeholder="Observaciones" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <button disabled={pendiente} className="col-span-3 h-8 w-fit rounded-md bg-by-primary px-4 text-[12px] font-medium text-white disabled:opacity-50">
                {pendiente ? 'Guardando…' : 'Guardar incidente'}
              </button>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
            <table className="w-full text-left text-[11.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
                  <th className="px-2 py-2 font-normal">Folio</th>
                  <th className="px-2 py-2 font-normal">Fecha</th>
                  <th className="px-2 py-2 font-normal">Nave</th>
                  <th className="px-2 py-2 font-normal">Ubicación</th>
                  <th className="px-2 py-2 font-normal">Descripción</th>
                  <th className="px-2 py-2 font-normal">Tipo</th>
                  <th className="px-2 py-2 font-normal">Reportado por</th>
                  <th className="px-2 py-2 font-normal">¿Contaminó?</th>
                  <th className="px-2 py-2 font-normal">Acciones tomadas</th>
                  <th className="px-2 py-2 font-normal">Responsable re-inspección</th>
                  {esCoordinador && <th className="px-2 py-2 font-normal"></th>}
                </tr>
              </thead>
              <tbody>
                {incidentesFiltrados.map((i) => (
                  <tr key={i.id} className="border-b border-black/5 last:border-0">
                    <td className="px-2 py-1.5 text-by-gray-light">{i.folio}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{new Date(i.fecha + 'T00:00:00').toLocaleDateString('es-MX')}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{i.nave ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{i.ubicacion ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-dark">{i.descripcion ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{i.tipo ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{i.reportado_por ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{i.contamino_producto ? 'Sí' : 'No'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{i.acciones_tomadas ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{i.responsable_reinspeccion ?? '—'}</td>
                    {esCoordinador && (
                      <td className="px-2 py-1.5">
                        <button onClick={() => startTransition(() => eliminarIncidenteVidrio(i.id))} className="text-[10.5px] text-red-500 hover:underline">Eliminar</button>
                      </td>
                    )}
                  </tr>
                ))}
                {incidentesFiltrados.length === 0 && (
                  <tr><td colSpan={11} className="px-3 py-6 text-center text-[12px] text-by-gray-light">Sin incidentes que coincidan con estos filtros.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
