'use client'

import { useState } from 'react'
import { subirDocumento } from './actions'

type Fila = {
  archivo: File
  codigo: string
  nombre: string
  version: string
  estado: 'pendiente' | 'subiendo' | 'ok' | 'error'
  mensaje?: string
}

const REGEX_VERSION = /VERSI[OÓ]N\s*[:\-]?\s*([A-Za-z0-9.]{1,10})/i

async function extraerVersionDeArchivo(archivo: File): Promise<string | null> {
  const nombre = archivo.name.toLowerCase()
  try {
    if (nombre.endsWith('.docx')) {
      const mammoth = await import('mammoth')
      const arrayBuffer = await archivo.arrayBuffer()
      const resultado = await mammoth.extractRawText({ arrayBuffer })
      const match = resultado.value.match(REGEX_VERSION)
      return match ? match[1] : null
    }

    if (nombre.endsWith('.xlsx') || nombre.endsWith('.xls')) {
      const XLSX = await import('xlsx')
      const arrayBuffer = await archivo.arrayBuffer()
      const libro = XLSX.read(arrayBuffer, { type: 'array' })
      for (const nombreHoja of libro.SheetNames) {
        const hoja = libro.Sheets[nombreHoja]
        const texto = XLSX.utils
          .sheet_to_json<string[]>(hoja, { header: 1 })
          .flat()
          .join(' | ')
        const match = texto.match(REGEX_VERSION)
        if (match) return match[1]
      }
      return null
    }
  } catch {
    return null
  }
  return null
}

function sugerirCodigoNombre(nombreArchivo: string) {
  const sinExtension = nombreArchivo.replace(/\.[^.]+$/, '')
  const match = sinExtension.match(/^([A-Za-z]{2,5})[-_ ]?(\d{1,3})[_\s-]*(.*)$/)

  if (match) {
    const [, prefijo, numero, resto] = match
    const codigo = `${prefijo.toUpperCase()}-${numero}`
    const nombre = (resto || sinExtension).replace(/[_-]+/g, ' ').trim().toUpperCase()
    return { codigo, nombre: nombre || codigo }
  }

  const nombre = sinExtension.replace(/[_-]+/g, ' ').trim().toUpperCase()
  return { codigo: '', nombre }
}

export default function SubidaMasiva({ onTerminado }: { onTerminado?: () => void }) {
  const [filas, setFilas] = useState<Fila[]>([])
  const [subiendo, setSubiendo] = useState(false)

  function seleccionarArchivos(lista: FileList | null) {
    if (!lista) return
    const nuevas: Fila[] = Array.from(lista).map((archivo) => {
      const { codigo, nombre } = sugerirCodigoNombre(archivo.name)
      return { archivo, codigo, nombre, version: '', estado: 'pendiente' }
    })
    setFilas(nuevas)

    // Detección de versión: se hace en segundo plano y va llenando el
    // campo conforme cada archivo termina de analizarse.
    nuevas.forEach((fila, i) => {
      extraerVersionDeArchivo(fila.archivo).then((version) => {
        if (!version) return
        setFilas((prev) =>
          prev.map((f, idx) =>
            idx === i && f.version === '' ? { ...f, version } : f
          )
        )
      })
    })
  }

  function actualizarFila(i: number, campo: 'codigo' | 'nombre' | 'version', valor: string) {
    setFilas((prev) =>
      prev.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f))
    )
  }

  async function subirTodo() {
    setSubiendo(true)
    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i]
      if (!fila.codigo.trim() || !fila.nombre.trim()) {
        setFilas((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, estado: 'error', mensaje: 'Falta código o nombre' } : f
          )
        )
        continue
      }

      setFilas((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, estado: 'subiendo' } : f))
      )

      const fd = new FormData()
      fd.set('codigo', fila.codigo)
      fd.set('nombre', fila.nombre)
      fd.set('version', fila.version)
      fd.set('archivo', fila.archivo)

      try {
        const resultado = await subirDocumento({}, fd)
        setFilas((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? resultado.ok
                ? { ...f, estado: 'ok' }
                : { ...f, estado: 'error', mensaje: resultado.error }
              : f
          )
        )
      } catch {
        setFilas((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, estado: 'error', mensaje: 'Error de red' } : f
          )
        )
      }
    }
    setSubiendo(false)
    onTerminado?.()
  }

  const listos = filas.filter((f) => f.estado === 'ok').length
  const conError = filas.filter((f) => f.estado === 'error').length

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Carga masiva de documentos
      </p>

      {filas.length === 0 ? (
        <input
          type="file"
          multiple
          onChange={(e) => seleccionarArchivos(e.target.files)}
          className="block w-full text-[12px] text-by-gray-dark file:mr-2 file:h-8 file:rounded-md file:border-0 file:bg-by-primary file:px-3 file:text-[12px] file:text-white"
        />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] text-by-gray-light">
              {filas.length} archivos seleccionados — revisa código, nombre y
              versión antes de subir (la versión se detecta sola en Word/Excel
              si el archivo dice &quot;VERSIÓN: X&quot;)
              {subiendo && ` · ${listos} listos, ${conError} con error`}
            </p>
            {!subiendo && (
              <button
                onClick={() => setFilas([])}
                className="text-[12px] text-by-accent hover:underline"
              >
                Elegir otros archivos
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto rounded-lg border border-black/5">
            <table className="w-full text-left text-[12.5px]">
              <thead className="sticky top-0 bg-[#f4f6f6]">
                <tr className="text-[10.5px] uppercase text-by-gray-light">
                  <th className="px-3 py-1.5 font-normal">Archivo</th>
                  <th className="px-3 py-1.5 font-normal">Código</th>
                  <th className="px-3 py-1.5 font-normal">Nombre</th>
                  <th className="px-3 py-1.5 font-normal">Versión</th>
                  <th className="px-3 py-1.5 font-normal">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="max-w-[160px] truncate px-3 py-1 text-by-gray-light">
                      {f.archivo.name}
                    </td>
                    <td className="px-3 py-1">
                      <input
                        value={f.codigo}
                        disabled={subiendo}
                        onChange={(e) => actualizarFila(i, 'codigo', e.target.value)}
                        className="h-7 w-24 rounded border border-black/10 px-1.5 text-[12px]"
                      />
                    </td>
                    <td className="px-3 py-1">
                      <input
                        value={f.nombre}
                        disabled={subiendo}
                        onChange={(e) => actualizarFila(i, 'nombre', e.target.value)}
                        className="h-7 w-full min-w-[160px] rounded border border-black/10 px-1.5 text-[12px]"
                      />
                    </td>
                    <td className="px-3 py-1">
                      <input
                        value={f.version}
                        disabled={subiendo}
                        onChange={(e) => actualizarFila(i, 'version', e.target.value)}
                        placeholder="Opcional"
                        className="h-7 w-14 rounded border border-black/10 px-1.5 text-[12px]"
                      />
                    </td>
                    <td className="px-3 py-1">
                      {f.estado === 'pendiente' && (
                        <span className="text-by-gray-light">—</span>
                      )}
                      {f.estado === 'subiendo' && (
                        <span className="text-by-accent">Subiendo…</span>
                      )}
                      {f.estado === 'ok' && (
                        <span className="text-[#3d6b53]">✓ Listo</span>
                      )}
                      {f.estado === 'error' && (
                        <span title={f.mensaje} className="text-red-600">
                          Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={subirTodo}
            disabled={subiendo}
            className="mt-3 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
          >
            {subiendo
              ? `Subiendo… (${listos + conError}/${filas.length})`
              : `Subir ${filas.length} documentos`}
          </button>
        </>
      )}
    </div>
  )
}
