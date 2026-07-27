'use client'

import { useTransition } from 'react'
import { crearMiembroEquipo, eliminarMiembroEquipo } from '../actions'

type Miembro = { id: string; nombre: string; puesto: string | null; rol_equipo: string; area_especialidad: string | null }

export default function EquipoHaccpClient({
  esCoordinador,
  equipo,
}: {
  esCoordinador: boolean
  equipo: Miembro[]
}) {
  const [pendiente, startTransition] = useTransition()
  const lider = equipo.filter((m) => m.rol_equipo === 'lider')
  const miembros = equipo.filter((m) => m.rol_equipo === 'miembro')

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Equipo HACCP</p>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Nombre</th>
              <th className="px-3 py-2 font-normal">Puesto</th>
              <th className="px-3 py-2 font-normal">Rol en el equipo</th>
              <th className="px-3 py-2 font-normal">Área / especialidad</th>
              {esCoordinador && <th className="px-3 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {[...lider, ...miembros].map((m) => (
              <tr key={m.id} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-2 text-by-gray-dark">{m.nombre}</td>
                <td className="px-3 py-2 text-by-gray-light">{m.puesto ?? '—'}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-[11px] ' +
                      (m.rol_equipo === 'lider' ? 'bg-[#f0eafa] text-[#6b4fa0]' : 'bg-[#f1efe8] text-[#5f5e5a]')
                    }
                  >
                    {m.rol_equipo === 'lider' ? 'Líder' : 'Miembro'}
                  </span>
                </td>
                <td className="px-3 py-2 text-by-gray-light">{m.area_especialidad ?? '—'}</td>
                {esCoordinador && (
                  <td className="px-3 py-2">
                    <button
                      onClick={() => startTransition(() => eliminarMiembroEquipo(m.id))}
                      disabled={pendiente}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {equipo.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin equipo capturado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {esCoordinador && (
        <form
          action={(fd) => startTransition(() => crearMiembroEquipo(fd))}
          className="rounded-xl border border-black/5 bg-white p-4"
        >
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Agregar integrante</p>
          <div className="grid grid-cols-4 gap-2">
            <input name="nombre" placeholder="Nombre" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="puesto" placeholder="Puesto" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <select name="rol_equipo" defaultValue="miembro" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="lider">Líder</option>
              <option value="miembro">Miembro</option>
            </select>
            <input name="area_especialidad" placeholder="Área / especialidad" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">Agregar</button>
          </div>
        </form>
      )}
    </div>
  )
}
