'use client'

import { useActionState, useRef, useEffect, useState, useTransition } from 'react'
import {
  crearObjetivo,
  actualizarObjetivo,
  crearEvaluacion,
  type EstadoCultura,
} from './actions'

export const ELEMENTOS_CULTURA: Record<string, string> = {
  liderazgo: 'Compromiso de la dirección',
  comunicacion: 'Comunicación',
  capacitacion: 'Capacitación',
  retroalimentacion: 'Retroalimentación del personal',
  medicion: 'Medición del desempeño',
}

const inicial: EstadoCultura = {}
const campo =
  'w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'
const boton =
  'h-8 rounded-md bg-by-primary px-4 text-[12px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60'

type Usuario = { id: string; nombre: string }
type Objetivo = {
  id: string
  elemento: string
  objetivo: string
  indicador: string
  meta: string
  responsable: string | null
  fecha_limite: string | null
  avance: string | null
  estatus: string
}
type Evaluacion = {
  id: string
  fecha: string
  metodo: string
  nave: string | null
  participantes: number | null
  resultado_pct: number | null
  conclusiones: string
  acciones: string | null
}

const ESTATUS: Record<string, { label: string; clase: string }> = {
  en_proceso: { label: 'En proceso', clase: 'bg-amber-100 text-amber-800' },
  cumplido: { label: 'Cumplido', clase: 'bg-emerald-100 text-emerald-800' },
  no_cumplido: { label: 'No cumplido', clase: 'bg-red-100 text-red-800' },
}
const METODOS: Record<string, string> = {
  encuesta: 'Encuesta',
  entrevistas: 'Entrevistas',
  observacion: 'Observación en piso',
  mixto: 'Mixto',
}

function FilaObjetivo({ o, editable }: { o: Objetivo; editable: boolean }) {
  const [avance, setAvance] = useState(o.avance ?? '')
  const [estatus, setEstatus] = useState(o.estatus)
  const [fecha, setFecha] = useState(o.fecha_limite ?? '')
  const [msg, setMsg] = useState('')
  const [pendiente, iniciar] = useTransition()

  function guardar() {
    iniciar(async () => {
      const r = await actualizarObjetivo(o.id, avance, estatus, fecha)
      setMsg(r.error ?? '✓ Guardado')
    })
  }

  return (
    <tr className="border-b border-black/5 align-top last:border-0">
      <td className="px-3 py-2">{ELEMENTOS_CULTURA[o.elemento]}</td>
      <td className="px-3 py-2">{o.objetivo}</td>
      <td className="px-3 py-2">{o.indicador}</td>
      <td className="px-3 py-2">{o.meta}</td>
      <td className="px-3 py-2">{o.responsable ?? '—'}</td>
      <td className="px-3 py-2">
        {editable ? (
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo + ' h-7 w-36'} />
        ) : o.fecha_limite ? (
          new Date(o.fecha_limite + 'T12:00:00').toLocaleDateString('es-MX')
        ) : (
          'Por definir'
        )}
      </td>
      <td className="px-3 py-2">
        {editable ? (
          <div className="flex flex-col gap-1.5">
            <input value={avance} onChange={(e) => setAvance(e.target.value)} placeholder="Avance actual" className={campo + ' h-7'} />
            <div className="flex items-center gap-2">
              <select value={estatus} onChange={(e) => setEstatus(e.target.value)} className={campo + ' h-7 w-32 bg-white'}>
                {Object.entries(ESTATUS).map(([v, e]) => (
                  <option key={v} value={v}>{e.label}</option>
                ))}
              </select>
              <button onClick={guardar} disabled={pendiente} className="h-7 rounded-md border border-black/10 px-3 text-[11.5px] hover:bg-black/5">
                Guardar
              </button>
              {msg && <span className="text-[11px] text-by-gray">{msg}</span>}
            </div>
          </div>
        ) : (
          <>
            <p>{o.avance || '—'}</p>
            <span className={'mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ' + ESTATUS[o.estatus]?.clase}>
              {ESTATUS[o.estatus]?.label}
            </span>
          </>
        )}
      </td>
    </tr>
  )
}

