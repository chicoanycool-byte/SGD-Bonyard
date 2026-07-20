'use client'

import { useState, useTransition } from 'react'
import { actualizarPlanAccion, agregarPlanAccion } from '../actions'

type Usuario = { id: string; nombre: string }

type Item = {
  id: string
  numero: number
  norma_ley: string | null
  articulo: string | null
  descripcion_hallazgo: string | null
  nivel_riesgo: string | null
  accion_propuesta: string | null
  responsable: string | null
  responsable_id: string | null
  fecha_compromiso: string | null
  fecha_cierre_real: string | null
  estatus: string
}

const RIESGO_ESTILO: Record<string, string> = {
  CRÍTICO: 'bg-[#fdecea] text-[#a13c33]',
  MAYOR: 'bg-[#fdf3e3] text-[#9a6b1c]',
  MENOR: 'bg-[#f1efe8] text-[#5f5e5a]',
}

function FilaPlan({
  item,
  usuarios,
  puedeEditar,
}: {
  item: Item
  usuarios: Usuario[]
  puedeEditar: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [responsableId, setResponsableId] = useState(item.responsable_id ?? '')
  const [fechaCompromiso, setFechaCompromiso] = useState(item.fecha_compromiso ?? '')
  const [fechaCierre, setFechaCierre] = useState(item.fecha_cierre_real ?? '')

  function guardar(campos: Parameters<typeof actualizarPlanAccion>[1]) {
    startTransition(() => actualizarPlanAccion(item.id, campos))
  }

  const inputCls = 'h-8 w-full rounded-md border border-black/10 px-2 text-[12px]'

  return (
    <tr className="border-b border-black/5 align-top last:border-0">
      <td className="px-2 py-2 text-by-gray-light">{item.numero}</td>
      <td className="min-w-[140px] px-2 py-2 text-by-gray-dark">{item.norma_ley}</td>
      <td className="px-2 py-2 text-by-gray-light">{item.articulo}</td>
      <td className="min-w-[220px] px-2 py-2 text-by-gray-light">{item.descripcion_hallazgo}</td>
      <td className="px-2 py-2">
        <span
          className={
            'rounded-full px-2 py-0.5 text-[11px] ' +
            (RIESGO_ESTILO[item.nivel_riesgo ?? ''] ?? '')
          }
        >
          {item.nivel_riesgo}
        </span>
      </td>
      <td className="min-w-[220px] px-2 py-2 text-by-gray-light">{item.accion_propuesta}</td>
      <td className="min-w-[150px] px-2 py-2">
        {puedeEditar ? (
          <select
            disabled={pending}
            value={responsableId}
            onChange={(e) => {
              setResponsableId(e.target.value)
              guardar({ responsable_id: e.target.value || null })
            }}
            className={inputCls}
          >
            <option value="">{item.responsable ? `— ${item.responsable} —` : '— Sin asignar —'}</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        ) : (
          item.responsable
        )}
      </td>
      <td className="px-2 py-2">
        {puedeEditar ? (
          <input
            disabled={pending}
            type="date"
            value={fechaCompromiso}
            onChange={(e) => {
              setFechaCompromiso(e.target.value)
              guardar({ fecha_compromiso: e.target.value })
            }}
            className={inputCls}
          />
        ) : (
          item.fecha_compromiso
        )}
      </td>
      <td className="px-2 py-2">
        {puedeEditar ? (
          <input
            disabled={pending}
            type="date"
            value={fechaCierre}
            onChange={(e) => {
              setFechaCierre(e.target.value)
              guardar({
                fecha_cierre_real: e.target.value,
                estatus: e.target.value ? 'Cerrado' : 'Abierto',
              })
            }}
            className={inputCls}
          />
        ) : (
          item.fecha_cierre_real ?? '—'
        )}
      </td>
      <td className="px-2 py-2">
        <span
          className={
            'rounded-full px-2 py-0.5 text-[11px] ' +
            (item.estatus === 'Cerrado'
              ? 'bg-[#eaf5f0] text-[#3d6b53]'
              : 'bg-[#e6f0fa] text-[#2d5f8a]')
          }
        >
          {item.estatus}
        </span>
      </td>
    </tr>
  )
}

export default function PlanAccionTabla({
  items,
  usuarios,
  puedeEditar,
}: {
  items: Item[]
  usuarios: Usuario[]
  puedeEditar: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [mostrarForm, setMostrarForm] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {puedeEditar && (
        <div>
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="text-[12px] text-by-accent hover:underline"
          >
            {mostrarForm ? 'Ocultar' : '+ Agregar hallazgo al plan de acción'}
          </button>
        </div>
      )}

      {mostrarForm && puedeEditar && (
        <form
          action={(fd) => startTransition(() => agregarPlanAccion(fd))}
          className="grid grid-cols-3 gap-2 rounded-xl border border-black/5 bg-white p-3"
        >
          <input name="norma_ley" placeholder="Norma / Ley" className="h-8 rounded-md border border-black/10 px-2 text-[12.5px]" />
          <input name="articulo" placeholder="Artículo" className="h-8 rounded-md border border-black/10 px-2 text-[12.5px]" />
          <select name="nivel_riesgo" defaultValue="MENOR" className="h-8 rounded-md border border-black/10 px-2 text-[12.5px]">
            <option value="CRÍTICO">Crítico</option>
            <option value="MAYOR">Mayor</option>
            <option value="MENOR">Menor</option>
          </select>
          <input name="descripcion_hallazgo" placeholder="Descripción del hallazgo" className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12.5px]" />
          <input name="accion_propuesta" placeholder="Acción correctiva propuesta" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12.5px]" />
          <select name="responsable_id" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12.5px]">
            <option value="">— Sin asignar —</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
          <input name="fecha_compromiso" type="date" className="h-8 rounded-md border border-black/10 px-2 text-[12.5px]" />
          <button
            type="submit"
            disabled={pending}
            className="col-span-1 h-8 w-fit rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-60"
          >
            Agregar
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-2 py-2 font-normal">No.</th>
              <th className="px-2 py-2 font-normal">Norma / Ley</th>
              <th className="px-2 py-2 font-normal">Artículo</th>
              <th className="px-2 py-2 font-normal">Descripción del hallazgo</th>
              <th className="px-2 py-2 font-normal">Nivel de riesgo</th>
              <th className="px-2 py-2 font-normal">Acción correctiva propuesta</th>
              <th className="px-2 py-2 font-normal">Responsable</th>
              <th className="px-2 py-2 font-normal">Fecha compromiso</th>
              <th className="px-2 py-2 font-normal">Fecha cierre real</th>
              <th className="px-2 py-2 font-normal">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <FilaPlan key={item.id} item={item} usuarios={usuarios} puedeEditar={puedeEditar} />
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  Sin hallazgos en el plan de acción.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
