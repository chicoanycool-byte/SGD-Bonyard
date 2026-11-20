import type { ReactNode } from 'react'

// Estilos comunes de campos: más grandes y fáciles de tocar
export const inputCls =
  'h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-[14px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30 disabled:bg-gray-50'
export const textareaCls =
  'w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-[14px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

// Un bloque numerado del formulario: título claro + una línea que explica qué poner
export function Seccion({
  numero,
  titulo,
  ayuda,
  children,
}: {
  numero?: number
  titulo: string
  ayuda?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-black/5 bg-[#fafbfb] p-4">
      <div className="mb-3 flex items-start gap-3">
        {numero !== undefined && (
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-by-primary text-[12px] font-semibold text-white">
            {numero}
          </span>
        )}
        <div>
          <p className="text-[14px] font-medium text-by-gray-dark">{titulo}</p>
          {ayuda && <p className="text-[12.5px] text-by-gray">{ayuda}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
    </section>
  )
}

// Un campo: etiqueta en lenguaje normal, marca de obligatorio y ayuda debajo
export function Campo({
  label,
  ayuda,
  opcional,
  ancho,
  children,
}: {
  label: string
  ayuda?: string
  opcional?: boolean
  ancho?: boolean
  children: ReactNode
}) {
  return (
    <div className={ancho ? 'md:col-span-2' : ''}>
      <label className="mb-1 block text-[13px] font-medium text-by-gray-dark">
        {label}
        {opcional && <span className="ml-1 font-normal text-by-gray">(opcional)</span>}
      </label>
      {children}
      {ayuda && <p className="mt-1 text-[12px] text-by-gray">{ayuda}</p>}
    </div>
  )
}

export function AvisoOk({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{children}</div>
  )
}

export function AvisoError({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{children}</div>
}

export function BotonPrincipal({ pendiente, children, textoPendiente }: { pendiente?: boolean; children: ReactNode; textoPendiente?: string }) {
  return (
    <button
      type="submit"
      disabled={pendiente}
      className="h-10 rounded-lg bg-by-primary px-6 text-[14px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
    >
      {pendiente ? textoPendiente ?? 'Guardando…' : children}
    </button>
  )
}

// Tarjeta contenedora de un formulario, con una línea que explica para qué sirve
export function FormaTarjeta({ titulo, intro, children }: { titulo: string; intro?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-5">
      <p className="text-[15px] font-medium text-by-gray-dark">{titulo}</p>
      {intro && <p className="mb-4 mt-0.5 text-[12.5px] text-by-gray">{intro}</p>}
      {children}
    </div>
  )
}

// Frase de resumen con barra opcional, para la parte de arriba de las listas
export function ResumenFrase({
  frase,
  detalle,
  porcentaje,
  accion,
}: {
  frase: ReactNode
  detalle?: string
  porcentaje?: number
  accion?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-by-gray-dark">{frase}</p>
        {accion}
      </div>
      {porcentaje !== undefined && (
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={'h-full ' + (porcentaje >= 90 ? 'bg-emerald-500' : porcentaje >= 60 ? 'bg-amber-500' : 'bg-red-500')}
            style={{ width: porcentaje + '%' }}
          />
        </div>
      )}
      {detalle && <p className="mt-1.5 text-[12px] text-by-gray">{detalle}</p>}
    </div>
  )
}

export function EstadoVacio({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-black/15 bg-white px-4 py-8 text-center">
      <p className="text-[13.5px] font-medium text-by-gray-dark">{titulo}</p>
      {detalle && <p className="mt-1 text-[12.5px] text-by-gray">{detalle}</p>}
    </div>
  )
}
