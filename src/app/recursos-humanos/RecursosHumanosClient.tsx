'use client'

import { useState, useTransition } from 'react'
import { subirOrganigrama, subirDescriptivo, subirDescriptivosMasivo, obtenerUrlArchivoRrhh } from './actions'

type Organigrama = { id: string; nombre_archivo: string; storage_path: string; actualizado_en: string } | null
type Descriptivo = {
  id: string
  puesto_id: string
  puesto_nombre: string
  nombre_archivo: string
  storage_path: string
  actualizado_en: string
}
type Puesto = { id: string; nombre: string; area: string | null }

export default function RecursosHumanosClient({
  esCoordinador,
  organigrama,
  descriptivos,
  puestos,
}: {
  esCoordinador: boolean
  organigrama: Organigrama
  descriptivos: Descriptivo[]
  puestos: Puesto[]
}) {
  const [tab, setTab] = useState<'organigrama' | 'descriptivos'>('organigrama')
  const [pendiente, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [resultadoMasivo, setResultadoMasivo] = useState<{
    subidos: string[]
    noEmparejados: string[]
  } | null>(null)

  async function abrir(storagePath: string) {
    try {
      const url = await obtenerUrlArchivoRrhh(storagePath)
      window.open(url, '_blank')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo abrir el archivo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Recursos Humanos</p>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('organigrama')}
            className={
              'rounded-md px-3 py-1.5 text-[12px] ' +
              (tab === 'organigrama'
                ? 'border border-by-accent bg-white text-by-accent'
                : 'bg-white text-by-gray-light')
            }
          >
            Organigrama
          </button>
          <button
            onClick={() => setTab('descriptivos')}
            className={
              'rounded-md px-3 py-1.5 text-[12px] ' +
              (tab === 'descriptivos'
                ? 'border border-by-accent bg-white text-by-accent'
                : 'bg-white text-by-gray-light')
            }
          >
            Descriptivos de puesto
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>
      )}

      {tab === 'organigrama' && (
        <div className="rounded-xl border border-black/5 bg-white p-5">
          <p className="mb-1 text-[13px] font-medium text-by-gray-dark">Organigrama vigente</p>
          {organigrama ? (
            <>
              <p className="mb-3 text-[12px] text-by-gray-light">
                {organigrama.nombre_archivo} · actualizado el{' '}
                {new Date(organigrama.actualizado_en).toLocaleDateString('es-MX', {
                  dateStyle: 'medium',
                })}
              </p>
              <button
                onClick={() => abrir(organigrama.storage_path)}
                className="rounded-md bg-by-primary px-4 py-2 text-[12.5px] font-medium text-white"
              >
                Ver / Descargar
              </button>
            </>
          ) : (
            <p className="mb-3 text-[12px] text-by-gray-light">Aún no se ha subido el organigrama.</p>
          )}

          {esCoordinador && (
            <form
              action={(fd) => startTransition(() => subirOrganigrama(fd))}
              className="mt-4 flex items-center gap-2 border-t border-black/5 pt-4"
            >
              <input
                type="file"
                name="archivo"
                accept="application/pdf"
                required
                className="text-[12px]"
              />
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
      )}

      {tab === 'descriptivos' && (
        <div className="flex flex-col gap-4">
          {esCoordinador && (
            <>
              <form
                action={(fd) =>
                  startTransition(async () => {
                    setResultadoMasivo(null)
                    try {
                      const resultado = await subirDescriptivosMasivo(fd)
                      setResultadoMasivo(resultado)
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'No se pudo subir.')
                    }
                  })
                }
                className="flex flex-wrap items-center gap-2 rounded-xl border border-black/5 bg-white p-4"
              >
                <div className="flex-1">
                  <p className="mb-1 text-[12.5px] font-medium text-by-gray-dark">
                    Carga masiva (todos los descriptivos + organigrama de una sola vez)
                  </p>
                  <p className="text-[11px] text-by-gray-light">
                    Selecciona todos los PDF con sus nombres originales (ej. DRH13_DESCRIPTIVO_DE_PUESTO_JEFE_DE_ALMACEN.pdf) y el sistema los empareja solo.
                  </p>
                </div>
                <input type="file" name="archivos" accept="application/pdf" multiple required className="text-[12px]" />
                <button
                  type="submit"
                  disabled={pendiente}
                  className="rounded-md bg-by-primary px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
                >
                  {pendiente ? 'Subiendo…' : 'Subir todos'}
                </button>
              </form>

              {resultadoMasivo && (
                <div className="rounded-xl border border-black/5 bg-white p-4 text-[12px]">
                  {resultadoMasivo.subidos.length > 0 && (
                    <>
                      <p className="mb-1 font-medium text-[#3d6b53]">
                        Subidos correctamente ({resultadoMasivo.subidos.length}):
                      </p>
                      <ul className="mb-3 list-disc pl-4 text-by-gray-dark">
                        {resultadoMasivo.subidos.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {resultadoMasivo.noEmparejados.length > 0 && (
                    <>
                      <p className="mb-1 font-medium text-amber-700">
                        No se pudieron emparejar ({resultadoMasivo.noEmparejados.length}) — súbelos manualmente abajo:
                      </p>
                      <ul className="list-disc pl-4 text-by-gray-dark">
                        {resultadoMasivo.noEmparejados.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              <form
                action={(fd) => startTransition(() => subirDescriptivo(fd))}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-black/5 bg-white p-4"
              >
              <select
                name="puesto_id"
                required
                className="h-8 rounded-md border border-black/10 px-2 text-[12.5px]"
              >
                <option value="">Selecciona un puesto…</option>
                {puestos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <input type="file" name="archivo" accept="application/pdf" required className="text-[12px]" />
              <button
                type="submit"
                disabled={pendiente}
                className="rounded-md border border-by-accent px-3 py-1.5 text-[12px] text-by-accent disabled:opacity-50"
              >
                {pendiente ? 'Subiendo…' : 'Subir / Reemplazar'}
              </button>
              </form>
            </>
          )}

          <div className="rounded-xl border border-black/5 bg-white">
            {descriptivos.length === 0 && (
              <p className="p-4 text-[12.5px] text-by-gray-light">
                No hay descriptivos de puesto disponibles para ti todavía.
              </p>
            )}
            {descriptivos.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 border-b border-black/5 px-4 py-2.5 last:border-0"
              >
                <span className="flex-1 text-[13px] text-by-gray-dark">{d.puesto_nombre}</span>
                <span className="text-[11px] text-by-gray-light">
                  {new Date(d.actualizado_en).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                </span>
                <button
                  onClick={() => abrir(d.storage_path)}
                  className="text-[12px] text-by-accent hover:underline"
                >
                  Ver / Descargar
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-by-gray-light">
            Solo ves tu descriptivo y, si eres jefe, el de las personas que dependen de ti. Director
            General, Gerente de Operaciones, Coordinador del SGI y Auxiliar del SGI ven todos.
          </p>
        </div>
      )}
    </div>
  )
}
