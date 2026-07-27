'use client'

import { useState, useTransition } from 'react'
import {
  crearFoda,
  eliminarFoda,
  crearParteInteresada,
  crearRequisitoParte,
  eliminarRequisitoParte,
  crearProceso,
  eliminarProceso,
  actualizarAlcance,
  crearExclusion,
  eliminarExclusion,
} from '../actions'

type Foda = {
  id: string
  categoria: string
  descripcion: string
  consecuencia: string | null
  clasificacion: string | null
}
type Requisito = {
  id: string
  requisito: string | null
  documento_referencia: string | null
  riesgo_oportunidad_texto: string | null
  clasificacion: string | null
}
type Parte = { id: string; nombre: string; requisitos: Requisito[] }
type Proceso = {
  id: string
  proceso: string
  tipo: string | null
  proposito: string | null
  entradas: string | null
  salidas: string | null
  recursos: string | null
  documentos: string | null
}
type Alcance = { id: string; servicios: string | null; ubicaciones: { nombre: string; direccion: string }[] } | null
type Exclusion = { id: string; requisito: string; justificacion: string | null }

const CATEGORIAS_FODA = [
  'ASPECTOS EXTERNOS OPORTUNIDADES',
  'ASPECTOS EXTERNOS AMENAZAS',
  'ASPECTOS INTERNOS FORTALEZAS',
  'ASPECTOS INTERNOS DEBILIDADES',
]
const CATEGORIA_LABEL: Record<string, string> = {
  'ASPECTOS EXTERNOS OPORTUNIDADES': 'Aspectos externos · Oportunidades',
  'ASPECTOS EXTERNOS AMENAZAS': 'Aspectos externos · Amenazas',
  'ASPECTOS INTERNOS FORTALEZAS': 'Aspectos internos · Fortalezas',
  'ASPECTOS INTERNOS DEBILIDADES': 'Aspectos internos · Debilidades',
}

function Pill({ texto }: { texto: string | null }) {
  if (!texto) return null
  const esRiesgo = texto === 'Riesgo'
  return (
    <span
      className={
        'rounded-full px-2 py-0.5 text-[10.5px] ' +
        (esRiesgo ? 'bg-[#fdecea] text-[#a13c33]' : 'bg-[#eaf5f0] text-[#3d6b53]')
      }
    >
      {texto}
    </span>
  )
}

