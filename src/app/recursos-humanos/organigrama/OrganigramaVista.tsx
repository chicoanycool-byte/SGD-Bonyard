'use client'

import { obtenerUrlArchivoRrhh } from '../actions'

type Organigrama = { id: string; nombre_archivo: string; storage_path: string; actualizado_en: string } | null

export default function OrganigramaVista({ organigrama }: { organigrama: Organigrama }) {
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
            <button
              onClick={abrir}
              className="rounded-md bg-by-primary px-4 py-2 text-[12.5px] font-medium text-white"
            >
              Ver / Descargar
            </button>
          </>
        ) : (
          <p className="text-[12px] text-by-gray-light">Aún no se ha subido el organigrama.</p>
        )}
      </div>
    </div>
  )
}
