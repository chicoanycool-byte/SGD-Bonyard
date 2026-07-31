'use client'

import { useEffect, useRef, useState } from 'react'

export default function FirmaCanvas({
  name,
  defaultValue,
  label,
}: {
  name: string
  defaultValue?: string | null
  label?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dibujando = useRef(false)
  const [hiddenValue, setHiddenValue] = useState(defaultValue ?? '')
  const [tieneTrazo, setTieneTrazo] = useState(!!defaultValue)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#14302B'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    if (defaultValue) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = defaultValue
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function posicion(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function iniciar(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    dibujando.current = true
    const { x, y } = posicion(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function trazar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = posicion(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setTieneTrazo(true)
  }

  function finalizar() {
    if (!dibujando.current) return
    dibujando.current = false
    const canvas = canvasRef.current
    if (canvas) setHiddenValue(canvas.toDataURL('image/png'))
  }

  function limpiar() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHiddenValue('')
    setTieneTrazo(false)
  }

  return (
    <div>
      {label && <label className="mb-1 block text-[10px] text-by-gray-light">{label}</label>}
      <input type="hidden" name={name} value={hiddenValue} />
      <div className="overflow-hidden rounded-md border border-black/10 bg-white">
        <canvas
          ref={canvasRef}
          width={260}
          height={70}
          onPointerDown={iniciar}
          onPointerMove={trazar}
          onPointerUp={finalizar}
          onPointerLeave={finalizar}
          className="h-[70px] w-full cursor-crosshair touch-none"
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[10px] text-by-gray-light">{tieneTrazo ? 'Firma capturada' : 'Firma aquí con el mouse o el dedo'}</span>
        <button type="button" onClick={limpiar} className="text-[10px] text-by-accent hover:underline">
          Limpiar
        </button>
      </div>
    </div>
  )
}
