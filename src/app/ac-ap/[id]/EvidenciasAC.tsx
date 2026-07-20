'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { subirEvidenciaAC, obtenerUrlEvidenciaAC, eliminarEvidenciaAC } from '../actions'

type Evidencia = {
  id: string
  nombre_archivo: string
  storage_path: string
  subido_por_nombre: string | null
  creado_en: string
}

export default function EvidenciasAC({
  accionId,
  evidencias,
  puedeSubir,
}: {
  accionId: string
  evidencias: Evidencia[]
  puedeSubir: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [abriendo, setAbriendo] = useState<string | null>(null)
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function ver(e: Evidencia) {
    setAbriendo(e.id)
    try {
      const url = await obtenerUrlEvidenciaAC(e.storage_path)
      if (url) window.open(url, '_blank')
    } finally {
      setAbriendo(null)
    }
  }

  function quitarSeleccionado(indice: number) {
    setArchivosSeleccionados((prev) => prev.filter((_, i) => i !== indice))
  }

  function subir() {
    setError(null)
    if (archivosSeleccionados.length === 0) {
      setError('Selecciona al menos un archivo primero.')
      return
    }
    const fd = new FormData()
    archivosSeleccionados.forEach((archivo) => fd.append('archivos', archivo))
    startTransition(async () => {
      try {
        await subirEvidenciaAC(accionId, fd)
        setArchivosSeleccionados([])
        if (inputRef.current) inputRef.current.value = ''
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudieron subir los archivos.')
        setArchivosSeleccionados([])
        if (inputRef.current) inputRef.current.value = ''
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Evidencias (documentos y fotos)
      </p>

      <div className="mb-3 flex flex-col gap-2">
        {evidencias.map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-md bg-[#f4f6f6] px-3 py-2">
            <div>
              <button
                onClick={() => ver(e)}
                disabled={abriendo === e.id}
                className="text-[12.5px] text-by-accent hover:underline disabled:opacity-50"
              >
                📎 {e.nombre_archivo}
              </button>
              <p className="text-[10.5px] text-by-gray-light">
                {e.subido_por_nombre ?? '—'} · {new Date(e.creado_en).toLocaleDateString('es-MX')}
              </p>
            </div>
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await eliminarEvidenciaAC(e.id, accionId, e.storage_path)
                  router.refresh()
                })
              }
              className="text-[11px] text-red-600 hover:underline disabled:opacity-50"
            >
              Quitar
            </button>
          </div>
        ))}
        {evidencias.length === 0 && (
          <p className="text-[12px] text-by-gray-light">Sin evidencias adjuntas todavía.</p>
        )}
      </div>

      {puedeSubir && (
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={(e) => {
              setError(null)
              setArchivosSeleccionados(Array.from(e.target.files ?? []))
            }}
            className="text-[12.5px]"
          />

          {archivosSeleccionados.length > 0 && (
            <div className="flex flex-col gap-1 rounded-md bg-[#f4f6f6] p-2">
              {archivosSeleccionados.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-[12px] text-by-gray-dark">
                  <span>📄 {a.name}</span>
                  <button
                    type="button"
                    onClick={() => quitarSeleccionado(i)}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={pending || archivosSeleccionados.length === 0}
            onClick={subir}
            className="h-8 w-fit rounded-md bg-by-primary px-4 text-[12px] font-medium text-white disabled:opacity-50"
          >
            {pending
              ? 'Subiendo…'
              : `Adjuntar${archivosSeleccionados.length > 1 ? ` (${archivosSeleccionados.length})` : ''}`}
          </button>

          {error && <p className="text-[11.5px] text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
