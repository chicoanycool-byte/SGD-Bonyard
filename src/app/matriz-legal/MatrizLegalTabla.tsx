'use client'

import { useState, useTransition } from 'react'
import {
  actualizarFilaMatriz,
  analizarConIA,
  agregarSugerenciaAMatriz,
} from './actions'
import type { SugerenciaLegal } from '@/lib/anthropic'

type Fila = {
  numero: number
  articulo: string | null
  tema: string | null
  explicacion: string | null
  norma: string | null
  requisito_legal: string | null
  aplicacion: string | null
  evidencia: string | null
  elementos_documentos: string | null
  hallazgos_comentarios: string | null
}

const EVIDENCIA_ESTILO: Record<string, string> = {
  SI: 'bg-[#eaf5f0] text-[#3d6b53]',
  NO: 'bg-[#fdecea] text-[#a13c33]',
  NA: 'bg-[#f1efe8] text-[#5f5e5a]',
}

function FilaMatriz({ f, puedeEditar }: { f: Fila; puedeEditar: boolean }) {
  const [pending, startTransition] = useTransition()
  const [evidencia, setEvidencia] = useState(f.evidencia ?? '')
  const [elementos, setElementos] = useState(f.elementos_documentos ?? '')
  const [hallazgos, setHallazgos] = useState(f.hallazgos_comentarios ?? '')

  function guardar(campos: Parameters<typeof actualizarFilaMatriz>[1]) {
    startTransition(() => actualizarFilaMatriz(f.numero, campos))
  }

  const inputCls =
    'w-full rounded-md border border-black/10 px-2 py-1 text-[12px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  return (
    <tr className="border-b border-black/5 align-top last:border-0">
      <td className="px-2 py-2 text-by-gray-light">{f.numero}</td>
      <td className="min-w-[90px] px-2 py-2 text-by-gray-light">{f.articulo}</td>
      <td className="min-w-[140px] px-2 py-2 text-by-gray-dark">{f.tema}</td>
      <td className="min-w-[220px] px-2 py-2 text-by-gray-light">{f.explicacion}</td>
      <td className="min-w-[140px] px-2 py-2 text-by-gray-dark">{f.norma}</td>
      <td className="min-w-[180px] px-2 py-2 text-by-gray-light">{f.requisito_legal}</td>
      <td className="min-w-[160px] px-2 py-2 text-by-gray-light">{f.aplicacion}</td>
      <td className="min-w-[90px] px-2 py-2">
        {puedeEditar ? (
          <select
            disabled={pending}
            value={evidencia}
            onChange={(e) => {
              setEvidencia(e.target.value)
              guardar({ evidencia: e.target.value || null })
            }}
            className={inputCls}
          >
            <option value="">—</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
            <option value="NA">NA</option>
          </select>
        ) : (
          <span className={'rounded-full px-2 py-0.5 text-[11px] ' + (EVIDENCIA_ESTILO[evidencia] ?? '')}>
            {evidencia || '—'}
          </span>
        )}
      </td>
      <td className="min-w-[180px] px-2 py-2">
        {puedeEditar ? (
          <textarea
            disabled={pending}
            value={elementos}
            onChange={(e) => setElementos(e.target.value)}
            onBlur={() => guardar({ elementos_documentos: elementos })}
            rows={2}
            className={inputCls}
          />
        ) : (
          <span className="text-by-gray-light">{elementos || '—'}</span>
        )}
      </td>
      <td className="min-w-[180px] px-2 py-2">
        {puedeEditar ? (
          <textarea
            disabled={pending}
            value={hallazgos}
            onChange={(e) => setHallazgos(e.target.value)}
            onBlur={() => guardar({ hallazgos_comentarios: hallazgos })}
            rows={2}
            className={inputCls}
          />
        ) : (
          <span className="text-by-gray-light">{hallazgos || '—'}</span>
        )}
      </td>
    </tr>
  )
}

export default function MatrizLegalTabla({
  filas,
  puedeEditar,
  esCoordinador,
}: {
  filas: Fila[]
  puedeEditar: boolean
  esCoordinador: boolean
}) {
  const [busqueda, setBusqueda] = useState('')
  const [analizando, setAnalizando] = useState(false)
  const [sugerencias, setSugerencias] = useState<SugerenciaLegal[] | null>(null)
  const [pending, startTransition] = useTransition()
  const [agregadas, setAgregadas] = useState<number[]>([])

  const filtradas = filas.filter((f) => {
    if (!busqueda) return true
    const texto = `${f.tema} ${f.norma} ${f.requisito_legal}`.toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  async function analizar() {
    setAnalizando(true)
    setSugerencias(null)
    try {
      const resultado = await analizarConIA()
      setSugerencias(resultado)
    } finally {
      setAnalizando(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-3">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por tema, norma o requisito…"
          className="h-8 w-80 rounded-md border border-black/10 px-2.5 text-[12.5px]"
        />
        {esCoordinador && (
          <button
            onClick={analizar}
            disabled={analizando}
            className="h-8 rounded-md border border-by-accent px-3 text-[12.5px] font-medium text-by-accent hover:bg-by-accent/10 disabled:opacity-50"
          >
            {analizando ? 'Analizando con IA…' : '✨ Analizar matriz con IA'}
          </button>
        )}
      </div>

      {sugerencias && (
        <div className="rounded-xl border border-[#f0eafa] bg-[#faf8fd] p-3">
          <p className="mb-2 text-[13px] font-medium text-[#6b4fa0]">
            Sugerencias de la IA ({sugerencias.length})
          </p>
          {sugerencias.length === 0 && (
            <p className="text-[12px] text-by-gray-light">
              No se encontraron actualizaciones ni normas faltantes evidentes.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {sugerencias.map((s, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-md bg-white p-2.5">
                <div>
                  <p className="text-[12.5px] font-medium text-by-gray-dark">
                    {s.tipo === 'actualizacion' ? '🔄 Actualización: ' : '➕ Norma faltante: '}
                    {s.titulo}
                  </p>
                  <p className="text-[11.5px] text-by-gray-light">{s.descripcion}</p>
                </div>
                {esCoordinador && !agregadas.includes(i) && (
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await agregarSugerenciaAMatriz(s)
                        setAgregadas((prev) => [...prev, i])
                      })
                    }
                    className="shrink-0 whitespace-nowrap text-[12px] text-by-accent hover:underline disabled:opacity-50"
                  >
                    Agregar a la matriz
                  </button>
                )}
                {agregadas.includes(i) && (
                  <span className="shrink-0 text-[11px] text-[#3d6b53]">✓ Agregada</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-2 py-2 font-normal">No.</th>
              <th className="px-2 py-2 font-normal">Artículo</th>
              <th className="px-2 py-2 font-normal">Tema</th>
              <th className="px-2 py-2 font-normal">Explicación</th>
              <th className="px-2 py-2 font-normal">Norma / Ley</th>
              <th className="px-2 py-2 font-normal">Requisito Legal</th>
              <th className="px-2 py-2 font-normal">Aplicación / Observación</th>
              <th className="px-2 py-2 font-normal">Evidencia</th>
              <th className="px-2 py-2 font-normal">Elementos / Documentos</th>
              <th className="px-2 py-2 font-normal">Hallazgos / Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((f) => (
              <FilaMatriz key={f.numero} f={f} puedeEditar={puedeEditar} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
