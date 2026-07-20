'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { enviarMensajeAsesor, limpiarConversacion } from './actions'

type Mensaje = { rol: 'user' | 'assistant'; contenido: string }

export default function ChatAsesor({ mensajesIniciales }: { mensajesIniciales: Mensaje[] }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [pendingLimpiar, startTransition] = useTransition()
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar() {
    const pregunta = texto.trim()
    if (!pregunta || enviando) return
    setTexto('')
    setMensajes((prev) => [...prev, { rol: 'user', contenido: pregunta }])
    setEnviando(true)
    try {
      const respuesta = await enviarMensajeAsesor(pregunta)
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
              BPA, o cómo usar cualquier módulo del sistema.
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

      <div className="flex gap-2 border-t border-black/5 p-3">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              enviar()
            }
          }}
          placeholder="Escribe tu pregunta…"
          disabled={enviando}
          className="h-9 flex-1 rounded-md border border-black/10 px-3 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
        />
        <button
          onClick={enviar}
          disabled={enviando || !texto.trim()}
          className="h-9 rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
