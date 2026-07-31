'use client'

import { useMemo, useState, useTransition } from 'react'
import { crearMiembroEquipo, eliminarMiembroEquipo } from '../actions'

type Miembro = {
  id: string
  nombre: string
  puesto: string | null
  rol_equipo: string
  nave: string | null
  medios_localizacion: string | null
  escolaridad: string | null
  conocimientos: string | null
  experiencia: string | null
}

const ROL_LABEL: Record<string, string> = { lider: 'Líder', suplente: 'Suplente', miembro: 'Miembro' }
const ROL_STYLE: Record<string, string> = {
  lider: 'bg-[#f0eafa] text-[#6b4fa0]',
  suplente: 'bg-[#eaf1fa] text-[#3c6ba1]',
  miembro: 'bg-[#f1efe8] text-[#5f5e5a]',
}

export default function EquipoHaccpClient({
  esCoordinador,
  equipo,
}: {
  esCoordinador: boolean
  equipo: Miembro[]
}) {
  const [pendiente, startTransition] = useTransition()
  const [expandido, setExpandido] = useState<string | null>(null)
  const naves = useMemo(() => [...new Set(equipo.map((m) => m.nave ?? 'Nave 1'))].sort(), [equipo])
  const [naveFiltro, setNaveFiltro] = useState(naves[0] ?? 'Nave 1')

  const orden = { lider: 0, suplente: 1, miembro: 2 } as Record<string, number>
  const filtrado = equipo
    .filter((m) => (m.nave ?? 'Nave 1') === naveFiltro)
    .sort((a, b) => (orden[a.rol_equipo] ?? 9) - (orden[b.rol_equipo] ?? 9))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <a href="/plan-haccp/exportar/excel" className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">
          Exportar Excel (Plan HACCP completo)
        </a>
        <a href="/plan-haccp/exportar/pdf" target="_blank" className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">
          Exportar PDF (Plan HACCP completo)
        </a>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Equipo HACCP (FSG-29)</p>
        <div className="flex gap-2">
          {naves.map((n) => (
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
      </div>

      <div className="flex flex-col gap-2">
        {filtrado.map((m) => {
          const abierto = expandido === m.id
          return (
            <div key={m.id} className="overflow-hidden rounded-xl border border-black/5 bg-white">
              <button onClick={() => setExpandido(abierto ? null : m.id)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                <div>
                  <span className="text-[13px] font-medium text-by-gray-dark">{m.nombre}</span>
                  <span className="ml-2 text-[11.5px] text-by-gray-light">{m.puesto}</span>
                </div>
                <span className={'rounded-full px-2 py-0.5 text-[10.5px] font-medium ' + (ROL_STYLE[m.rol_equipo] ?? '')}>
                  {ROL_LABEL[m.rol_equipo] ?? m.rol_equipo}
                </span>
              </button>
              {abierto && (
                <div className="grid grid-cols-2 gap-3 border-t border-black/5 p-4 text-[12px]">
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Medios de localización</p>
                    <p className="text-by-gray-dark">{m.medios_localizacion ?? '—'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Nivel de escolaridad</p>
                    <p className="text-by-gray-dark">{m.escolaridad ?? '—'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Conocimientos</p>
                    <p className="whitespace-pre-line text-by-gray-dark">{m.conocimientos ?? '—'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Experiencia</p>
                    <p className="whitespace-pre-line text-by-gray-dark">{m.experiencia ?? '—'}</p>
                  </div>
                  {esCoordinador && (
                    <button
                      onClick={() => startTransition(() => eliminarMiembroEquipo(m.id))}
                      disabled={pendiente}
                      className="col-span-2 w-fit text-[11px] text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {filtrado.length === 0 && (
          <div className="rounded-xl border border-black/5 bg-white p-6 text-center text-[12px] text-by-gray-light">
            Sin equipo capturado para {naveFiltro}.
          </div>
        )}
      </div>

      {esCoordinador && (
        <form action={(fd) => startTransition(() => crearMiembroEquipo(fd))} className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Agregar integrante</p>
          <div className="grid grid-cols-3 gap-2">
            <select name="nave" defaultValue={naveFiltro} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="Nave 1">Nave 1</option>
              <option value="Nave 2">Nave 2</option>
            </select>
            <input name="nombre" placeholder="Nombre" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="puesto" placeholder="Proceso / puesto" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <select name="rol_equipo" defaultValue="miembro" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="lider">Líder</option>
              <option value="suplente">Suplente</option>
              <option value="miembro">Miembro</option>
            </select>
            <input name="medios_localizacion" placeholder="Medios de localización" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="escolaridad" placeholder="Nivel de escolaridad" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <textarea name="conocimientos" placeholder="Conocimientos" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <textarea name="experiencia" placeholder="Experiencia" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <button className="col-span-3 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">Agregar</button>
          </div>
        </form>
      )}
    </div>
  )
}
