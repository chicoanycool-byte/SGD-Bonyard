'use client'

import { useMemo, useState, useTransition } from 'react'
import { guardarFsg57 } from './actions'

type Hallazgo = {
  id: string
  clausula: string | null
  requisito: string
  evidencia: string | null
  evidencia_sugerida: string | null
  documento_referencia: string | null
  comentario: string | null
  norma_clausula: 'ISO' | 'SQF' | 'AMBAS' | null
  proceso: string | null
  tema: string | null
  resultado: string | null
}

const RESULTADOS = [
  { id: 'C', label: 'Cumple', activo: 'bg-[#3d8b66] text-white border-[#3d8b66]', reposo: 'text-[#3d6b53] border-[#3d8b66]/40 hover:bg-[#eaf5f0]' },
  { id: 'O', label: 'Observación', activo: 'bg-[#c9922e] text-white border-[#c9922e]', reposo: 'text-[#9a6b1c] border-[#c9922e]/40 hover:bg-[#fdf3e3]' },
  { id: 'OM', label: 'Oport. mejora', activo: 'bg-[#2d7fb8] text-white border-[#2d7fb8]', reposo: 'text-[#2d5f8a] border-[#2d7fb8]/40 hover:bg-[#e6f0fa]' },
  { id: 'NCm', label: 'NC menor', activo: 'bg-[#d9772b] text-white border-[#d9772b]', reposo: 'text-[#a85a1c] border-[#d9772b]/40 hover:bg-[#fdf0e3]' },
  { id: 'NCM', label: 'NC mayor', activo: 'bg-[#c4453a] text-white border-[#c4453a]', reposo: 'text-[#a13c33] border-[#c4453a]/40 hover:bg-[#fdecea]' },
  { id: 'NCC', label: 'NC crítica', activo: 'bg-[#7a1f1f] text-white border-[#7a1f1f]', reposo: 'text-[#7a1f1f] border-[#7a1f1f]/40 hover:bg-[#fbe6e6]' },
  { id: 'NA', label: 'N.A.', activo: 'bg-[#6b6a64] text-white border-[#6b6a64]', reposo: 'text-[#5f5e5a] border-black/15 hover:bg-[#f1efe8]' },
] as const

const NORMA_ESTILO: Record<string, string> = {
  ISO: 'bg-[#e6f0fa] text-[#2d5f8a]',
  SQF: 'bg-[#f0eafa] text-[#6b4fa0]',
  AMBAS: 'bg-[#eaf5f0] text-[#3d6b53]',
}

const REQUIERE_COMENTARIO = new Set(['O', 'OM', 'NCm', 'NCM', 'NCC'])

const inputCls =
  'w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30 disabled:bg-black/[0.02]'

