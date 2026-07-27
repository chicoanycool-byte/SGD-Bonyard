'use client'

import { useTransition } from 'react'
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
            <button
              onClick={abrir}
              className="rounded-md bg-by-primary px-4 py-2 text-[12.5px] font-medium text-white"
            >
              Ver / Descargar
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
