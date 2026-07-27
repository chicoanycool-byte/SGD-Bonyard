'use client'

import { useTransition } from 'react'
import {
  crearFactor,
  eliminarFactor,
  crearParteInteresada,
  eliminarParteInteresada,
} from '../actions'

type Factor = { id: string; tipo: string; descripcion: string }
type Parte = { id: string; nombre: string; necesidad_expectativa: string | null; requisito: string | null }

export default function ContextoClient({
  esCoordinador,
  factores,
  partes,
}: {
  esCoordinador: boolean
  factores: Factor[]
  partes: Parte[]
}) {
  const [pendiente, startTransition] = useTransition()
  const internos = factores.filter((f) => f.tipo === 'interno')
  const externos = factores.filter((f) => f.tipo === 'externo')

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Contexto de la organización</p>

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-2 text-[12px] font-medium text-by-gray-dark">Factores internos</p>
            <ul className="mb-2 flex flex-col gap-1.5">
              {internos.map((f) => (
                <li key={f.id} className="flex items-start gap-2 text-[12.5px] text-by-gray-dark">
                  <span className="flex-1">• {f.descripcion}</span>
                  {esCoordinador && (
                    <button
                      onClick={() => startTransition(() => eliminarFactor(f.id))}
                      disabled={pendiente}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </li>
              ))}
              {internos.length === 0 && <li className="text-[12px] text-by-gray-light">Sin factores capturados.</li>}
            </ul>
            {esCoordinador && (
              <form action={(fd) => startTransition(() => crearFactor(fd))} className="flex gap-1.5">
                <input type="hidden" name="tipo" value="interno" />
                <input
                  name="descripcion"
                  placeholder="Nuevo factor interno…"
                  required
                  className="h-8 flex-1 rounded-md border border-black/10 px-2 text-[12px]"
                />
                <button className="rounded-md border border-by-accent px-2 text-[11.5px] text-by-accent">
                  Agregar
                </button>
              </form>
            )}
          </div>

          <div>
            <p className="mb-2 text-[12px] font-medium text-by-gray-dark">Factores externos</p>
            <ul className="mb-2 flex flex-col gap-1.5">
              {externos.map((f) => (
                <li key={f.id} className="flex items-start gap-2 text-[12.5px] text-by-gray-dark">
                  <span className="flex-1">• {f.descripcion}</span>
                  {esCoordinador && (
                    <button
                      onClick={() => startTransition(() => eliminarFactor(f.id))}
                      disabled={pendiente}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </li>
              ))}
              {externos.length === 0 && <li className="text-[12px] text-by-gray-light">Sin factores capturados.</li>}
            </ul>
            {esCoordinador && (
              <form action={(fd) => startTransition(() => crearFactor(fd))} className="flex gap-1.5">
                <input type="hidden" name="tipo" value="externo" />
                <input
                  name="descripcion"
                  placeholder="Nuevo factor externo…"
                  required
                  className="h-8 flex-1 rounded-md border border-black/10 px-2 text-[12px]"
                />
                <button className="rounded-md border border-by-accent px-2 text-[11.5px] text-by-accent">
                  Agregar
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-2 text-[12px] font-medium text-by-gray-dark">Partes interesadas</p>
        <div className="overflow-hidden rounded-lg border border-black/5">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
                <th className="px-3 py-2 font-normal">Parte</th>
                <th className="px-3 py-2 font-normal">Necesidad / expectativa</th>
                <th className="px-3 py-2 font-normal">Requisito</th>
                {esCoordinador && <th className="px-3 py-2 font-normal"></th>}
              </tr>
            </thead>
            <tbody>
              {partes.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="px-3 py-2 text-by-gray-dark">{p.nombre}</td>
                  <td className="px-3 py-2 text-by-gray-light">{p.necesidad_expectativa ?? '—'}</td>
                  <td className="px-3 py-2 text-by-gray-light">{p.requisito ?? '—'}</td>
                  {esCoordinador && (
                    <td className="px-3 py-2">
                      <button
                        onClick={() => startTransition(() => eliminarParteInteresada(p.id))}
                        disabled={pendiente}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {partes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-[12px] text-by-gray-light">
                    Sin partes interesadas capturadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {esCoordinador && (
          <form
            action={(fd) => startTransition(() => crearParteInteresada(fd))}
            className="mt-3 grid grid-cols-4 gap-2"
          >
            <input name="nombre" placeholder="Parte interesada" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="necesidad_expectativa" placeholder="Necesidad / expectativa" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="requisito" placeholder="Requisito" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="rounded-md border border-by-accent px-2 text-[11.5px] text-by-accent">Agregar</button>
          </form>
        )}
      </div>
    </div>
  )
}
