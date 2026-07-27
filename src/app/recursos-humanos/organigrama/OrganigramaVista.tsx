'use client'

import { useEffect, useState } from 'react'
import { obtenerUrlArchivoRrhh } from '../actions'

type Organigrama = { id: string; nombre_archivo: string; storage_path: string; actualizado_en: string } | null

export default function OrganigramaVista({ organigrama }: { organigrama: Organigrama }) {
  const [urlPreview, setUrlPreview] = useState<string | null>(null)
  const [cargandoPreview, setCargandoPreview] = useState(false)

  useEffect(() => {
    if (!organigrama) {
      setUrlPreview(null)
      return
    }
    setCargandoPreview(true)
    obtenerUrlArchivoRrhh(organigrama.storage_path)
      .then((url) => setUrlPreview(url))
      .catch(() => setUrlPreview(null))
      .finally(() => setCargandoPreview(false))
  }, [organigrama?.storage_path])

  async function abrir() {
    if (!organigrama) return
    try {
      const url = await obtenerUrlArchivoRrhh(organigrama.storage_path)
      window.open(url, '_blank')
    } catch {
      alert('No se pudo abrir el archivo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Organigrama</p>

      <div className="rounded-xl border border-black/5 bg-white p-5">
        {organigrama ? (
          <>
            <p className="mb-3 text-[12px] text-by-gray-light">
              {organigrama.nombre_archivo} · actualizado el{' '}
              {new Date(organigrama.actualizado_en).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
            </p>

            <div className="mb-3 overflow-hidden rounded-lg border border-black/10 bg-[#f4f6f6]" style={{ height: '75vh' }}>
              {cargandoPreview && (
                <div className="flex h-full items-center justify-center text-[12px] text-by-gray-light">
                  Cargando vista previa…
                </div>
              )}
              {!cargandoPreview && urlPreview && (
                <iframe src={urlPreview} title="Organigrama" className="h-full w-full" />
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
          <p className="text-[12px] text-by-gray-light">Aún no se ha subido el organigrama.</p>
        )}
      </div>
    </div>
  )
}
