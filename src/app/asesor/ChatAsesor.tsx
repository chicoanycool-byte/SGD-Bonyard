'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { enviarMensajeAsesor, limpiarConversacion } from './actions'

type Mensaje = { rol: 'user' | 'assistant'; contenido: string; imagen?: string | null }

function leerArchivoComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(lector.result as string)
    lector.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    lector.readAsDataURL(archivo)
  })
}

export default function ChatAsesor({ mensajesIniciales }: { mensajesIniciales: Mensaje[] }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales)
  const [texto, setTexto] = useState('')
  const [imagen, setImagen] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [pendingLimpiar, startTransition] = useTransition()
  const finRef = useRef<HTMLDivElement>(null)
  const inputArchivoRef = useRef<HTMLInputElement>(null)
  const inputCamaraRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) {
      alert('Selecciona un archivo de imagen.')
      return
    }
    if (archivo.size > 8 * 1024 * 1024) {
      alert('La imagen es muy pesada (máximo 8 MB).')
      return
    }
    try {
      const dataUrl = await leerArchivoComoDataUrl(archivo)
      setImagen(dataUrl)
    } catch {
      alert('No se pudo cargar la imagen.')
    }
  }

  async function enviar() {
    const pregunta = texto.trim()
    if ((!pregunta && !imagen) || enviando) return
    const imagenAEnviar = imagen
    setTexto('')
    setImagen(null)
    setMensajes((prev) => [...prev, { rol: 'user', contenido: pregunta, imagen: imagenAEnviar }])
    setEnviando(true)
    try {
      const respuesta = await enviarMensajeAsesor(pregunta, imagenAEnviar)
      setMensajes((prev) => [...prev, { rol: 'assistant', contenido: respuesta }])
    } catch (e) {
      setMensajes((prev) => [
        ...prev,
        { rol: 'assistant', contenido: e instanceof Error ? e.message : 'Ocurrió un error.' },
      ])
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col rounded-xl border border-black/5 bg-white">
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-by-accent text-[12px] font-medium text-by-primary">
            🤖
          </div>
          <div>
            <p className="text-[13px] font-medium text-by-gray-dark">Tu Asesor</p>
            <p className="text-[10.5px] text-by-gray-light">
              Gerente SGI virtual · SQF / ISO 9001:2015
            </p>
          </div>
        </div>
        {mensajes.length > 0 && (
          <button
            disabled={pendingLimpiar}
            onClick={() => {
              if (!confirm('¿Borrar esta conversación?')) return
              startTransition(async () => {
                await limpiarConversacion()
                setMensajes([])
              })
            }}
            className="text-[11.5px] text-by-gray-light hover:underline disabled:opacity-50"
          >
            Nueva conversación
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {mensajes.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-[13px] text-by-gray-dark">
              Hola, soy Tu Asesor 👋
            </p>
            <p className="max-w-sm text-[12px] text-by-gray-light">
              Pregúntame sobre normas SQF/ISO 9001:2015, procedimientos internos,
              BPA, o cómo usar cualquier módulo del sistema. También puedes
              enviarme una foto (por ejemplo, un hallazgo o una etiqueta) para
              pedirme asesoría sobre ella.
            </p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {mensajes.map((m, i) => (
            <div
              key={i}
              className={'flex ' + (m.rol === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={
                  'max-w-[75%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[13px] ' +
                  (m.rol === 'user'
                    ? 'bg-by-primary text-white'
                    : 'bg-[#f4f6f6] text-by-gray-dark')
                }
              >
                {m.imagen && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.imagen}
                    alt="Foto adjunta"
                    className="mb-2 max-h-56 w-auto rounded-lg object-cover"
                  />
                )}
                {m.contenido}
              </div>
            </div>
          ))}
          {enviando && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-[#f4f6f6] px-3 py-2 text-[13px] text-by-gray-light">
                Escribiendo…
              </div>
            </div>
          )}
        </div>
        <div ref={finRef} />
      </div>

      <div className="border-t border-black/5 p-3">
        {imagen && (
          <div className="mb-2 flex items-center gap-2">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagen}
                alt="Vista previa"
                className="h-16 w-16 rounded-lg border border-black/10 object-cover"
              />
              <button
                onClick={() => setImagen(null)}
                aria-label="Quitar foto"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-by-gray-dark text-[11px] text-white shadow"
              >
                ×
              </button>
            </div>
            <p className="text-[11.5px] text-by-gray-light">Foto lista para enviar</p>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={inputArchivoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={manejarArchivo}
          />
          <input
            ref={inputCamaraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={manejarArchivo}
          />

          <button
            type="button"
            onClick={() => inputArchivoRef.current?.click()}
            disabled={enviando}
            title="Adjuntar foto"
            aria-label="Adjuntar foto"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-black/10 text-by-gray-light transition hover:bg-black/5 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => inputCamaraRef.current?.click()}
            disabled={enviando}
            title="Tomar foto"
            aria-label="Tomar foto"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-black/10 text-by-gray-light transition hover:bg-black/5 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </button>

          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                enviar()
              }
            }}
            placeholder={imagen ? 'Agrega un comentario (opcional)…' : 'Escribe tu pregunta…'}
            disabled={enviando}
            className="h-9 flex-1 rounded-md border border-black/10 px-3 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
          <button
            onClick={enviar}
            disabled={enviando || (!texto.trim() && !imagen)}
            className="h-9 rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
