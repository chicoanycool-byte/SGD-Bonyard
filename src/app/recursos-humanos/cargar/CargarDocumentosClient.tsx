'use client'

import { useState, useTransition } from 'react'
import {
  subirOrganigrama,
  subirDescriptivo,
  subirDescriptivosMasivo,
  eliminarOrganigrama,
  eliminarDescriptivo,
  obtenerUrlArchivoRrhh,
} from '../actions'

type Organigrama = { id: string; nombre_archivo: string; storage_path: string; actualizado_en: string } | null
type Descriptivo = {
  id: string
  puesto_id: string
  puesto_nombre: string
  nombre_archivo: string
  storage_path: string
  actualizado_en: string
}
type Puesto = { id: string; nombre: string }

export default function CargarDocumentosClient({
  organigrama,
  descriptivos,
  puestos,
}: {
  organigrama: Organigrama
  descriptivos: Descriptivo[]
  puestos: Puesto[]
}) {
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
    } catch {
      setError('No se pudo abrir el archivo.')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[14px] font-medium text-by-gray-dark">Cargar documentos de RRHH</p>
        <p className="text-[11.5px] text-by-gray-light">
          Solo el Coordinador SGI puede subir, reemplazar o eliminar estos documentos.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}

      {/* Carga masiva */}
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
            Selecciona todos los PDF con sus nombres originales (ej.
            DRH13_DESCRIPTIVO_DE_PUESTO_JEFE_DE_ALMACEN.pdf) y el sistema los empareja solo.
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

      {/* Organigrama */}
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Organigrama</p>
        {organigrama ? (
          <div className="mb-3 flex items-center gap-2 text-[12px] text-by-gray-dark">
            <span className="flex-1">{organigrama.nombre_archivo}</span>
            <button onClick={() => abrir(organigrama.storage_path)} className="text-by-accent hover:underline">
              Ver
            </button>
            <button
              onClick={() => {
                if (!confirm('¿Eliminar el organigrama vigente?')) return
                startTransition(() => eliminarOrganigrama())
              }}
              disabled={pendiente}
              className="text-red-600 hover:underline disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        ) : (
          <p className="mb-3 text-[12px] text-by-gray-light">No hay organigrama cargado.</p>
        )}
        <form
          action={(fd) => startTransition(() => subirOrganigrama(fd))}
          className="flex items-center gap-2"
        >
          <input type="file" name="archivo" accept="application/pdf" required className="text-[12px]" />
          <button
            type="submit"
            disabled={pendiente}
            className="rounded-md border border-by-accent px-3 py-1.5 text-[12px] text-by-accent disabled:opacity-50"
          >
            {pendiente ? 'Subiendo…' : 'Subir / Reemplazar'}
          </button>
        </form>
      </div>

      {/* Descriptivo individual */}
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Subir un descriptivo individual</p>
        <form
          action={(fd) => startTransition(() => subirDescriptivo(fd))}
          className="flex flex-wrap items-center gap-2"
        >
          <select
            name="puesto_id"
            required
            defaultValue=""
            className="h-8 rounded-md border border-black/10 px-2 text-[12.5px]"
          >
            <option value="" disabled>
              Selecciona un puesto…
            </option>
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
      </div>

      {/* Lista de descriptivos ya cargados, con eliminar */}
      <div className="rounded-xl border border-black/5 bg-white">
        <p className="border-b border-black/5 p-4 text-[12.5px] font-medium text-by-gray-dark">
          Descriptivos ya cargados ({descriptivos.length})
        </p>
        {descriptivos.length === 0 && (
          <p className="p-4 text-[12.5px] text-by-gray-light">Todavía no hay ninguno cargado.</p>
        )}
        {descriptivos.map((d) => (
          <div key={d.id} className="flex items-center gap-3 border-b border-black/5 px-4 py-2.5 last:border-0">
            <span className="flex-1 text-[13px] text-by-gray-dark">{d.puesto_nombre}</span>
            <span className="text-[11px] text-by-gray-light">
              {new Date(d.actualizado_en).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
            </span>
            <button onClick={() => abrir(d.storage_path)} className="text-[12px] text-by-accent hover:underline">
              Ver
            </button>
            <button
              onClick={() => {
                if (!confirm(`¿Eliminar el descriptivo de ${d.puesto_nombre}?`)) return
                startTransition(() => eliminarDescriptivo(d.puesto_id))
              }}
              disabled={pendiente}
              className="text-[12px] text-red-600 hover:underline disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