function Pregunta({
  h,
  auditoriaId,
  editable,
  alCambiar,
}: {
  h: Hallazgo
  auditoriaId: string
  editable: boolean
  alCambiar: (id: string, cambios: Partial<Hallazgo>) => void
}) {
  const [, startTransition] = useTransition()
  const [evidencia, setEvidencia] = useState(h.evidencia ?? '')
  const [comentario, setComentario] = useState(h.comentario ?? '')
  const [guardado, setGuardado] = useState(false)

  function guardar(campos: Parameters<typeof guardarFsg57>[2]) {
    startTransition(async () => {
      await guardarFsg57([h.id], auditoriaId, campos)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 1500)
    })
  }

  const pideComentario = h.resultado !== null && REQUIERE_COMENTARIO.has(h.resultado)
  const faltaComentario = pideComentario && !comentario.trim()

  return (
    <div
      className={
        'rounded-xl border bg-white p-4 ' +
        (h.resultado ? 'border-black/10' : 'border-by-accent/40')
      }
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {h.norma_clausula && (
          <span className={'rounded-full px-2 py-0.5 text-[10.5px] font-medium ' + (NORMA_ESTILO[h.norma_clausula] ?? '')}>
            {h.norma_clausula === 'ISO' ? 'ISO 9001' : h.norma_clausula}
          </span>
        )}
        <span className="text-[12px] font-medium text-by-gray-dark">{h.clausula}</span>
        {h.tema && <span className="text-[12px] text-by-gray-light">· {h.tema}</span>}
        {guardado && <span className="ml-auto text-[11px] text-[#3d6b53]">✓ Guardado</span>}
      </div>

      <p className="mb-3 text-[14px] leading-snug text-by-gray-dark">{h.requisito}</p>

      <div className="mb-3 grid gap-2 rounded-lg bg-black/[0.03] p-3 text-[12px] text-by-gray-dark sm:grid-cols-2">
        <div>
          <p className="mb-0.5 text-[10.5px] uppercase text-by-gray-light">Documentos de referencia</p>
          <p>{h.documento_referencia || '—'}</p>
        </div>
        <div>
          <p className="mb-0.5 text-[10.5px] uppercase text-by-gray-light">Evidencia a solicitar</p>
          <p>{h.evidencia_sugerida || '—'}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {RESULTADOS.map((r) => {
          const seleccionado = h.resultado === r.id
          return (
            <button
              key={r.id}
              type="button"
              disabled={!editable}
              onClick={() => {
                alCambiar(h.id, { resultado: r.id })
                guardar({ resultado: r.id })
              }}
              className={
                'h-10 min-w-[84px] flex-1 rounded-lg border px-3 text-[13px] font-medium transition disabled:opacity-60 ' +
                (seleccionado ? r.activo : 'bg-white ' + r.reposo)
              }
            >
              {r.label}
            </button>
          )
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <textarea
          disabled={!editable}
          value={evidencia}
          rows={2}
          placeholder="Evidencia encontrada (registro, entrevista, recorrido…)"
          onChange={(e) => setEvidencia(e.target.value)}
          onBlur={() => {
            if (evidencia !== (h.evidencia ?? '')) {
              alCambiar(h.id, { evidencia })
              guardar({ evidencia })
            }
          }}
          className={inputCls}
        />
        <div>
          <textarea
            disabled={!editable}
            value={comentario}
            rows={2}
            placeholder={pideComentario ? 'Describe el hallazgo (obligatorio)' : 'Comentarios / notas'}
            onChange={(e) => setComentario(e.target.value)}
            onBlur={() => {
              if (comentario !== (h.comentario ?? '')) {
                alCambiar(h.id, { comentario })
                guardar({ comentario })
              }
            }}
            className={inputCls + (faltaComentario ? ' border-[#c4453a]/60' : '')}
          />
          {faltaComentario && (
            <p className="mt-0.5 text-[11px] text-[#a13c33]">Falta describir el hallazgo.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChecklistFSG57({
  auditoriaId,
  hallazgos: inicial,
  puedeEditar,
  bloqueado,
}: {
  auditoriaId: string
  hallazgos: Hallazgo[]
  puedeEditar: boolean
  bloqueado: boolean
}) {
  const [hallazgos, setHallazgos] = useState(inicial)
  const [normaFiltro, setNormaFiltro] = useState<'TODAS' | 'ISO' | 'SQF'>('TODAS')
  const [, startTransition] = useTransition()
  const editable = puedeEditar && !bloqueado

  const procesos = useMemo(() => {
    const orden: string[] = []
    for (const h of hallazgos) {
      if (h.proceso && !orden.includes(h.proceso)) orden.push(h.proceso)
    }
    return orden
  }, [hallazgos])

  const [actual, setActual] = useState(procesos[0] ?? '')

  const visibles = (h: Hallazgo) => normaFiltro === 'TODAS' || h.norma_clausula === normaFiltro
  const total = hallazgos.filter(visibles).length
  const respondidas = hallazgos.filter((h) => visibles(h) && h.resultado).length
  const porcentaje = total ? Math.round((respondidas / total) * 100) : 0
  const sinComentario = hallazgos.filter(
    (h) => h.resultado && REQUIERE_COMENTARIO.has(h.resultado) && !(h.comentario ?? '').trim()
  ).length

  function cambiar(id: string, cambios: Partial<Hallazgo>) {
    setHallazgos((prev) => prev.map((h) => (h.id === id ? { ...h, ...cambios } : h)))
  }

  const preguntas = hallazgos.filter((h) => h.proceso === actual && visibles(h))
  const pendientesActual = preguntas.filter((h) => !h.resultado)
  const indice = procesos.indexOf(actual)
  const siguiente = procesos[indice + 1]

  function todoCumple() {
    const ids = pendientesActual.map((h) => h.id)
    if (ids.length === 0) return
    ids.forEach((id) => cambiar(id, { resultado: 'C' }))
    startTransition(async () => {
      await guardarFsg57(ids, auditoriaId, { resultado: 'C' })
    })
  }

  function conteoProceso(p: string) {
    const lista = hallazgos.filter((h) => h.proceso === p && visibles(h))
    return { total: lista.length, hechas: lista.filter((h) => h.resultado).length }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-by-gray-dark">
            Lista de verificación FSG-57 — Nave 1
            <span className="ml-2 text-[11px] font-normal text-by-gray-light">
              {respondidas} de {total} respondidas ({porcentaje}%)
            </span>
          </p>
          <div className="flex gap-1 text-[11.5px]">
            {(['TODAS', 'ISO', 'SQF'] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNormaFiltro(n)}
                className={
                  'rounded-full border px-3 py-1 transition ' +
                  (normaFiltro === n
                    ? 'border-by-primary bg-by-primary text-white'
                    : 'border-black/10 text-by-gray-dark hover:bg-black/[0.03]')
                }
              >
                {n === 'TODAS' ? 'Ambas normas' : n === 'ISO' ? 'Solo ISO 9001' : 'Solo SQF'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/5">
          <div className="h-full bg-by-primary transition-all" style={{ width: `${porcentaje}%` }} />
        </div>
        {sinComentario > 0 && (
          <p className="mt-2 text-[11.5px] text-[#a13c33]">
            {sinComentario} hallazgo(s) sin descripción. Anótala antes de cerrar la auditoría.
          </p>
        )}
        {respondidas < total && !bloqueado && (
          <p className="mt-2 text-[11.5px] text-by-gray-light">
            Las preguntas sin respuesta no se cuentan como hallazgos; respóndelas antes de cerrar.
          </p>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {procesos.map((p) => {
          const { total: t, hechas } = conteoProceso(p)
          if (t === 0) return null
          const completo = hechas === t
          return (
            <button
              key={p}
              type="button"
              onClick={() => setActual(p)}
              className={
                'shrink-0 rounded-lg border px-3 py-1.5 text-left text-[12px] transition ' +
                (actual === p
                  ? 'border-by-primary bg-by-primary text-white'
                  : completo
                    ? 'border-[#3d8b66]/40 bg-[#eaf5f0] text-[#3d6b53]'
                    : 'border-black/10 bg-white text-by-gray-dark hover:bg-black/[0.03]')
              }
            >
              <span className="block font-medium">{p}</span>
              <span className="block text-[10.5px] opacity-80">
                {completo ? '✓ ' : ''}
                {hechas}/{t}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">
          {actual}
          <span className="ml-2 text-[11.5px] font-normal text-by-gray-light">
            {preguntas.length} pregunta(s)
          </span>
        </p>
        {editable && pendientesActual.length > 0 && (
          <button
            type="button"
            onClick={todoCumple}
            className="h-8 rounded-md border border-[#3d8b66]/50 px-3 text-[12px] font-medium text-[#3d6b53] transition hover:bg-[#eaf5f0]"
          >
            Marcar pendientes como Cumple ({pendientesActual.length})
          </button>
        )}
      </div>

      {preguntas.map((h) => (
        <Pregunta
          key={h.id}
          h={h}
          auditoriaId={auditoriaId}
          editable={editable}
          alCambiar={cambiar}
        />
      ))}

      {siguiente && (
        <button
          type="button"
          onClick={() => {
            setActual(siguiente)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="h-10 w-fit self-end rounded-md bg-by-primary px-5 text-[13px] font-medium text-white transition hover:bg-by-primary-dark"
        >
          Siguiente: {siguiente} →
        </button>
      )}
    </div>
  )
}
