'use client'

import { useActionState, useRef, useState } from 'react'
import { crearPNC, type EstadoPNC } from '../actions'
import { AvisoError, BotonPrincipal, Campo, FormaTarjeta, Seccion, inputCls, textareaCls } from '@/components/ui/forma'

const inicial: EstadoPNC = {}

export default function CapturarPncForm() {
  const [estado, formAction, pending] = useActionState(crearPNC, inicial)
  const [tipo, setTipo] = useState('')
  const [previewFoto, setPreviewFoto] = useState<string | null>(null)
  const inputFotoRef = useRef<HTMLInputElement>(null)

  const hoy = new Date().toLocaleDateString('es-MX')

  function onFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (archivo) {
      setPreviewFoto(URL.createObjectURL(archivo))
    } else {
      setPreviewFoto(null)
    }
  }

  return (
    <FormaTarjeta
      titulo="Reportar producto o equipo no conforme"
      intro="Usa esto cuando algo no cumple: producto dañado o fuera de especificación, o un equipo que falló. Ve en orden, el folio y la fecha se ponen solos."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="tipo" value={tipo} />

        <section className="rounded-xl border border-black/5 bg-[#fafbfb] p-4">
          <p className="mb-3 text-[14px] font-medium text-by-gray-dark">1. ¿Qué es lo que no está bien?</p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {([['producto', 'Un producto', 'Mercancía dañada, mal identificada o fuera de especificación'], ['equipo', 'Un equipo', 'Montacargas, báscula, andén u otro equipo que falló']] as const).map(([v, t, d]) => (
              <button
                type="button"
                key={v}
                onClick={() => setTipo(v)}
                className={'rounded-xl border-2 px-4 py-3 text-left ' + (tipo === v ? 'border-by-primary bg-by-primary/5' : 'border-black/10 hover:border-by-accent')}
              >
                <span className="block text-[14px] font-medium text-by-gray-dark">{t}</span>
                <span className="block text-[12.5px] text-by-gray">{d}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-by-gray">Folio: se asigna al guardar. Fecha de hoy: {hoy}.</p>
        </section>

        {tipo === 'producto' && (
          <>
            <Seccion numero={2} titulo="¿De qué producto se trata?" ayuda="Lo que alcances a llenar; solo cliente y nombre son obligatorios.">
              <Campo label="Cliente"><input name="cliente" required className={inputCls} /></Campo>
              <Campo label="Nombre del producto"><input name="nombre_producto" required className={inputCls} /></Campo>
              <Campo label="Código del producto" opcional><input name="codigo_producto" className={inputCls} /></Campo>
              <Campo label="Lote" opcional><input name="lote" className={inputCls} /></Campo>
              <Campo label="Proyecto" opcional><input name="proyecto" className={inputCls} /></Campo>
              <Campo label="¿Dónde está ahora?" opcional ayuda="Ubicación o rack donde quedó el producto."><input name="ubicacion" className={inputCls} /></Campo>
              <Campo label="Cantidad afectada" opcional><input name="cantidad" type="number" step="any" className={inputCls} /></Campo>
              <Campo label="Número de tarimas" opcional><input name="numero_tarimas" type="number" step="any" className={inputCls} /></Campo>
            </Seccion>
            <Seccion numero={3} titulo="¿Qué le pasó?" ayuda="Describe el problema y, si puedes, toma una foto.">
              <Campo ancho label="Describe lo que está mal"><textarea name="descripcion_nc" required rows={3} className={textareaCls} /></Campo>
              <Campo ancho label="Foto del daño" opcional>
                <input ref={inputFotoRef} name="foto" type="file" accept="image/*" capture="environment" onChange={onFotoChange} className="text-[13px]" />
                {previewFoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewFoto} alt="Vista previa" className="mt-2 h-32 w-32 rounded-lg object-cover" />
                )}
              </Campo>
            </Seccion>
          </>
        )}

        {tipo === 'equipo' && (
          <>
            <Seccion numero={2} titulo="¿Qué equipo es?" ayuda="Solo el tipo de equipo es obligatorio.">
              <Campo label="Equipo" ayuda="Ej. montacargas, báscula, andén."><input name="tipo_equipo" required className={inputCls} /></Campo>
              <Campo label="¿Dónde está?" opcional><input name="ubicacion_equipo" className={inputCls} /></Campo>
              <Campo label="Tipo de falla" opcional><input name="tipo_falla" className={inputCls} /></Campo>
              <Campo label="Proveedor del equipo" opcional><input name="nombre_proveedor" className={inputCls} /></Campo>
            </Seccion>
            <Seccion numero={3} titulo="¿Qué falló?" ayuda="Describe la falla y, si puedes, toma una foto.">
              <Campo ancho label="Describe la falla"><textarea name="descripcion_falla" required rows={3} className={textareaCls} /></Campo>
              <Campo ancho label="Foto" opcional>
                <input ref={inputFotoRef} name="foto" type="file" accept="image/*" capture="environment" onChange={onFotoChange} className="text-[13px]" />
                {previewFoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewFoto} alt="Vista previa" className="mt-2 h-32 w-32 rounded-lg object-cover" />
                )}
              </Campo>
            </Seccion>
          </>
        )}

        {estado.error && <AvisoError>{estado.error}</AvisoError>}

        {tipo && (
          <div>
            <BotonPrincipal pendiente={pending}>Guardar y avisar</BotonPrincipal>
            <p className="mt-1.5 text-[12px] text-by-gray">Al guardar se le avisa al responsable y queda en el registro de producto no conforme.</p>
          </div>
        )}
      </form>
    </FormaTarjeta>
  )
}
