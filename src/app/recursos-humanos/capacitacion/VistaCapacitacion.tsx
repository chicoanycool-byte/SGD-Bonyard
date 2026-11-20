'use client'

import { useState } from 'react'
import RegistrarWizard from './RegistrarWizard'
import { ESTADO_CAP, fechaMX, type EstadoCap } from '@/lib/capacitacion'

export type Item = { cursoId: string; codigo: string; nombre: string; estado: EstadoCap; vence: string | null; ultima: string | null; req: boolean }
export type PersonaVista = { id: string; nombre: string; puesto: string | null; items: Item[] }
type Curso = { id: string; codigo: string; nombre: string; vigencia_meses: number | null }

const atencion = (e: EstadoCap) => e === 'pendiente' || e === 'vencido' || e === 'por_vencer'
const etiqueta = (i: Item) =>
  i.estado === 'pendiente' ? 'Falta registrar' : i.estado === 'vencido' ? `Venció el ${fechaMX(i.vence)}` : i.estado === 'por_vencer' ? `Vence el ${fechaMX(i.vence)}` : i.vence ? `Vigente hasta ${fechaMX(i.vence)}` : 'Cumplido'

function Chip({ i }: { i: Item }) {
  return <span className={'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ' + ESTADO_CAP[i.estado].clase}>{etiqueta(i)}</span>
}