export default function ContextoClient({
  esCoordinador,
  foda,
  partes,
  procesos,
  alcance,
  exclusiones,
}: {
  esCoordinador: boolean
  foda: Foda[]
  partes: Parte[]
  procesos: Proceso[]
  alcance: Alcance
  exclusiones: Exclusion[]
}) {
  const [tab, setTab] = useState<'foda' | 'partes' | 'procesos' | 'alcance'>('foda')
  const [pendiente, startTransition] = useTransition()
  const [parteExpandida, setParteExpandida] = useState<string | null>(null)
  const [procesoExpandido, setProcesoExpandido] = useState<string | null>(null)

  const TABS: { id: typeof tab; label: string }[] = [
    { id: 'foda', label: 'Contexto (FODA)' },
    { id: 'partes', label: 'Partes interesadas' },
    { id: 'procesos', label: 'Procesos del SGI' },
    { id: 'alcance', label: 'Alcance' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Contexto de la organización</p>
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                'rounded-md px-3 py-1.5 text-[12px] ' +
                (tab === t.id ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- FODA ---------- */}
      {tab === 'foda' && (
        <div className="flex flex-col gap-4">
          {CATEGORIAS_FODA.map((cat) => {
            const filas = foda.filter((f) => f.categoria === cat)
            if (filas.length === 0) return null
            return (
              <div key={cat} className="overflow-hidden rounded-xl border border-black/5 bg-white">
                <div className="border-b border-black/5 px-4 py-2">
                  <p className="text-[12.5px] font-medium text-by-gray-dark">{CATEGORIA_LABEL[cat] ?? cat}</p>
                </div>
                <table className="w-full text-left text-[12.5px]">
                  <tbody>
                    {filas.map((f) => (
                      <tr key={f.id} className="border-b border-black/5 last:border-0 align-top">
                        <td className="w-1/2 px-4 py-2 text-by-gray-dark">{f.descripcion}</td>
                        <td className="px-4 py-2 text-by-gray-light">{f.consecuencia ?? '—'}</td>
                        <td className="w-24 px-4 py-2">
                          <Pill texto={f.clasificacion} />
                        </td>
                        {esCoordinador && (
                          <td className="px-4 py-2 text-right">
                            <button
                              onClick={() => startTransition(() => eliminarFoda(f.id))}
                              disabled={pendiente}
                              className="text-[11px] text-red-500 hover:underline"
                            >
                              Eliminar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}

          {esCoordinador && (
            <form
              action={(fd) => startTransition(() => crearFoda(fd))}
              className="rounded-xl border border-black/5 bg-white p-4"
            >
              <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Agregar factor</p>
              <div className="grid grid-cols-2 gap-2">
                <select name="categoria" required defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                  <option value="" disabled>Categoría…</option>
                  {CATEGORIAS_FODA.map((c) => (
                    <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>
                  ))}
                </select>
                <select name="clasificacion" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                  <option value="">Sin riesgo/oportunidad asociado</option>
                  <option value="Riesgo">Riesgo</option>
                  <option value="Oportunidad">Oportunidad</option>
                </select>
                <input name="descripcion" placeholder="Descripción del factor" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                <input name="consecuencia" placeholder="Consecuencia / riesgo u oportunidad derivado" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                <button className="h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">Agregar</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ---------- Partes interesadas ---------- */}
      {tab === 'partes' && (
        <div className="flex flex-col gap-3">
          {partes.map((p) => {
            const abierto = parteExpandida === p.id
            return (
              <div key={p.id} className="overflow-hidden rounded-xl border border-black/5 bg-white">
                <button
                  onClick={() => setParteExpandida(abierto ? null : p.id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left"
                >
                  <span className="text-[13px] font-medium text-by-gray-dark">{p.nombre}</span>
                  <span className="text-[11px] text-by-gray-light">{p.requisitos.length} requisito(s)</span>
                </button>
                {abierto && (
                  <div className="border-t border-black/5">
                    <table className="w-full text-left text-[12px]">
                      <thead>
                        <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
                          <th className="px-4 py-2 font-normal">Requisito</th>
                          <th className="px-4 py-2 font-normal">Documento de referencia</th>
                          <th className="px-4 py-2 font-normal">Riesgo / oportunidad</th>
                          <th className="px-4 py-2 font-normal"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.requisitos.map((r) => (
                          <tr key={r.id} className="border-b border-black/5 last:border-0 align-top">
                            <td className="px-4 py-2 text-by-gray-dark">{r.requisito ?? '—'}</td>
                            <td className="whitespace-pre-line px-4 py-2 text-by-gray-light">{r.documento_referencia ?? '—'}</td>
                            <td className="px-4 py-2 text-by-gray-light">
                              {r.riesgo_oportunidad_texto ? (
                                <>
                                  {r.riesgo_oportunidad_texto} <Pill texto={r.clasificacion} />
                                </>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {esCoordinador && (
                                <button
                                  onClick={() => startTransition(() => eliminarRequisitoParte(r.id))}
                                  disabled={pendiente}
                                  className="text-[11px] text-red-500 hover:underline"
                                >
                                  Eliminar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {esCoordinador && (
                      <form
                        action={(fd) => startTransition(() => crearRequisitoParte(fd))}
                        className="grid grid-cols-2 gap-2 p-4"
                      >
                        <input type="hidden" name="parte_id" value={p.id} />
                        <input name="requisito" placeholder="Requisito pertinente" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                        <input name="documento_referencia" placeholder="Documento / procedimiento" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                        <input name="riesgo_oportunidad_texto" placeholder="Riesgo u oportunidad (opcional)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                        <select name="clasificacion" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                          <option value="">Sin clasificar</option>
                          <option value="Riesgo">Riesgo</option>
                          <option value="Oportunidad">Oportunidad</option>
                        </select>
                        <button className="col-span-2 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
                          Agregar requisito
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {esCoordinador && (
            <form
              action={(fd) => startTransition(() => crearParteInteresada(fd))}
              className="flex items-center gap-2 rounded-xl border border-black/5 bg-white p-4"
            >
              <input name="nombre" placeholder="Nueva parte interesada (ej. Sindicato)" required className="h-8 flex-1 rounded-md border border-black/10 px-2 text-[12px]" />
              <button className="rounded-md border border-by-accent px-3 py-1.5 text-[12px] text-by-accent">Agregar</button>
            </form>
          )}
        </div>
      )}

      {/* ---------- Procesos del SGI ---------- */}
      {tab === 'procesos' && (
        <div className="flex flex-col gap-3">
          {procesos.map((proc) => {
            const abierto = procesoExpandido === proc.id
            return (
              <div key={proc.id} className="overflow-hidden rounded-xl border border-black/5 bg-white">
                <button
                  onClick={() => setProcesoExpandido(abierto ? null : proc.id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left"
                >
                  <div>
                    <span className="text-[13px] font-medium text-by-gray-dark">{proc.proceso}</span>
                    {proc.tipo && (
                      <span className="ml-2 rounded-full bg-[#f0eafa] px-2 py-0.5 text-[10px] text-[#6b4fa0]">{proc.tipo}</span>
                    )}
                  </div>
                  {esCoordinador && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        startTransition(() => eliminarProceso(proc.id))
                      }}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Eliminar
                    </span>
                  )}
                </button>
                {abierto && (
                  <div className="grid grid-cols-2 gap-4 border-t border-black/5 p-4 text-[12px]">
                    <p className="col-span-2 text-by-gray-dark">{proc.proposito}</p>
                    <div>
                      <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Entradas</p>
                      <p className="whitespace-pre-line text-by-gray-dark">{proc.entradas}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Salidas</p>
                      <p className="whitespace-pre-line text-by-gray-dark">{proc.salidas}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Recursos</p>
                      <p className="whitespace-pre-line text-by-gray-dark">{proc.recursos}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Documentos</p>
                      <p className="whitespace-pre-line text-by-gray-dark">{proc.documentos}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {esCoordinador && (
            <form
              action={(fd) => startTransition(() => crearProceso(fd))}
              className="rounded-xl border border-black/5 bg-white p-4"
            >
              <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Agregar proceso</p>
              <div className="grid grid-cols-2 gap-2">
                <input name="proceso" placeholder="Nombre del proceso" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                <select name="tipo" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                  <option value="">Tipo…</option>
                  <option value="ESTRATÉGICO">Estratégico</option>
                  <option value="OPERATIVO">Operativo</option>
                  <option value="SOPORTE">Soporte</option>
                </select>
                <textarea name="proposito" placeholder="Propósito" className="col-span-2 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" rows={2} />
                <textarea name="entradas" placeholder="Entradas" className="rounded-md border border-black/10 px-2 py-1.5 text-[12px]" rows={2} />
                <textarea name="salidas" placeholder="Salidas" className="rounded-md border border-black/10 px-2 py-1.5 text-[12px]" rows={2} />
                <textarea name="recursos" placeholder="Recursos" className="rounded-md border border-black/10 px-2 py-1.5 text-[12px]" rows={2} />
                <textarea name="documentos" placeholder="Documentos" className="rounded-md border border-black/10 px-2 py-1.5 text-[12px]" rows={2} />
                <button className="col-span-2 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">Agregar</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ---------- Alcance ---------- */}
      {tab === 'alcance' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">4.3.1 Servicios</p>
            <p className="mb-3 text-[13px] text-by-gray-dark">{alcance?.servicios ?? 'No definido.'}</p>

            <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">4.3.2 Ubicaciones físicas</p>
            <div className="mb-3 flex flex-col gap-2">
              {(alcance?.ubicaciones ?? []).map((u, i) => (
                <div key={i} className="rounded-lg bg-[#f4f6f6] px-3 py-2">
                  <p className="text-[12.5px] font-medium text-by-gray-dark">{u.nombre}</p>
                  <p className="text-[12px] text-by-gray-light">{u.direccion}</p>
                </div>
              ))}
              {(!alcance || alcance.ubicaciones.length === 0) && (
                <p className="text-[12px] text-by-gray-light">Sin ubicaciones capturadas.</p>
              )}
            </div>

            {esCoordinador && (
              <form action={(fd) => startTransition(() => actualizarAlcance(fd))} className="flex items-center gap-2 border-t border-black/5 pt-3">
                <input type="hidden" name="id" value={alcance?.id ?? ''} />
                <input
                  name="servicios"
                  defaultValue={alcance?.servicios ?? ''}
                  placeholder="Descripción de servicios"
                  className="h-8 flex-1 rounded-md border border-black/10 px-2 text-[12px]"
                />
                <button className="rounded-md border border-by-accent px-3 py-1.5 text-[12px] text-by-accent">Guardar</button>
              </form>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
            <div className="border-b border-black/5 px-4 py-2">
              <p className="text-[12.5px] font-medium text-by-gray-dark">4.3.4 Exclusiones del sistema</p>
            </div>
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
                  <th className="px-4 py-2 font-normal">Requisito excluido</th>
                  <th className="px-4 py-2 font-normal">Justificación</th>
                  {esCoordinador && <th className="px-4 py-2 font-normal"></th>}
                </tr>
              </thead>
              <tbody>
                {exclusiones.map((ex) => (
                  <tr key={ex.id} className="border-b border-black/5 last:border-0 align-top">
                    <td className="px-4 py-2 text-by-gray-dark">{ex.requisito}</td>
                    <td className="whitespace-pre-line px-4 py-2 text-by-gray-light">{ex.justificacion ?? '—'}</td>
                    {esCoordinador && (
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => startTransition(() => eliminarExclusion(ex.id))}
                          disabled={pendiente}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {exclusiones.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-[12px] text-by-gray-light">
                      Sin exclusiones capturadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {esCoordinador && (
              <form action={(fd) => startTransition(() => crearExclusion(fd))} className="grid grid-cols-2 gap-2 border-t border-black/5 p-4">
                <input name="requisito" placeholder="Cláusula / requisito excluido" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                <input name="justificacion" placeholder="Justificación" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                <button className="col-span-2 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
                  Agregar exclusión
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
