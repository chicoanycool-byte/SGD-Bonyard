'use client'

import { useMemo, useState, useTransition } from 'react'
import { crearRiesgoOportunidad, actualizarEstatusRiesgo, eliminarRiesgoOportunidad } from '../actions'

type Registro = {
  id: string
  tipo: string
  descripcion: string
  origen: string | null
  probabilidad: string | null
  impacto: string | null
  nivel: string | null
  accion_propuesta: string | null
  fecha_compromiso: string | null
  fecha_cierre_real: string | null
  estatus: string
  responsable_nombre: string | null
}
type Usuario = { id: string; nombre: string }

const NIVEL_STYLE: Record<string, string> = {
  critico: 'bg-[#fdecea] text-[#a13c33]',
  alto: 'bg-[#fdf3e3] text-[#9a6b1c]',
  medio: 'bg-[#eaf1fa] text-[#3c6ba1]',
  bajo: 'bg-[#eaf5f0] text-[#3d6b53]',
}

export default function RiesgosClient({
  esCoordinador,
  registros,
  usuarios,
}: {
  esCoordinador: boolean
  registros: Registro[]
  usuarios: Usuario[]
}) {
  const [tab, setTab] = useState<'analisis' | 'plan'>('analisis')
  const [pendiente, startTransition] = useTransition()
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [nivelFiltro, setNivelFiltro] = useState('')

  const riesgos = registros.filter((r) => r.tipo === 'riesgo').length
  const oportunidades = registros.filter((r) => r.tipo === 'oportunidad').length
  const criticos = registros.filter((r) => r.nivel === 'critico').length
  const abiertos = registros.filter((r) => r.estatus !== 'cerrado').length

  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      if (tipoFiltro && r.tipo !== tipoFiltro) return false
      if (nivelFiltro && r.nivel !== nivelFiltro) return false
      return true
    })
  }, [registros, tipoFiltro, nivelFiltro])

  const enPlan = registros.filter((r) => r.estatus !== 'cerrado' && r.accion_propuesta)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Riesgos y oportunidades</p>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('analisis')}
            className={
              'rounded-md px-3 py-1.5 text-[12px] ' +
              (tab === 'analisis' ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')
            }
          >
            Análisis de riesgos
          </button>
          <button
            onClick={() => setTab('plan')}
            className={
              'rounded-md px-3 py-1.5 text-[12px] ' +
              (tab === 'plan' ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')
            }
          >
            Plan de acción
          </button>
        </div>
      </div>

      {tab === 'analisis' && (
        <>
          <div className="grid grid-cols-4 gap-3">
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
              onClick={() => setNivelFiltro(nivelFiltro === 'critico' ? '' : 'critico')}
              className={
                'rounded-lg px-4 py-3 text-left text-[#9a6b1c] transition ' +
                (nivelFiltro === 'critico' ? 'bg-[#f9e6bf] ring-2 ring-[#9a6b1c]/40' : 'bg-[#fdf3e3] hover:bg-[#fbedd2]')
              }
            >
              <p className="mb-1 text-[11px] opacity-80">Nivel crítico</p>
              <p className="text-[22px] font-medium">{criticos}</p>
            </button>
            <button
              onClick={() => {
                setTipoFiltro('')
                setNivelFiltro('')
              }}
              className={
                'rounded-lg px-4 py-3 text-left text-by-primary transition ' +
                (!tipoFiltro && !nivelFiltro ? 'bg-[#e4e9e8] ring-2 ring-by-primary/40' : 'bg-[#f4f6f6] hover:bg-[#e9ecec]')
              }
            >
              <p className="mb-1 text-[11px] opacity-80">Abiertos (total)</p>
              <p className="text-[22px] font-medium">{abiertos}</p>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
                  <th className="px-3 py-2 font-normal">Tipo</th>
                  <th className="px-3 py-2 font-normal">Descripción</th>
                  <th className="px-3 py-2 font-normal">Origen</th>
                  <th className="px-3 py-2 font-normal">Prob. × Impacto</th>
                  <th className="px-3 py-2 font-normal">Nivel</th>
                  <th className="px-3 py-2 font-normal">Estatus</th>
                  {esCoordinador && <th className="px-3 py-2 font-normal"></th>}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 last:border-0">
                    <td className="px-3 py-2">
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-[11px] ' +
                          (r.tipo === 'riesgo' ? 'bg-[#fdecea] text-[#a13c33]' : 'bg-[#eaf5f0] text-[#3d6b53]')
                        }
                      >
                        {r.tipo === 'riesgo' ? 'Riesgo' : 'Oportunidad'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-by-gray-dark">{r.descripcion}</td>
                    <td className="px-3 py-2 text-by-gray-light">{r.origen ?? '—'}</td>
                    <td className="px-3 py-2 text-by-gray-light capitalize">
                      {r.probabilidad && r.impacto ? `${r.probabilidad} × ${r.impacto}` : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {r.nivel ? (
                        <span className={'rounded-full px-2 py-0.5 text-[11px] capitalize ' + (NIVEL_STYLE[r.nivel] ?? '')}>
                          {r.nivel}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2 text-by-gray-light capitalize">{r.estatus.replace('_', ' ')}</td>
                    {esCoordinador && (
                      <td className="px-3 py-2">
                        <button
                          onClick={() => startTransition(() => eliminarRiesgoOportunidad(r.id))}
                          disabled={pendiente}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                      Sin registros que coincidan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
                <input name="origen" placeholder="Origen (proceso, auditoría…)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                <select name="responsable_id" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                  <option value="">Sin responsable</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
                <input
                  name="descripcion"
                  placeholder="Descripción"
                  required
                  className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]"
                />
                <select name="probabilidad" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                  <option value="">Probabilidad…</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
                <select name="impacto" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                  <option value="">Impacto…</option>
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                </select>
                <input name="fecha_compromiso" type="date" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                <input
                  name="accion_propuesta"
                  placeholder="Acción propuesta (opcional)"
                  className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]"
                />
                <button className="col-span-3 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
                  Registrar
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {tab === 'plan' && (
        <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
                <th className="px-3 py-2 font-normal">Descripción</th>
                <th className="px-3 py-2 font-normal">Acción propuesta</th>
                <th className="px-3 py-2 font-normal">Responsable</th>
                <th className="px-3 py-2 font-normal">Compromiso</th>
                <th className="px-3 py-2 font-normal">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {enPlan.map((r) => (
                <tr key={r.id} className="border-b border-black/5 last:border-0">
                  <td className="px-3 py-2 text-by-gray-dark">{r.descripcion}</td>
                  <td className="px-3 py-2 text-by-gray-light">{r.accion_propuesta}</td>
                  <td className="px-3 py-2 text-by-gray-light">{r.responsable_nombre ?? '—'}</td>
                  <td className="px-3 py-2 text-by-gray-light">
                    {r.fecha_compromiso ? new Date(r.fecha_compromiso).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {esCoordinador ? (
                      <select
                        defaultValue={r.estatus}
                        onChange={(e) => startTransition(() => actualizarEstatusRiesgo(r.id, e.target.value))}
                        className="h-7 rounded-md border border-black/10 px-1.5 text-[11.5px]"
                      >
                        <option value="abierto">Abierto</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="cerrado">Cerrado</option>
                      </select>
                    ) : (
                      <span className="capitalize text-by-gray-light">{r.estatus.replace('_', ' ')}</span>
                    )}
                  </td>
                </tr>
              ))}
              {enPlan.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                    Nada pendiente de seguimiento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