export default function VistaCapacitacion({
  personas,
  cursos,
  todasLasPersonas,
  esCoord,
  hoy,
}: {
  personas: PersonaVista[]
  cursos: Curso[]
  todasLasPersonas: { id: string; nombre: string; puesto: string | null }[]
  esCoord: boolean
  hoy: string
}) {
  const [tab, setTab] = useState<'hacer' | 'persona' | 'tabla'>(esCoord ? 'hacer' : 'persona')
  const [wizard, setWizard] = useState<{ curso: string; personas: string[]; k: number } | null>(null)
  const abrir = (curso: string, ids: string[]) => {
    setWizard({ curso, personas: ids, k: Date.now() })
    setTimeout(() => document.getElementById('registro')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const reqs = personas.flatMap((p) => p.items.filter((i) => i.req))
  const alDia = reqs.filter((i) => !atencion(i.estado)).length
  const pct = reqs.length ? Math.round((alDia / reqs.length) * 100) : 100

  // Agrupado por curso para "Qué hacer"
  const porCurso = cursos
    .map((c) => {
      const filas = personas.flatMap((p) => p.items.filter((i) => i.req && i.cursoId === c.id && atencion(i.estado)).map((i) => ({ p, i })))
      return { c, filas }
    })
    .filter((x) => x.filas.length > 0)
    .sort((a, b) => b.filas.length - a.filas.length)

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="text-[13.5px] text-by-gray-dark">
          {esCoord ? 'Hoy' : 'Tienes'}{' '}
          <span className="font-semibold">{alDia} de {reqs.length}</span> capacitaciones requeridas {esCoord ? 'están' : 'están'} al día.
        </p>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className={'h-full ' + (pct >= 90 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: pct + '%' }} />
        </div>
        <p className="mt-1.5 text-[11.5px] text-by-gray">
          {pct}% de cumplimiento. “Al día” significa que el curso se tomó y todavía no vence ni vence en menos de 30 días.
        </p>
        {esCoord && !wizard && (
          <button onClick={() => abrir('', [])} className="mt-3 h-9 rounded-md bg-by-primary px-4 text-[13px] font-medium text-white">
            + Registrar una capacitación
          </button>
        )}
      </div>

      {esCoord && wizard && (
        <div id="registro">
          <RegistrarWizard
            key={wizard.k}
            cursos={cursos}
            personas={todasLasPersonas}
            cursoInicial={wizard.curso}
            personasIniciales={wizard.personas}
            hoy={hoy}
            onCerrar={() => setWizard(null)}
          />
        </div>
      )}

      {esCoord && (
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-[12.5px]">
          {([['hacer', 'Qué hacer ahora'], ['persona', 'Por persona'], ['tabla', 'Tabla completa']] as const).map(([k, t]) => (
            <button key={k} onClick={() => setTab(k)} className={'flex-1 rounded-md px-3 py-1.5 ' + (tab === k ? 'bg-white font-medium text-by-gray-dark shadow-sm' : 'text-by-gray')}>
              {t}
            </button>
          ))}
        </div>
      )}

      {tab === 'hacer' && esCoord && (
        <div className="flex flex-col gap-3">
          {porCurso.length === 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] text-emerald-800">
              Todo está al día. No hay capacitaciones vencidas, por vencer ni sin registro.
            </div>
          )}
          {porCurso.map(({ c, filas }) => (
            <div key={c.id} className="rounded-xl border border-black/5 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-[13px] font-medium text-by-gray-dark">{c.codigo} {c.nombre}</p>
                <button
                  onClick={() => abrir(c.id, filas.map((f) => f.p.id))}
                  className="h-8 rounded-md border border-by-primary px-3 text-[12.5px] font-medium text-by-primary hover:bg-by-primary hover:text-white"
                >
                  Registrar este curso
                </button>
              </div>
              <ul className="mt-2 divide-y divide-black/5">
                {filas.map(({ p, i }) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-1.5 text-[12.5px]">
                    <span>{p.nombre}</span>
                    <Chip i={i} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === 'persona' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {personas.map((p) => {
            const mias = p.items.filter((i) => i.req)
            const pend = mias.filter((i) => atencion(i.estado))
            const ok = mias.filter((i) => !atencion(i.estado))
            return (
              <div key={p.id} className="rounded-xl border border-black/5 bg-white p-4">
                <p className="text-[13.5px] font-medium text-by-gray-dark">{p.nombre}</p>
                <p className="text-[11.5px] text-by-gray">{p.puesto ?? 'Sin puesto asignado'}</p>
                <p className="mt-2 text-[12.5px]">
                  {mias.length === 0 ? 'Su puesto no tiene capacitaciones requeridas.' : pend.length === 0 ? `Todo al día (${ok.length} de ${mias.length}).` : `${ok.length} de ${mias.length} al día. Te falta atender ${pend.length}:`}
                </p>
                <ul className="mt-1 divide-y divide-black/5">
                  {pend.map((i) => (
                    <li key={i.cursoId} className="flex items-center justify-between gap-2 py-1.5 text-[12.5px]">
                      <span className="min-w-0 flex-1">{i.codigo} {i.nombre}<br /><Chip i={i} /></span>
                      {esCoord && (
                        <button onClick={() => abrir(i.cursoId, [p.id])} className="shrink-0 text-[12px] text-by-primary hover:underline">Registrar</button>
                      )}
                    </li>
                  ))}
                </ul>
                {ok.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[12px] text-by-gray">Ver las {ok.length} que están al día</summary>
                    <ul className="mt-1 text-[12px] text-by-gray-dark">
                      {ok.map((i) => <li key={i.cursoId} className="py-0.5">✓ {i.codigo} {i.nombre} <span className="text-by-gray">· {etiqueta(i)}</span></li>)}
                    </ul>
                  </details>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'tabla' && esCoord && (
        <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-black/5 text-left text-[11px] text-by-gray">
                <th className="sticky left-0 bg-white px-3 py-2">Persona</th>
                {cursos.map((c) => <th key={c.id} className="px-2 py-2" title={c.nombre}>{c.codigo}</th>)}
              </tr>
            </thead>
            <tbody>
              {personas.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0">
                  <td className="sticky left-0 bg-white px-3 py-2 font-medium text-by-gray-dark">{p.nombre}</td>
                  {cursos.map((c) => {
                    const i = p.items.find((x) => x.cursoId === c.id)
                    return (
                      <td key={c.id} className="px-2 py-2">
                        {i && i.req ? (
                          <span title={`${c.nombre}: ${etiqueta(i)}`} className={'inline-block h-5 w-5 rounded-full text-center text-[11px] leading-5 ' + ESTADO_CAP[i.estado].clase}>
                            {atencion(i.estado) ? (i.estado === 'por_vencer' ? '!' : '✕') : '✓'}
                          </span>
                        ) : <span className="text-black/20">·</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-black/5 px-3 py-2 text-[11px] text-by-gray">
            ✓ al día · ! vence en menos de 30 días · ✕ vencida o sin registro · · el puesto no lo requiere. Pasa el cursor sobre un círculo para ver el detalle.
          </p>
        </div>
      )}
    </div>
  )
}
