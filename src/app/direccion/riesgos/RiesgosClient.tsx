'use client'

import { useMemo, useState, useTransition } from 'react'
import { crearRiesgoOportunidad, actualizarEfectividadRiesgo, eliminarRiesgoOportunidad } from '../actions'

type Registro = {
  id: string
  numero: number | null
  tipo: string
  contexto: string | null
  parte_interesada: string | null
  proceso: string | null
  descripcion: string
  valoracion: string | null
  acciones: string | null
  responsable: string | null
  fecha: string | null
  efectividad_acciones: string | null
}

const VALORACION_STYLE: Record<string, string> = {
  A: 'bg-[#fdecea] text-[#a13c33]',
  B: 'bg-[#fdf3e3] text-[#9a6b1c]',
  C: 'bg-[#eaf5f0] text-[#3d6b53]',
}

export default function RiesgosClient({
  esCoordinador,
  registros,
}: {
  esCoordinador: boolean
  registros: Registro[]
}) {
  const [tipoFiltro, setTipoFiltro] = useState<'' | 'riesgo' | 'oportunidad'>('')
  const [valoracionFiltro, setValoracionFiltro] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [pendiente, startTransition] = useTransition()

  const riesgos = registros.filter((r) => r.tipo === 'riesgo').length
  const oportunidades = registros.filter((r) => r.tipo === 'oportunidad').length
  const valoracionA = registros.filter((r) => r.valoracion === 'A').length

  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      if (tipoFiltro && r.tipo !== tipoFiltro) return false
      if (valoracionFiltro && r.valoracion !== valoracionFiltro) return false
      return true
    })
  }, [registros, tipoFiltro, valoracionFiltro])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">
        Análisis de Riesgos y Oportunidades (FSG-14)
      </p>

      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => {
            setTipoFiltro('')
            setValoracionFiltro('')
          }}
          className={
            'rounded-lg px-4 py-3 text-left text-by-primary transition ' +
            (!tipoFiltro && !valoracionFiltro ? 'bg-[#e4e9e8] ring-2 ring-by-primary/40' : 'bg-[#f4f6f6] hover:bg-[#e9ecec]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Total registros</p>
          <p className="text-[22px] font-medium">{registros.length}</p>
        </button>
        <button
          onClick={() => setTipoFiltro(tipoFiltro === 'riesgo' ? '' : 'riesgo')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#a13c33] transition ' +
            (tipoFiltro === 'riesgo' ? 'bg-[#f9d9d5] ring-2 ring-[#a13c33]/40' : 'bg-[#fdecea] hover:bg-[#fbe1de]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Riesgos</p>
          <p className="text-[22px] font-medium">{riesgos}</p>
        </button>
        <button
          onClick={() => setTipoFiltro(tipoFiltro === 'oportunidad' ? '' : 'oportunidad')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#3d6b53] transition ' +
            (tipoFiltro === 'oportunidad' ? 'bg-[#d3ecdf] ring-2 ring-[#3d6b53]/40' : 'bg-[#eaf5f0] hover:bg-[#dff0e7]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Oportunidades</p>
          <p className="text-[22px] font-medium">{oportunidades}</p>
        </button>
        <button
          onClick={() => setValoracionFiltro(valoracionFiltro === 'A' ? '' : 'A')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#9a6b1c] transition ' +
            (valoracionFiltro === 'A' ? 'bg-[#f9e6bf] ring-2 ring-[#9a6b1c]/40' : 'bg-[#fdf3e3] hover:bg-[#fbedd2]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Valoración A (alta prioridad)</p>
          <p className="text-[22px] font-medium">{valoracionA}</p>
        </button>
      </div>

      <p className="text-[10.5px] text-by-gray-light">
        Criterio: <strong>A</strong> = alta, atender en el periodo próximo · <strong>B</strong> = media, atender en periodos posteriores · <strong>C</strong> = baja, no representativa por ahora.
      </p>

      <div className="flex flex-col gap-2">
        {filtrados.map((r) => {
          const abierto = expandido === r.id
          return (
            <div key={r.id} className="overflow-hidden rounded-xl border border-black/5 bg-white">
              <button
                onClick={() => setExpandido(abierto ? null : r.id)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-[10.5px] ' +
                        (r.tipo === 'riesgo' ? 'bg-[#fdecea] text-[#a13c33]' : 'bg-[#eaf5f0] text-[#3d6b53]')
                      }
                    >
                      {r.tipo === 'riesgo' ? 'Riesgo' : 'Oportunidad'} #{r.numero}
                    </span>
                    {r.valoracion && (
                      <span className={'rounded-full px-2 py-0.5 text-[10.5px] font-medium ' + (VALORACION_STYLE[r.valoracion] ?? '')}>
                        Valoración {r.valoracion}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-by-gray-dark">{r.descripcion}</p>
                  <p className="mt-0.5 text-[11px] text-by-gray-light">
                    {r.contexto ?? '—'} · {r.parte_interesada ?? '—'} · {r.proceso ?? '—'}
                  </p>
                </div>
              </button>

              {abierto && (
                <div className="border-t border-black/5 p-4 text-[12px]">
                  <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Acciones</p>
                  <p className="mb-3 whitespace-pre-line text-by-gray-dark">{r.acciones ?? '—'}</p>

                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Responsable</p>
                      <p className="text-by-gray-dark">{r.responsable ?? '—'}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Fecha</p>
                      <p className="text-by-gray-dark">{r.fecha ?? '—'}</p>
                    </div>
                  </div>

                  <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Efectividad de las acciones</p>
                  {esCoordinador ? (
                    <form
                      action={(fd) =>
                        startTransition(() =>
                          actualizarEfectividadRiesgo(r.id, String(fd.get('efectividad_acciones') ?? ''))
                        )
                      }
                      className="flex flex-col gap-2"
                    >
                      <textarea
                        name="efectividad_acciones"
                        defaultValue={r.efectividad_acciones ?? ''}
                        rows={3}
                        className="rounded-md border border-black/10 px-2 py-1.5 text-[12px]"
                      />
                      <div className="flex justify-between">
                        <button className="w-fit rounded-md border border-by-accent px-3 py-1 text-[11.5px] text-by-accent">
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm('¿Eliminar este registro?')) return
                            startTransition(() => eliminarRiesgoOportunidad(r.id))
                          }}
                          disabled={pendiente}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="whitespace-pre-line text-by-gray-dark">{r.efectividad_acciones ?? '—'}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {filtrados.length === 0 && (
          <div className="rounded-xl border border-black/5 bg-white p-6 text-center text-[12px] text-by-gray-light">
            No hay registros que coincidan con estos filtros.
          </div>
        )}
      </div>

      {esCoordinador && (
        <form
          action={(fd) => startTransition(() => crearRiesgoOportunidad(fd))}
          className="rounded-xl border border-black/5 bg-white p-4"
        >
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Registrar riesgo / oportunidad</p>
          <div className="grid grid-cols-3 gap-2">
            <select name="tipo" required defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="" disabled>Tipo…</option>
              <option value="riesgo">Riesgo</option>
              <option value="oportunidad">Oportunidad</option>
            </select>
            <select name="valoracion" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="">Valoración…</option>
              <option value="A">A — alta</option>
              <option value="B">B — media</option>
              <option value="C">C — baja</option>
            </select>
            <input name="fecha" placeholder="Fecha compromiso" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="contexto" placeholder="Contexto (Amenazas, Debilidades…)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="parte_interesada" placeholder="Parte interesada" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="proceso" placeholder="Proceso" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="descripcion" placeholder="Descripción" required className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <textarea name="acciones" placeholder="Acciones propuestas" className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" rows={2} />
            <input name="responsable" placeholder="Responsable" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="col-span-2 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Registrar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
