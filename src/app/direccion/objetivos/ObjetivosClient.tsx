'use client'

import { useTransition } from 'react'
import { crearObjetivo, eliminarObjetivo } from '../actions'

type Objetivo = {
  id: string
  descripcion: string
  meta_texto: string | null
  indicador_nombre: string | null
  responsable_nombre: string | null
  meta_operador: string | null
  meta_valor: number | null
  ultimo_valor: number | null
}
type Indicador = { id: string; nombre: string }
type Usuario = { id: string; nombre: string }

function cumpleMeta(operador: string | null, metaValor: number | null, valor: number | null) {
  if (operador === null || metaValor === null || valor === null) return null
  if (operador === 'gte') return valor >= metaValor
  if (operador === 'lte') return valor <= metaValor
  if (operador === 'lt') return valor < metaValor
  if (operador === 'eq') return valor === metaValor
  return null
}

export default function ObjetivosClient({
  esCoordinador,
  objetivos,
  indicadores,
  usuarios,
}: {
  esCoordinador: boolean
  objetivos: Objetivo[]
  indicadores: Indicador[]
  usuarios: Usuario[]
}) {
  const [pendiente, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Objetivos de calidad</p>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Objetivo</th>
              <th className="px-3 py-2 font-normal">Meta</th>
              <th className="px-3 py-2 font-normal">Indicador ligado</th>
              <th className="px-3 py-2 font-normal">Responsable</th>
              <th className="px-3 py-2 font-normal">Estatus</th>
              {esCoordinador && <th className="px-3 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {objetivos.map((o) => {
              const cumple = cumpleMeta(o.meta_operador, o.meta_valor, o.ultimo_valor)
              return (
                <tr key={o.id} className="border-b border-black/5 last:border-0">
                  <td className="px-3 py-2 text-by-gray-dark">{o.descripcion}</td>
                  <td className="px-3 py-2 text-by-gray-light">{o.meta_texto ?? '—'}</td>
                  <td className="px-3 py-2 text-by-gray-light">{o.indicador_nombre ?? '—'}</td>
                  <td className="px-3 py-2 text-by-gray-light">{o.responsable_nombre ?? '—'}</td>
                  <td className="px-3 py-2">
                    {cumple === null ? (
                      <span className="rounded-full bg-[#f1efe8] px-2 py-0.5 text-[11px] text-[#5f5e5a]">Sin dato</span>
                    ) : cumple ? (
                      <span className="rounded-full bg-[#eaf5f0] px-2 py-0.5 text-[11px] text-[#3d6b53]">En meta</span>
                    ) : (
                      <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[11px] text-[#a13c33]">En riesgo</span>
                    )}
                  </td>
                  {esCoordinador && (
                    <td className="px-3 py-2">
                      <button
                        onClick={() => startTransition(() => eliminarObjetivo(o.id))}
                        disabled={pendiente}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
            {objetivos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin objetivos capturados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {esCoordinador && (
        <form
          action={(fd) => startTransition(() => crearObjetivo(fd))}
          className="rounded-xl border border-black/5 bg-white p-4"
        >
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Nuevo objetivo</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              name="descripcion"
              placeholder="Descripción del objetivo"
              required
              className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]"
            />
            <input name="meta_texto" placeholder="Meta (texto libre, ej. ≥ 90%)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <select name="indicador_id" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="">Sin indicador ligado</option>
              {indicadores.map((i) => (
                <option key={i.id} value={i.id}>{i.nombre}</option>
              ))}
            </select>
            <select name="responsable_id" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="">Sin responsable</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
            <button className="h-8 rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Agregar objetivo
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
