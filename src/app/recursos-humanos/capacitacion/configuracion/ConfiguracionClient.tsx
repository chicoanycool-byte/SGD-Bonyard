'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { actualizarCurso, cambiarRequisito, crearCurso, type EstadoCapAccion } from '../actions'

type Curso = { id: string; codigo: string; nombre: string; norma: string; clausula: string | null; vigencia_meses: number | null; activo: boolean }
type Puesto = { id: string; nombre: string; area: string }

const campo =
  'rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

function FilaCurso({ c }: { c: Curso }) {
  const [vig, setVig] = useState(c.vigencia_meses ? String(c.vigencia_meses) : '')
  const [activo, setActivo] = useState(c.activo)
  const [pendiente, inicio] = useTransition()
  const guardar = (v: string, a: boolean) => inicio(() => actualizarCurso(c.id, v ? Number(v) : null, a))
  return (
    <tr className="border-b border-black/5 last:border-0">
      <td className="px-3 py-2 font-medium">{c.codigo}</td>
      <td className="px-3 py-2">{c.nombre}</td>
      <td className="px-3 py-2">{c.norma}{c.clausula ? ` · ${c.clausula}` : ''}</td>
      <td className="px-3 py-2">
        <input
          value={vig}
          onChange={(e) => setVig(e.target.value.replace(/\D/g, ''))}
          onBlur={() => guardar(vig, activo)}
          placeholder="sin vencimiento"
          className={campo + ' h-7 w-28'}
          disabled={pendiente}
        />
      </td>
      <td className="px-3 py-2">
        <label className="flex items-center gap-1.5 text-[12px]">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => {
              setActivo(e.target.checked)
              guardar(vig, e.target.checked)
            }}
          />
          Activo
        </label>
      </td>
    </tr>
  )
}

function CeldaReq({ puestoId, cursoId, inicial }: { puestoId: string; cursoId: string; inicial: boolean }) {
  const [on, setOn] = useState(inicial)
  const [pendiente, inicio] = useTransition()
  return (
    <input
      type="checkbox"
      checked={on}
      disabled={pendiente}
      onChange={(e) => {
        setOn(e.target.checked)
        inicio(() => cambiarRequisito(puestoId, cursoId, e.target.checked))
      }}
    />
  )
}

export default function ConfiguracionClient({ cursos, puestos, requisitos }: { cursos: Curso[]; puestos: Puesto[]; requisitos: string[] }) {
  const [estado, accion, pendiente] = useActionState(crearCurso, {} as EstadoCapAccion)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (estado.ok) ref.current?.reset()
  }, [estado.ok])
  const set = new Set(requisitos)
  const activos = cursos.filter((c) => c.activo)

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-left text-[11px] uppercase tracking-wide text-by-gray">
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Curso</th>
              <th className="px-3 py-2">Norma y cláusula</th>
              <th className="px-3 py-2">Vigencia (meses)</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>{cursos.map((c) => <FilaCurso key={c.id} c={c} />)}</tbody>
        </table>
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Agregar curso</p>
        <form ref={ref} action={accion} className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input name="codigo" placeholder="CAP-XXX" required className={campo + ' h-8'} />
          <input name="nombre" placeholder="Nombre del curso" required className={campo + ' h-8 md:col-span-2'} />
          <select name="norma" defaultValue="AMBAS" className={campo + ' h-8'}>
            <option value="ISO">ISO 9001</option>
            <option value="SQF">SQF</option>
            <option value="AMBAS">Ambas</option>
          </select>
          <input name="clausula" placeholder="Cláusula (opcional)" className={campo + ' h-8'} />
          <input name="vigencia_meses" type="number" min="1" placeholder="Vigencia en meses" className={campo + ' h-8'} />
          <div className="flex items-center gap-3 md:col-span-4">
            <button disabled={pendiente} className="h-8 rounded-md bg-by-primary px-4 text-[13px] font-medium text-white disabled:opacity-60">
              Agregar
            </button>
            {estado.error && <span className="text-[12px] text-red-600">{estado.error}</span>}
            {estado.ok && <span className="text-[12px] text-emerald-700">Curso agregado.</span>}
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <p className="px-3 pt-3 text-[13px] font-medium text-by-gray-dark">¿Qué curso requiere cada puesto?</p>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-black/5 text-left text-[11px] text-by-gray">
              <th className="px-3 py-2">Puesto</th>
              {activos.map((c) => (
                <th key={c.id} className="px-2 py-2 text-center" title={c.nombre}>{c.codigo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {puestos.map((p) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-1.5">
                  {p.nombre}
                  <span className="block text-[10.5px] text-by-gray">{p.area}</span>
                </td>
                {activos.map((c) => (
                  <td key={c.id} className="px-2 py-1.5 text-center">
                    <CeldaReq puestoId={p.id} cursoId={c.id} inicial={set.has(`${p.id}|${c.id}`)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
