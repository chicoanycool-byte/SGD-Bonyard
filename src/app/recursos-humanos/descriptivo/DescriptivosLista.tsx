'use client'

import { obtenerUrlArchivoRrhh } from '../actions'

type Descriptivo = {
  id: string
  puesto_id: string
  puesto_nombre: string
  nombre_archivo: string
  storage_path: string
  actualizado_en: string
}

export default function DescriptivosLista({ descriptivos }: { descriptivos: Descriptivo[] }) {
  async function abrir(storagePath: string) {
    try {
      const url = await obtenerUrlArchivoRrhh(storagePath)
      window.open(url, '_blank')
    } catch {
      alert('No se pudo abrir el archivo.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Ver descriptivo de puesto</p>

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
  )
}
