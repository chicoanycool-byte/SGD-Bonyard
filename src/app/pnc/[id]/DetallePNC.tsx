'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarDisposicionPNC, editarPNC } from '../actions'

type Registro = {
  id: string
  folio: string | null
  tipo: string
  fecha: string
  cliente: string | null
  proyecto: string | null
  lote: string | null
  codigo_producto: string | null
  cantidad: number | null
  numero_tarimas: number | null
  nombre_producto: string | null
  descripcion_nc: string | null
  ubicacion: string | null
  tipo_equipo: string | null
  tipo_falla: string | null
  descripcion_falla: string | null
  ubicacion_equipo: string | null
  nombre_proveedor: string | null
  disposicion: string | null
  responsable_disposicion: string | null
  estatus: string
}

function Campo({ label, valor }: { label: string; valor: string | number | null }) {
  if (valor === null || valor === '') return null
  return (
    <div>
      <p className="text-by-gray-light">{label}</p>
      <p className="text-by-gray-dark">{valor}</p>
    </div>
  )
}

export default function DetallePNC({
  registro,
  fotoUrl,
  esCoordinador,
}: {
  registro: Registro
  fotoUrl: string | null
  esCoordinador: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [editando, setEditando] = useState(false)
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-medium text-by-gray-dark">
            [{registro.folio}] {registro.tipo === 'producto' ? 'PNC de Producto' : 'PNC de Equipo'}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={
                'rounded-full px-2.5 py-1 text-[11px] ' +
                (registro.estatus === 'cerrado'
                  ? 'bg-[#eaf5f0] text-[#3d6b53]'
                  : 'bg-[#fdecea] text-[#a13c33]')
              }
            >
              {registro.estatus === 'cerrado' ? 'Cerrado' : 'Abierto'}
            </span>
            {esCoordinador && (
              <button
                onClick={() => setEditando(!editando)}
                className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium text-by-gray-dark hover:bg-black/5"
              >
                {editando ? 'Cancelar' : 'Editar'}
              </button>
            )}
          </div>
        </div>

        {!editando ? (
          <div className="grid grid-cols-3 gap-3 text-[12.5px]">
            <Campo label="Fecha" valor={new Date(registro.fecha + 'T00:00:00').toLocaleDateString('es-MX')} />
            {registro.tipo === 'producto' ? (
              <>
                <Campo label="Cliente" valor={registro.cliente} />
                <Campo label="Proyecto" valor={registro.proyecto} />
                <Campo label="Lote" valor={registro.lote} />
                <Campo label="Código de producto" valor={registro.codigo_producto} />
                <Campo label="Cantidad" valor={registro.cantidad} />
                <Campo label="Número de tarimas" valor={registro.numero_tarimas} />
                <Campo label="Nombre del producto" valor={registro.nombre_producto} />
                <Campo label="Ubicación del PNC" valor={registro.ubicacion} />
                <div className="col-span-3">
                  <Campo label="Descripción de la no conformidad" valor={registro.descripcion_nc} />
                </div>
              </>
            ) : (
              <>
                <Campo label="Tipo de equipo" valor={registro.tipo_equipo} />
                <Campo label="Tipo de falla" valor={registro.tipo_falla} />
                <Campo label="Ubicación del equipo" valor={registro.ubicacion_equipo} />
                <Campo label="Nombre del proveedor" valor={registro.nombre_proveedor} />
                <div className="col-span-3">
                  <Campo label="Descripción de la falla" valor={registro.descripcion_falla} />
                </div>
              </>
            )}
          </div>
        ) : (
          <FormularioEdicion registro={registro} onGuardado={() => setEditando(false)} />
        )}

        {fotoUrl && (
          <div className="mt-3">
            <p className="mb-1 text-[11px] text-by-gray-light">Foto del daño</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoUrl} alt="Evidencia del PNC" className="h-48 w-48 rounded-md object-cover" />
          </div>
        )}
      </div>

      {esCoordinador && (
        <form
          action={(fd) =>
            startTransition(async () => {
              await actualizarDisposicionPNC(registro.id, fd)
              router.refresh()
            })
          }
          className="rounded-xl border border-black/5 bg-white p-4"
        >
          <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
            Disposición del Coordinador SGI
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] text-by-gray-dark">
                {registro.tipo === 'producto'
                  ? 'Disposición del PNC acordada por el cliente'
                  : 'Disposición final del equipo'}
              </label>
              <textarea
                name="disposicion"
                defaultValue={registro.disposicion ?? ''}
                rows={2}
                className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">
                Responsable de la disposición
              </label>
              <input
                name="responsable_disposicion"
                defaultValue={registro.responsable_disposicion ?? ''}
                className="h-9 w-full rounded-md border border-black/10 px-2.5 text-[13px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">Estatus</label>
              <select
                name="estatus"
                defaultValue={registro.estatus}
                className="h-9 w-full rounded-md border border-black/10 px-2.5 text-[13px]"
              >
                <option value="abierto">Abierto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-3 h-9 w-fit rounded-md bg-by-primary px-5 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
          >
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      )}
    </div>
  )
}

