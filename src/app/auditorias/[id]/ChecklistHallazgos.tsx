'use client'

import { useState, useTransition, useRef } from 'react'
import {
  agregarHallazgo,
  eliminarHallazgo,
  sugerirClasificacion,
  actualizarHallazgo,
} from './actions'

type Hallazgo = {
  id: string
  clausula: string | null
  requisito: string
  evidencia: string | null
  evidencia_sugerida: string | null
  documento_referencia: string | null
  conformidad: 'conforme' | 'no_conforme' | 'oportunidad_mejora' | 'no_aplica'
  tipo_nc: string | null
  comentario: string | null
  clasificacion_ia: string | null
}

const RESULTADO_ESTILO: Record<string, string> = {
  conforme: 'bg-[#eaf5f0] text-[#3d6b53]',
  no_conforme: 'bg-[#fdecea] text-[#a13c33]',
  oportunidad_mejora: 'bg-[#fdf3e3] text-[#9a6b1c]',
  no_aplica: 'bg-[#f1efe8] text-[#5f5e5a]',
}

function FilaHallazgo({
  h,
  auditoriaId,
  puedeEditar,
  bloqueado,
}: {
  h: Hallazgo
  auditoriaId: string
  puedeEditar: boolean
  bloqueado: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [conformidad, setConformidad] = useState(h.conformidad)
  const [tipoNc, setTipoNc] = useState(h.tipo_nc ?? 'menor')
  const [comentario, setComentario] = useState(h.comentario ?? '')
  const [evidencia, setEvidencia] = useState(h.evidencia ?? '')
  const [sugerencia, setSugerencia] = useState(h.clasificacion_ia ?? '')
  const [sugiriendo, setSugiriendo] = useState(false)

  function guardar(cambios: Parameters<typeof actualizarHallazgo>[2]) {
    startTransition(() => actualizarHallazgo(h.id, auditoriaId, cambios))
  }

  async function pedirSugerencia() {
    setSugiriendo(true)
    try {
      const resultado = await sugerirClasificacion(h.requisito, evidencia || comentario)
      setConformidad(resultado.conformidad)
      if (resultado.tipo_nc) setTipoNc(resultado.tipo_nc)
      setSugerencia(resultado.justificacion)
      guardar({
        conformidad: resultado.conformidad,
        tipo_nc: resultado.tipo_nc,
      })
    } catch {
      setSugerencia('No se pudo obtener sugerencia de la IA.')
    } finally {
      setSugiriendo(false)
    }
  }

  const inputCls =
    'w-full rounded-md border border-black/10 px-2 py-1 text-[12px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  return (
    <tr className="border-b border-black/5 last:border-0 align-top">
      <td className="w-16 px-3 py-2 text-by-gray-light">{h.clausula ?? '—'}</td>
      <td className="min-w-[220px] px-3 py-2 text-by-gray-dark">
        {h.requisito}
        {h.documento_referencia && (
          <p className="mt-0.5 text-[10.5px] text-by-gray-light">{h.documento_referencia}</p>
        )}
      </td>
      <td className="min-w-[160px] px-3 py-2">
        <textarea
          disabled={bloqueado || !puedeEditar}
          value={evidencia}
          placeholder={h.evidencia_sugerida ?? 'Evidencia encontrada'}
          onChange={(e) => setEvidencia(e.target.value)}
          onBlur={() => guardar({ evidencia })}
          rows={2}
          className={inputCls}
        />
      </td>
      <td className="w-32 px-3 py-2">
        <select
          disabled={bloqueado || !puedeEditar}
          value={conformidad}
          onChange={(e) => {
            const val = e.target.value as Hallazgo['conformidad']
            setConformidad(val)
            guardar({ conformidad: val, tipo_nc: val === 'no_conforme' ? tipoNc : null })
          }}
          className={inputCls}
        >
          <option value="conforme">Conforme</option>
          <option value="no_conforme">No conforme</option>
          <option value="no_aplica">N.A.</option>
        </select>
      </td>
      <td className="min-w-[160px] px-3 py-2">
        <textarea
          disabled={bloqueado || !puedeEditar}
          value={comentario}
          placeholder="Por qué es NC / comentario"
          onChange={(e) => setComentario(e.target.value)}
          onBlur={() => guardar({ comentario })}
          rows={2}
          className={inputCls}
        />
      </td>
      <td className="w-40 px-3 py-2">
        {conformidad === 'no_conforme' && (
          <div className="flex flex-col gap-1">
            <select
              disabled={bloqueado || !puedeEditar}
              value={tipoNc}
              onChange={(e) => {
                setTipoNc(e.target.value)
                guardar({ tipo_nc: e.target.value })
              }}
              className={inputCls}
            >
              <option value="mayor">Mayor</option>
              <option value="menor">Menor</option>
              <option value="oportunidad_mejora">Oportunidad de mejora</option>
            </select>
            {!bloqueado && puedeEditar && (
              <button
                type="button"
                onClick={pedirSugerencia}
                disabled={sugiriendo}
                className="text-[11px] text-by-accent hover:underline disabled:opacity-50"
              >
                {sugiriendo ? 'Analizando…' : '✨ Sugerir (IA)'}
              </button>
            )}
            {sugerencia && (
              <p className="text-[10px] italic text-by-gray-light">{sugerencia}</p>
            )}
          </div>
        )}
      </td>
      {!bloqueado && puedeEditar && (
        <td className="w-16 px-3 py-2">
          <button
            disabled={pending}
            onClick={() => startTransition(() => eliminarHallazgo(h.id, auditoriaId))}
            className="text-[11px] text-red-600 hover:underline disabled:opacity-50"
          >
            Eliminar
          </button>
        </td>
      )}
    </tr>
  )
}

