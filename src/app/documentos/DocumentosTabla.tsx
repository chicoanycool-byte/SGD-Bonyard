'use client'

import { useState, useTransition } from 'react'
import { obtenerUrlDescarga, obtenerUrlVisualizacion, eliminarDocumento } from './actions'

type Documento = {
  id: string
  codigo: string
  nombre: string
  version: string | null
  proceso: string | null
  storage_path: string | null
  tamano_kb: number | null
  actualizado_en: string
}

export default function DocumentosTabla({
  documentos,
  puedeGestionar,
  permitirDescarga = true,
}: {
  documentos: Documento[]
  puedeGestionar: boolean
  permitirDescarga?: boolean
}) {
  const [busqueda, setBusqueda] = useState('')
  const [pending, startTransition] = useTransition()
  const [descargando, setDescargando] = useState<string | null>(null)
  const [viendo, setViendo] = useState<string | null>(null)

  const filtrados = documentos.filter((d) => {
    const texto = (d.codigo + ' ' + d.nombre).toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  async function ver(d: Documento) {
    if (!d.storage_path) return
    setViendo(d.id)
    try {
      const url = await obtenerUrlVisualizacion(d.storage_path)
      window.open(url, '_blank')
    } catch {
      alert('No se pudo generar el enlace de visualización.')
    } finally {
      setViendo(null)
    }
  }

  async function descargar(d: Documento) {
    if (!d.storage_path) return
    setDescargando(d.id)
    try {
      const url = await obtenerUrlDescarga(d.storage_path)
      window.open(url, '_blank')
    } catch {
      alert('No se pudo generar el enlace de descarga.')
    } finally {
      setDescargando(null)
    }
  }

  function eliminar(d: Documento) {
    if (!confirm(`¿Eliminar el documento ${d.codigo}?`)) return
    startTransition(() => {
      eliminarDocumento(d.id, d.storage_path)
    })
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white">
      <div className="border-b border-black/5 p-3">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o código…"
          className="h-8 w-full max-w-xs rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
        />
      </div>
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
            <th className="px-4 py-2 font-normal">Código</th>
            <th className="px-4 py-2 font-normal">Proceso</th>
            <th className="px-4 py-2 font-normal">Nombre</th>
            <th className="px-4 py-2 font-normal">Versión</th>
            <th className="px-4 py-2 font-normal">Actualizado</th>
            <th className="px-4 py-2 font-normal">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((d) => (
            <tr key={d.id} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-2 font-medium text-by-gray-dark">
                {d.codigo}
              </td>
              <td className="px-4 py-2 text-by-gray-light">{d.proceso ?? '—'}</td>
              <td className="px-4 py-2 text-by-gray-dark">{d.nombre}</td>
              <td className="px-4 py-2 text-by-gray-light">
                {d.version ?? '—'}
              </td>
              <td className="px-4 py-2 text-by-gray-light">
                {new Date(d.actualizado_en).toLocaleDateString('es-MX')}
              </td>
              <td className="px-4 py-2">
                <div className="flex gap-3">
                  <button
                    onClick={() => ver(d)}
                    disabled={viendo === d.id}
                    className="text-[12px] text-by-gray-dark hover:underline disabled:opacity-50"
                  >
                    {viendo === d.id ? 'Abriendo…' : 'Ver'}
                  </button>
                  {permitirDescarga && (
                    <button
                      onClick={() => descargar(d)}
                      disabled={descargando === d.id}
                      className="text-[12px] text-by-accent hover:underline disabled:opacity-50"
                    >
                      {descargando === d.id ? 'Generando…' : 'Descargar'}
                    </button>
                  )}
                  {puedeGestionar && (
                    <button
                      onClick={() => eliminar(d)}
                      disabled={pending}
                      className="text-[12px] text-red-600 hover:underline disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {filtrados.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-6 text-center text-[12px] text-by-gray-light"
              >
                {documentos.length === 0
                  ? 'Aún no hay documentos dados de alta.'
                  : 'Ningún documento coincide con la búsqueda.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
