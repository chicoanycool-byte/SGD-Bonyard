'use client'

import { useActionState, useState } from 'react'
import { registrarCapacitacion, type EstadoCapAccion } from './actions'
import { fechaMX, sumarMeses } from '@/lib/capacitacion'

type Curso = { id: string; codigo: string; nombre: string; vigencia_meses: number | null }
type Persona = { id: string; nombre: string; puesto: string | null }

const campo =
  'w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

export default function RegistrarWizard({
  cursos,
  personas,
  cursoInicial,
  personasIniciales,
  hoy,
  onCerrar,
}: {
  cursos: Curso[]
  personas: Persona[]
  cursoInicial: string
  personasIniciales: string[]
  hoy: string
  onCerrar: () => void
}) {
  const [estado, accion, pendiente] = useActionState(registrarCapacitacion, {} as EstadoCapAccion)
  const [paso, setPaso] = useState(cursoInicial ? (personasIniciales.length ? 3 : 2) : 1)
  const [cursoId, setCursoId] = useState(cursoInicial)
  const [ids, setIds] = useState<string[]>(personasIniciales)
  const [fecha, setFecha] = useState(hoy)
  const [mas, setMas] = useState(false)

  const curso = cursos.find((c) => c.id === cursoId)
  const vence = curso?.vigencia_meses && fecha ? sumarMeses(fecha, curso.vigencia_meses) : null
  const alternar = (id: string) => setIds((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))

  if (estado.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-[13.5px] font-medium text-emerald-800">{estado.mensaje}</p>
        <p className="mt-1 text-[12px] text-emerald-700">Ya se actualizó la matriz. No tienes que hacer nada más.</p>
        <button onClick={onCerrar} className="mt-3 h-8 rounded-md bg-emerald-700 px-4 text-[13px] font-medium text-white">
          Cerrar
        </button>
      </div>
    )
  }

  const pasos = ['Curso', 'Personas y fecha', 'Revisar']
  return (
    <div className="rounded-xl border border-by-accent/40 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13.5px] font-medium text-by-gray-dark">Registrar una capacitación</p>
        <button onClick={onCerrar} className="text-[12px] text-by-gray hover:underline">Cancelar</button>
      </div>
      <ol className="mb-4 flex gap-2 text-[11.5px]">
        {pasos.map((t, i) => (
          <li key={t} className={'rounded-full px-3 py-1 ' + (paso === i + 1 ? 'bg-by-primary text-white' : paso > i + 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500')}>
            {i + 1}. {t}
          </li>
        ))}
      </ol>

      <form action={accion} className="flex flex-col gap-4">
        <input type="hidden" name="curso_id" value={cursoId} />
        {ids.map((id) => <input key={id} type="hidden" name="usuario_id" value={id} />)}
        <input type="hidden" name="fecha" value={fecha} />

        {paso === 1 && (
          <div>
            <p className="mb-2 text-[12.5px] text-by-gray-dark">¿Qué curso se tomó?</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {cursos.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => { setCursoId(c.id); setPaso(2) }}
                  className={'rounded-lg border px-3 py-2 text-left text-[12.5px] hover:border-by-accent ' + (cursoId === c.id ? 'border-by-accent bg-by-accent/5' : 'border-black/10')}
                >
                  <span className="font-medium">{c.codigo}</span> {c.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-[12.5px] text-by-gray-dark">
              Curso: <span className="font-medium">{curso?.codigo} {curso?.nombre}</span>{' '}
              <button type="button" onClick={() => setPaso(1)} className="text-by-primary hover:underline">cambiar</button>
            </p>
            <div>
              <p className="mb-2 text-[12.5px] text-by-gray-dark">¿Quiénes lo tomaron? Marca a todos los que asistieron.</p>
              <div className="flex flex-wrap gap-2">
                {personas.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => alternar(p.id)}
                    className={'rounded-full border px-3 py-1 text-[12.5px] ' + (ids.includes(p.id) ? 'border-by-primary bg-by-primary text-white' : 'border-black/10 hover:border-by-accent')}
                  >
                    {ids.includes(p.id) ? '✓ ' : ''}{p.nombre}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setIds(ids.length === personas.length ? [] : personas.map((p) => p.id))} className="mt-2 text-[12px] text-by-primary hover:underline">
                {ids.length === personas.length ? 'Quitar a todos' : 'Marcar a todos'}
              </button>
            </div>
            <div className="max-w-xs">
              <label className="mb-1 block text-[12.5px] text-by-gray-dark">¿Qué día fue?</label>
              <input type="date" value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} className={campo + ' h-8'} />
            </div>
            <div>
              <button
                type="button"
                disabled={ids.length === 0 || !fecha}
                onClick={() => setPaso(3)}
                className="h-8 rounded-md bg-by-primary px-4 text-[13px] font-medium text-white disabled:opacity-50"
              >
                Continuar
              </button>
              {ids.length === 0 && <span className="ml-3 text-[12px] text-by-gray">Marca al menos a una persona.</span>}
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-[#f4f6f6] p-3 text-[12.5px] leading-relaxed text-by-gray-dark">
              <p><span className="font-medium">Curso:</span> {curso?.codigo} {curso?.nombre}</p>
              <p><span className="font-medium">Personas ({ids.length}):</span> {personas.filter((p) => ids.includes(p.id)).map((p) => p.nombre).join(', ')}</p>
              <p><span className="font-medium">Fecha:</span> {fechaMX(fecha)}</p>
              <p><span className="font-medium">Vence:</span> {vence ? fechaMX(vence) : 'no vence'}</p>
              <button type="button" onClick={() => setPaso(2)} className="mt-1 text-by-primary hover:underline">Corregir</button>
            </div>

            <div>
              <button type="button" onClick={() => setMas(!mas)} className="text-[12.5px] text-by-primary hover:underline">
                {mas ? 'Ocultar datos opcionales' : 'Agregar datos opcionales (instructor, calificación, evidencia)'}
              </button>
              <div className={(mas ? 'grid' : 'hidden') + ' mt-3 grid-cols-1 gap-3 md:grid-cols-2'}>
                <div>
                  <label className="mb-1 block text-[11.5px] text-by-gray-dark">Quién lo impartió</label>
                  <input name="instructor" className={campo + ' h-8'} />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] text-by-gray-dark">Calificación (si hubo examen)</label>
                  <input name="calificacion" type="number" step="0.01" min="0" max="100" className={campo + ' h-8'} />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11.5px] text-by-gray-dark">Evidencia: dónde está la lista de asistencia o constancia</label>
                  <input name="evidencia" placeholder="Ej. carpeta de capacitación, FSG firmado, enlace" className={campo + ' h-8'} />
                </div>
                <div>
                  <label className="mb-1 block text-[11.5px] text-by-gray-dark">Cambiar fecha de vencimiento (solo si es distinta)</label>
                  <input name="vigente_hasta" type="date" className={campo + ' h-8'} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button disabled={pendiente} className="h-9 rounded-md bg-by-primary px-5 text-[13px] font-medium text-white disabled:opacity-60">
                {pendiente ? 'Guardando…' : 'Guardar registro'}
              </button>
              {estado.error && <span className="text-[12px] text-red-600">{estado.error}</span>}
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