export default function ChecklistHallazgos({
  auditoriaId,
  hallazgos,
  puedeEditar,
  bloqueado,
}: {
  auditoriaId: string
  hallazgos: Hallazgo[]
  puedeEditar: boolean
  bloqueado: boolean
}) {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      await agregarHallazgo(auditoriaId, formData)
      formRef.current?.reset()
    })
  }

  const conformes = hallazgos.filter((h) => h.conformidad === 'conforme').length
  const noConformes = hallazgos.filter((h) => h.conformidad === 'no_conforme').length

  return (
    <div className="rounded-xl border border-black/5 bg-white">
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-2">
        <p className="text-[13px] font-medium text-by-gray-dark">
          Checklist de hallazgos
          {hallazgos.length > 0 && (
            <span className="ml-2 text-[11px] font-normal text-by-gray-light">
              {hallazgos.length} puntos · {conformes} conformes · {noConformes} no conformes
            </span>
          )}
        </p>
        {!bloqueado && puedeEditar && (
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="text-[12px] text-by-accent hover:underline"
          >
            {mostrarForm ? 'Ocultar' : '+ Agregar hallazgo manual'}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Cláusula</th>
              <th className="px-3 py-2 font-normal">Requisito</th>
              <th className="px-3 py-2 font-normal">Evidencia</th>
              <th className="px-3 py-2 font-normal">Resultado</th>
              <th className="px-3 py-2 font-normal">Comentarios</th>
              <th className="px-3 py-2 font-normal">Clasificación NC</th>
              {!bloqueado && puedeEditar && <th className="px-3 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {hallazgos.map((h) => (
              <FilaHallazgo
                key={h.id}
                h={h}
                auditoriaId={auditoriaId}
                puedeEditar={puedeEditar}
                bloqueado={bloqueado}
              />
            ))}
            {hallazgos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  Aún no hay hallazgos. Si es una auditoría interna, se precargan al dar
                  &quot;Iniciar auditoría&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {mostrarForm && !bloqueado && puedeEditar && (
        <form
          ref={formRef}
          action={onSubmit}
          className="grid grid-cols-5 gap-2 border-t border-black/5 p-3"
        >
          <input
            name="requisito"
            placeholder="Requisito / punto auditado"
            required
            className="h-8 rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
          <input
            name="evidencia"
            placeholder="Evidencia"
            className="h-8 rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
          <select
            name="conformidad"
            defaultValue="conforme"
            className="h-8 rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="conforme">Conforme</option>
            <option value="no_conforme">No conforme</option>
            <option value="no_aplica">N.A.</option>
          </select>
          <select
            name="tipo_nc"
            defaultValue="menor"
            className="h-8 rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="mayor">Mayor</option>
            <option value="menor">Menor</option>
            <option value="oportunidad_mejora">Oportunidad de mejora</option>
          </select>
          <input
            name="comentario"
            placeholder="Comentario"
            className="h-8 rounded-md border border-black/10 px-2.5 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
          <button
            type="submit"
            disabled={pending}
            className="col-span-5 h-8 w-fit rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
          >
            {pending ? 'Agregando…' : 'Agregar hallazgo'}
          </button>
        </form>
      )}
    </div>
  )
}
