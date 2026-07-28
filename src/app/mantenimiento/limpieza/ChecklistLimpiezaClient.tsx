'use client'

import { useMemo, useState, useTransition } from 'react'
import { crearChecklistLimpieza, eliminarChecklistLimpieza } from './actions'

type ItemCatalogo = { id: string; categoria: string; item: string; orden: number }
type Registro = {
  id: string
  folio: string | null
  nave: string
  fecha: string
  auditor_nombre: string | null
  receptor_nombre: string | null
  pct: number | null
}

export default function ChecklistLimpiezaClient({
  catalogo,
  registros,
}: {
  catalogo: ItemCatalogo[]
  registros: Registro[]
}) {
  const [pendiente, startTransition] = useTransition()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [naveFiltro, setNaveFiltro] = useState<'Nave 1' | 'Nave 2'>('Nave 1')

  const categorias = useMemo(() => {
    const grupos: { categoria: string; items: ItemCatalogo[] }[] = []
    for (const it of catalogo) {
      let g = grupos.find((x) => x.categoria === it.categoria)
      if (!g) {
        g = { categoria: it.categoria, items: [] }
        grupos.push(g)
      }
      g.items.push(it)
    }
    return grupos
  }, [catalogo])

  const registrosFiltrados = registros.filter((r) => r.nave === naveFiltro)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Check List de Limpieza e Integridad de la Nave <span className="text-[11px] font-normal text-by-gray-light">(FMT-04)</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {(['Nave 1', 'Nave 2'] as const).map((n) => (
              <button
                key={n}
                onClick={() => setNaveFiltro(n)}
                className={
                  'rounded-md px-3 py-1.5 text-[12px] ' +
                  (naveFiltro === n ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')
                }
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white"
          >
            {mostrarForm ? 'Cancelar' : 'Nuevo checklist'}
          </button>
        </div>
      </div>

      {mostrarForm && (
        <form
          action={(fd) =>
            startTransition(async () => {
              await crearChecklistLimpieza(fd)
              setMostrarForm(false)
            })
          }
          className="flex flex-col gap-4 rounded-xl border border-black/5 bg-white p-4"
        >
          <div className="grid grid-cols-4 gap-2">
            <select name="nave" defaultValue={naveFiltro} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="Nave 1">Nave 1</option>
              <option value="Nave 2">Nave 2</option>
            </select>
            <input name="fecha" type="date" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="auditor_nombre" placeholder="Nombre y firma del auditor" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="receptor_nombre" placeholder="Nombre del que recibe por enterado" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
          </div>

          {categorias.map((g) => (
            <div key={g.categoria} className="overflow-hidden rounded-lg border border-black/5">
              <div className="bg-[#14302B] px-3 py-1.5">
                <p className="text-[11.5px] font-medium uppercase text-white">{g.categoria}</p>
              </div>
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
                    <th className="px-2 py-1.5 font-normal">Item</th>
                    <th className="w-12 px-1 py-1.5 text-center font-normal">Sí</th>
                    <th className="w-12 px-1 py-1.5 text-center font-normal">No</th>
                    <th className="w-12 px-1 py-1.5 text-center font-normal">NA</th>
                    <th className="px-2 py-1.5 font-normal">Ubicación del daño</th>
                    <th className="px-2 py-1.5 font-normal">Comentarios</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((it) => (
                    <tr key={it.id} className="border-b border-black/5 last:border-0">
                      <td className="px-2 py-1.5 text-by-gray-dark">{it.item}</td>
                      <td className="px-1 py-1.5 text-center">
                        <input type="radio" name={`cumple_${it.id}`} value="SI" defaultChecked className="h-3.5 w-3.5" />
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <input type="radio" name={`cumple_${it.id}`} value="NO" className="h-3.5 w-3.5" />
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <input type="radio" name={`cumple_${it.id}`} value="NA" className="h-3.5 w-3.5" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input name={`ubicacion_${it.id}`} placeholder="—" className="h-7 w-full rounded-md border border-black/10 px-1.5 text-[11px]" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input name={`comentarios_${it.id}`} placeholder="—" className="h-7 w-full rounded-md border border-black/10 px-1.5 text-[11px]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Comentarios extras</label>
            <textarea name="comentarios_extra" rows={2} className="w-full rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
          </div>

          <button disabled={pendiente} className="h-9 w-fit rounded-md bg-by-primary px-5 text-[13px] font-medium text-white disabled:opacity-50">
            {pendiente ? 'Guardando…' : 'Guardar checklist'}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Folio</th>
              <th className="px-3 py-2 font-normal">Fecha</th>
              <th className="px-3 py-2 font-normal">Auditor</th>
              <th className="px-3 py-2 font-normal">Recibió</th>
              <th className="px-3 py-2 font-normal">% Cumplimiento</th>
              <th className="px-3 py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.map((r) => (
              <tr key={r.id} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-2 text-by-gray-light">{r.folio}</td>
                <td className="px-3 py-2 text-by-gray-dark">{new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-MX')}</td>
                <td className="px-3 py-2 text-by-gray-light">{r.auditor_nombre ?? '—'}</td>
                <td className="px-3 py-2 text-by-gray-light">{r.receptor_nombre ?? '—'}</td>
                <td className="px-3 py-2">
                  {r.pct != null ? (
                    <span className={'font-medium ' + (r.pct >= 85 ? 'text-[#3d6b53]' : 'text-[#a13c33]')}>{r.pct.toFixed(0)}%</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <a href={`/mantenimiento/limpieza/exportar/pdf?id=${r.id}`} className="text-[11px] text-by-accent hover:underline">
                      Descargar PDF
                    </a>
                    <button
                      onClick={() => startTransition(() => eliminarChecklistLimpieza(r.id))}
                      disabled={pendiente}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {registrosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin checklists capturados para {naveFiltro}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
