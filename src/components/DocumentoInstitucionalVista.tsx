'use client'

import { useEffect, useState, useTransition } from 'react'
import { subirDocumentoInstitucional, obtenerUrlInstitucional } from '@/app/institucional-actions'

type Documento = { nombre_archivo: string; storage_path: string; actualizado_en: string } | null

export default function DocumentoInstitucionalVista({
  titulo,
  tipo,
  documento,
  esCoordinador,
}: {
  titulo: string
  tipo: 'politica_calidad' | 'reglamento_higiene'
  documento: Documento
  esCoordinador: boolean
}) {
  const [pendiente, startTransition] = useTransition()
  const [urlPreview, setUrlPreview] = useState<string | null>(null)
  const [cargandoPreview, setCargandoPreview] = useState(false)

  useEffect(() => {
    if (!documento) {
      setUrlPreview(null)
      return
    }
    setCargandoPreview(true)
    obtenerUrlInstitucional(documento.storage_path)
      .then((url) => setUrlPreview(url))
      .catch(() => setUrlPreview(null))
      .finally(() => setCargandoPreview(false))
  }, [documento?.storage_path])

  async function abrir() {
    if (!documento) return
    try {
      const url = await obtenerUrlInstitucional(documento.storage_path)
      window.open(url, '_blank')
    } catch {
      alert('No se pudo abrir el archivo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">{titulo}</p>

      <div className="rounded-xl border border-black/5 bg-white p-5">
        {documento ? (
          <>
            <p className="mb-3 text-[12px] text-by-gray-light">
              {documento.nombre_archivo} · actualizado el{' '}
              {new Date(documento.actualizado_en).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
            </p>

            <div className="mb-3 overflow-hidden rounded-lg border border-black/10 bg-[#f4f6f6]" style={{ height: '75vh' }}>
              {cargandoPreview && (
                <div className="flex h-full items-center justify-center text-[12px] text-by-gray-light">
                  Cargando vista previa…
                </div>
              )}
              {!cargandoPreview && urlPreview && (
                <iframe src={urlPreview} title={titulo} className="h-full w-full" />
              )}
              {!cargandoPreview && !urlPreview && (
                <div className="flex h-full items-center justify-center text-[12px] text-by-gray-light">
                  No se pudo cargar la vista previa.
                </div>
              )}
            </div>

            <button
              onClick={abrir}
              className="rounded-md bg-by-primary px-4 py-2 text-[12.5px] font-medium text-white"
            >
              Abrir en pestaña nueva / Descargar
            </button>
          </>
        ) : (
          <p className="mb-3 text-[12px] text-by-gray-light">Aún no se ha subido este documento.</p>
        )}

        {esCoordinador && (
          <form
            action={(fd) => startTransition(() => subirDocumentoInstitucional(fd))}
            className="mt-4 flex items-center gap-2 border-t border-black/5 pt-4"
          >
            <input type="hidden" name="tipo" value={tipo} />
            <input type="file" name="archivo" accept="application/pdf" required className="text-[12px]" />
            <button
              type="submit"
              disabled={pendiente}
              className="rounded-md border border-by-accent px-3 py-1.5 text-[12px] text-by-accent disabled:opacity-50"
            >
              {pendiente ? 'Subiendo…' : 'Subir / Reemplazar'}
            </button>
          </form>
        )}
      </div>
      <p className="text-[11px] text-by-gray-light">
        Solo el Coordinador SGI puede subir o reemplazar este documento. Todos los usuarios pueden verlo y descargarlo.
      </p>
    </div>
  )
}