export default function CulturaClient({
  objetivos,
  evaluaciones,
  usuarios,
  esCoordinador,
}: {
  objetivos: Objetivo[]
  evaluaciones: Evaluacion[]
  usuarios: Usuario[]
  esCoordinador: boolean
}) {
  const [tab, setTab] = useState<'objetivos' | 'evaluaciones'>('objetivos')
  const [estObj, accionObj, pendObj] = useActionState(crearObjetivo, inicial)
  const [estEva, accionEva, pendEva] = useActionState(crearEvaluacion, inicial)
  const refObj = useRef<HTMLFormElement>(null)
  const refEva = useRef<HTMLFormElement>(null)

  useEffect(() => { if (estObj.ok) refObj.current?.reset() }, [estObj.ok])
  useEffect(() => { if (estEva.ok) refEva.current?.reset() }, [estEva.ok])

  const cumplidos = objetivos.filter((o) => o.estatus === 'cumplido').length
  const ultima = evaluaciones[0]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[14px] font-medium text-by-gray-dark">Cultura de inocuidad</p>
        <p className="text-[11.5px] text-by-gray">
          Plan documentado con objetivos medibles y evaluación periódica (SQF Edición 10).
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <p className="text-[11.5px] text-by-gray">Objetivos cumplidos</p>
          <p className="mt-1 text-2xl font-semibold text-by-gray-dark">{objetivos.length ? `${cumplidos} de ${objetivos.length}` : '—'}</p>
        </div>
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <p className="text-[11.5px] text-by-gray">Última evaluación</p>
          <p className="mt-1 text-2xl font-semibold text-by-gray-dark">
            {ultima ? new Date(ultima.fecha + 'T12:00:00').toLocaleDateString('es-MX') : 'Sin evaluar'}
          </p>
        </div>
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <p className="text-[11.5px] text-by-gray">Resultado de la última</p>
          <p className="mt-1 text-2xl font-semibold text-by-gray-dark">{ultima?.resultado_pct != null ? `${ultima.resultado_pct}%` : '—'}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-black/10">
        {(['objetivos', 'evaluaciones'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              'px-4 py-2 text-[12.5px] font-medium ' +
              (tab === t ? 'border-b-2 border-by-primary text-by-primary' : 'text-by-gray hover:text-by-gray-dark')
            }
          >
            {t === 'objetivos' ? 'Objetivos del plan' : 'Evaluaciones periódicas'}
          </button>
        ))}
      </div>

      <div hidden={tab !== 'objetivos'} className="flex flex-col gap-4">
        {esCoordinador && (
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Agregar objetivo</p>
            <form ref={refObj} action={accionObj} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Elemento</label>
                <select name="elemento" required defaultValue="" className={campo + ' h-8 bg-white'}>
                  <option value="" disabled>Selecciona…</option>
                  {Object.entries(ELEMENTOS_CULTURA).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] text-by-gray-dark">Objetivo</label>
                <input name="objetivo" required className={campo + ' h-8'} placeholder="Ej. Que todo el personal conozca la política de inocuidad" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Indicador (cómo se mide)</label>
                <input name="indicador" required className={campo + ' h-8'} placeholder="Ej. % de personal que aprueba la evaluación" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Meta</label>
                <input name="meta" required className={campo + ' h-8'} placeholder="Ej. ≥ 90%" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Responsable</label>
                <select name="responsable_id" defaultValue="" className={campo + ' h-8 bg-white'}>
                  <option value="">—</option>
                  {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha límite</label>
                <input name="fecha_limite" type="date" className={campo + ' h-8'} />
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <button disabled={pendObj} className={boton}>Agregar objetivo</button>
                {estObj.error && <span className="text-[12px] text-red-600">{estObj.error}</span>}
                {estObj.ok && <span className="text-[12px] text-emerald-700">✓ Agregado</span>}
              </div>
            </form>
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-black/5 text-left text-[11px] uppercase tracking-wide text-by-gray">
                <th className="px-3 py-2">Elemento</th><th className="px-3 py-2">Objetivo</th><th className="px-3 py-2">Indicador</th>
                <th className="px-3 py-2">Meta</th><th className="px-3 py-2">Responsable</th><th className="px-3 py-2">Fecha límite</th>
                <th className="px-3 py-2">Avance y estatus</th>
              </tr>
            </thead>
            <tbody>
              {objetivos.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-by-gray">Todavía no hay objetivos en el plan.</td></tr>
              )}
              {objetivos.map((o) => <FilaObjetivo key={o.id} o={o} editable={esCoordinador} />)}
            </tbody>
          </table>
        </div>
      </div>

      <div hidden={tab !== 'evaluaciones'} className="flex flex-col gap-4">
        {esCoordinador && (
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Registrar evaluación de la cultura</p>
            <form ref={refEva} action={accionEva} className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha</label>
                <input name="fecha" type="date" required className={campo + ' h-8'} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Método</label>
                <select name="metodo" required defaultValue="" className={campo + ' h-8 bg-white'}>
                  <option value="" disabled>Selecciona…</option>
                  {Object.entries(METODOS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Nave</label>
                <select name="nave" defaultValue="" className={campo + ' h-8 bg-white'}>
                  <option value="">—</option><option>Nave 1</option><option>Nave 2</option><option>Ambas</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] text-by-gray-dark">Participantes</label>
                  <input name="participantes" type="number" min={0} className={campo + ' h-8'} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-by-gray-dark">Resultado %</label>
                  <input name="resultado_pct" type="number" min={0} max={100} step="0.1" className={campo + ' h-8'} />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] text-by-gray-dark">Conclusiones</label>
                <textarea name="conclusiones" required rows={3} className={campo + ' py-1.5'} />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] text-by-gray-dark">Acciones para mejorar</label>
                <textarea name="acciones" rows={3} className={campo + ' py-1.5'} />
              </div>
              <div className="flex items-center gap-3 md:col-span-4">
                <button disabled={pendEva} className={boton}>Guardar evaluación</button>
                {estEva.error && <span className="text-[12px] text-red-600">{estEva.error}</span>}
                {estEva.ok && <span className="text-[12px] text-emerald-700">✓ Guardada</span>}
              </div>
            </form>
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-black/5 text-left text-[11px] uppercase tracking-wide text-by-gray">
                <th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Método</th><th className="px-3 py-2">Nave</th>
                <th className="px-3 py-2">Participantes</th><th className="px-3 py-2">Resultado</th>
                <th className="px-3 py-2">Conclusiones</th><th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {evaluaciones.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-by-gray">Todavía no hay evaluaciones registradas.</td></tr>
              )}
              {evaluaciones.map((e) => (
                <tr key={e.id} className="border-b border-black/5 align-top last:border-0">
                  <td className="px-3 py-2">{new Date(e.fecha + 'T12:00:00').toLocaleDateString('es-MX')}</td>
                  <td className="px-3 py-2">{METODOS[e.metodo]}</td>
                  <td className="px-3 py-2">{e.nave ?? '—'}</td>
                  <td className="px-3 py-2">{e.participantes ?? '—'}</td>
                  <td className="px-3 py-2">{e.resultado_pct != null ? `${e.resultado_pct}%` : '—'}</td>
                  <td className="px-3 py-2">{e.conclusiones}</td>
                  <td className="px-3 py-2">{e.acciones ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