function FormularioEdicion({ registro, onGuardado }: { registro: Registro; onGuardado: () => void }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [campos, setCampos] = useState<Record<string, string>>({
    cliente: registro.cliente ?? '',
    proyecto: registro.proyecto ?? '',
    lote: registro.lote ?? '',
    codigo_producto: registro.codigo_producto ?? '',
    nombre_producto: registro.nombre_producto ?? '',
    descripcion_nc: registro.descripcion_nc ?? '',
    ubicacion: registro.ubicacion ?? '',
    tipo_equipo: registro.tipo_equipo ?? '',
    tipo_falla: registro.tipo_falla ?? '',
    descripcion_falla: registro.descripcion_falla ?? '',
    ubicacion_equipo: registro.ubicacion_equipo ?? '',
    nombre_proveedor: registro.nombre_proveedor ?? '',
  })

  const inputCls = 'h-8 w-full rounded-md border border-black/10 px-2.5 text-[12.5px]'

  const campo = (nombre: string, label: string) => (
    <div>
      <label className="mb-1 block text-[11px] text-by-gray-dark">{label}</label>
      <input
        value={campos[nombre]}
        onChange={(e) => setCampos({ ...campos, [nombre]: e.target.value })}
        className={inputCls}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {registro.tipo === 'producto' ? (
          <>
            {campo('cliente', 'Cliente')}
            {campo('proyecto', 'Proyecto')}
            {campo('lote', 'Lote')}
            {campo('codigo_producto', 'Código de producto')}
            {campo('nombre_producto', 'Nombre del producto')}
            {campo('ubicacion', 'Ubicación del PNC')}
            <div className="col-span-3">
              <label className="mb-1 block text-[11px] text-by-gray-dark">Descripción de la no conformidad</label>
              <textarea
                value={campos.descripcion_nc}
                onChange={(e) => setCampos({ ...campos, descripcion_nc: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[12.5px]"
              />
            </div>
          </>
        ) : (
          <>
            {campo('tipo_equipo', 'Tipo de equipo')}
            {campo('tipo_falla', 'Tipo de falla')}
            {campo('ubicacion_equipo', 'Ubicación del equipo')}
            {campo('nombre_proveedor', 'Nombre del proveedor')}
            <div className="col-span-3">
              <label className="mb-1 block text-[11px] text-by-gray-dark">Descripción de la falla</label>
              <textarea
                value={campos.descripcion_falla}
                onChange={(e) => setCampos({ ...campos, descripcion_falla: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[12.5px]"
              />
            </div>
          </>
        )}
      </div>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await editarPNC(registro.id, campos)
            onGuardado()
            router.refresh()
          })
        }
        className="h-8 w-fit rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-60"
      >
        Guardar cambios
      </button>
    </div>
  )
}
