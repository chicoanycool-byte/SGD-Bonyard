'use client'

import { useEffect, useState, useTransition } from 'react'
import { subirManual, obtenerUrlManual } from '../actions'

type Manual = { nave: string; nombre_archivo: string; storage_path: string; actualizado_en: string }

const NAVES = ['Nave 1', 'Nave 2']

export default function ManualClient({
  esCoordinador,
  manuales,
}: {
  esCoordinador: boolean
  manuales: Manual[]
}) {
  const [nave, setNave] = useState('Nave 1')
  const [pendiente, startTransition] = useTransition()
  const [urlPreview, setUrlPreview] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const manual = manuales.find((m) => m.nave === nave) ?? null

  useEffect(() => {
    if (!manual) {
      setUrlPreview(null)
      return
    }
    setCargando(true)
    obtenerUrlManual(manual.storage_path)
      .then((url) => setUrlPreview(url))
      .catch(() => setUrlPreview(null))
      .finally(() => setCargando(false))
  }, [manual?.storage_path])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Manual de Seguridad Patrimonial (MSP-01)</p>
        <div className="flex gap-2">
          {NAVES.map((n) => (
            <button
              key={n}
              onClick={() => setNave(n)}
              className={
                'rounded-md px-3 py-1.5 text-[12px] ' +
                (nave === n ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')
              }
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-5">
        {manual ? (
          <>
            <p className="mb-3 text-[12px] text-by-gray-light">
              {manual.nombre_archivo} · actualizado el{' '}
              {new Date(manual.actualizado_en).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
            </p>
            <div className="mb-3 overflow-hidden rounded-lg border border-black/10 bg-[#f4f6f6]" style={{ height: '70vh' }}>
              {cargando && (
                <div className="flex h-full items-center justify-center text-[12px] text-by-gray-light">
                  Cargando vista previa…
                </div>
              )}
              {!cargando && urlPreview && <iframe src={urlPreview} title="Manual" className="h-full w-full" />}
              {!cargando && !urlPreview && (
                <div className="flex h-full items-center justify-center text-[12px] text-by-gray-light">
                  No se pudo cargar la vista previa.
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="mb-3 text-[12px] text-by-gray-light">Aún no se ha subido el manual para {nave}.</p>
        )}

        {esCoordinador && (
          <form action={(fd) => startTransition(() => subirManual(fd))} className="flex items-center gap-2 border-t border-black/5 pt-4">
            <input type="hidden" name="nave" value={nave} />
            <input type="file" name="archivo" accept="application/pdf" required className="text-[12px]" />
            <button disabled={pendiente} className="rounded-md border border-by-accent px-3 py-1.5 text-[12px] text-by-accent disabled:opacity-50">
              {pendiente ? 'Subiendo…' : 'Subir / Reemplazar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
