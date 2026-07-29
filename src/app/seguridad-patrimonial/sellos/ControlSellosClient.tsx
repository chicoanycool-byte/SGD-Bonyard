'use client'

import { useState, useTransition } from 'react'
import {
  crearRecepcionSello, eliminarRecepcionSello,
  crearEntregaSello, eliminarEntregaSello,
  crearAnomaliaSello, eliminarAnomaliaSello,
} from './actions'

type Recepcion = {
  id: string; numero: number; fecha_recepcion: string; origen: string | null; cliente_proveedor: string | null
  sello_inicial: string | null; sello_final: string | null; cantidad: number | null; tipo_sello: string | null
  recibido_por: string | null; observaciones: string | null; firma: string | null
}
type Entrega = {
  id: string; numero: number; fecha_entrega: string; entregado_a: string | null; puesto: string | null
  sello_inicial: string | null; sello_final: string | null; cantidad: number | null; tipo_sello: string | null
  recibido_por: string | null; observaciones: string | null; firma: string | null
}
type Anomalia = {
  id: string; numero: number; fecha: string; sello_esperado: string | null; sello_suplantado: string | null
  unidad_placas: string | null; tipo_anomalia: string | null; accion_tomada: string | null
  notificado_a: string | null; responsable_registro: string | null; observaciones: string | null; firma: string | null
}

const TABS = [
  { id: 'recepcion', label: 'Recepción' },
  { id: 'entrega', label: 'Entrega' },
  { id: 'anomalias', label: 'Anomalías' },
] as const

export default function ControlSellosClient({
  recepcion,
  entrega,
  anomalias,
}: {
  recepcion: Recepcion[]
  entrega: Entrega[]
  anomalias: Anomalia[]
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('recepcion')
  const [pendiente, startTransition] = useTransition()
  const [mostrarForm, setMostrarForm] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Bitácora de Control de Sellos <span className="text-[11px] font-normal text-by-gray-light">(FSP-06)</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id)
                  setMostrarForm(false)
                }}
                className={
                  'rounded-md px-3 py-1.5 text-[12px] ' +
                  (tab === t.id ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <a
            href={`/seguridad-patrimonial/sellos/exportar/pdf?formato=${tab}`}
            target="_blank"
            className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary"
          >
            Descargar PDF
          </a>
          <button onClick={() => setMostrarForm(!mostrarForm)} className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white">
            {mostrarForm ? 'Cancelar' : 'Nuevo registro'}
          </button>
        </div>
      </div>

      {tab === 'recepcion' && (
        <>
          {mostrarForm && (
            <form
              action={(fd) =>
                startTransition(async () => {
                  await crearRecepcionSello(fd)
                  setMostrarForm(false)
                })
              }
              className="grid grid-cols-4 gap-2 rounded-xl border border-black/5 bg-white p-4"
            >
              <div>
                <label className="mb-1 block text-[10px] text-by-gray-light">Fecha de recepción</label>
                <input name="fecha_recepcion" type="date" className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
              </div>
              <select name="origen" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                <option value="" disabled>Origen…</option>
                <option value="Cliente">Cliente</option>
                <option value="Compra">Compra</option>
              </select>
              <input name="cliente_proveedor" placeholder="Cliente o proveedor" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="sello_inicial" placeholder="No. de sello (inicial)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="sello_final" placeholder="No. de sello (final)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="cantidad" type="number" placeholder="Cantidad" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <select name="tipo_sello" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                <option value="" disabled>Tipo de sello (norma)…</option>
                <option value="Cliente">Cliente</option>
                <option value="Compra">Compra</option>
                <option value="Botella">Botella</option>
                <option value="Cable">Cable</option>
              </select>
              <input name="recibido_por" placeholder="Recibido por" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="firma" placeholder="Firma" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="observaciones" placeholder="Observaciones" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <button disabled={pendiente} className="col-span-4 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
                {pendiente ? 'Guardando…' : 'Guardar recepción'}
              </button>
            </form>
          )}
          <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
            <table className="w-full text-left text-[11.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
                  <th className="px-2 py-2 font-normal">No.</th>
                  <th className="px-2 py-2 font-normal">Fecha</th>
                  <th className="px-2 py-2 font-normal">Origen</th>
                  <th className="px-2 py-2 font-normal">Cliente / Proveedor</th>
                  <th className="px-2 py-2 font-normal">Sello inicial</th>
                  <th className="px-2 py-2 font-normal">Sello final</th>
                  <th className="px-2 py-2 font-normal">Cant.</th>
                  <th className="px-2 py-2 font-normal">Tipo</th>
                  <th className="px-2 py-2 font-normal">Recibido por</th>
                  <th className="px-2 py-2 font-normal">Observaciones</th>
                  <th className="px-2 py-2 font-normal">Firma</th>
                  <th className="px-2 py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {recepcion.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 last:border-0">
                    <td className="px-2 py-1.5 text-by-gray-light">{r.numero}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{new Date(r.fecha_recepcion + 'T00:00:00').toLocaleDateString('es-MX')}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.origen ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-dark">{r.cliente_proveedor ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.sello_inicial ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.sello_final ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.cantidad ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.tipo_sello ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.recibido_por ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.observaciones ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.firma ?? '—'}</td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => startTransition(() => eliminarRecepcionSello(r.id))} className="text-[10.5px] text-red-500 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {recepcion.length === 0 && (
                  <tr><td colSpan={12} className="px-3 py-6 text-center text-[12px] text-by-gray-light">Sin registros de recepción.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'entrega' && (
        <>
          {mostrarForm && (
            <form
              action={(fd) =>
                startTransition(async () => {
                  await crearEntregaSello(fd)
                  setMostrarForm(false)
                })
              }
              className="grid grid-cols-4 gap-2 rounded-xl border border-black/5 bg-white p-4"
            >
              <div>
                <label className="mb-1 block text-[10px] text-by-gray-light">Fecha de entrega</label>
                <input name="fecha_entrega" type="date" className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
              </div>
              <input name="entregado_a" placeholder="A quien se entrega" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="puesto" placeholder="Puesto" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <select name="tipo_sello" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                <option value="" disabled>Tipo de sello (norma)…</option>
                <option value="Cliente">Cliente</option>
                <option value="Compra">Compra</option>
                <option value="Botella">Botella</option>
                <option value="Cable">Cable</option>
              </select>
              <input name="sello_inicial" placeholder="No. de sello (inicial)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="sello_final" placeholder="No. de sello (final)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="cantidad" type="number" placeholder="Cantidad" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="recibido_por" placeholder="Recibido por" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="firma" placeholder="Firma" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="observaciones" placeholder="Observaciones" className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <button disabled={pendiente} className="col-span-4 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
                {pendiente ? 'Guardando…' : 'Guardar entrega'}
              </button>
            </form>
          )}
          <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
            <table className="w-full text-left text-[11.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
                  <th className="px-2 py-2 font-normal">No.</th>
                  <th className="px-2 py-2 font-normal">Fecha</th>
                  <th className="px-2 py-2 font-normal">A quien se entrega</th>
                  <th className="px-2 py-2 font-normal">Puesto</th>
                  <th className="px-2 py-2 font-normal">Sello inicial</th>
                  <th className="px-2 py-2 font-normal">Sello final</th>
                  <th className="px-2 py-2 font-normal">Cant.</th>
                  <th className="px-2 py-2 font-normal">Tipo</th>
                  <th className="px-2 py-2 font-normal">Recibido por</th>
                  <th className="px-2 py-2 font-normal">Observaciones</th>
                  <th className="px-2 py-2 font-normal">Firma</th>
                  <th className="px-2 py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {entrega.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 last:border-0">
                    <td className="px-2 py-1.5 text-by-gray-light">{r.numero}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{new Date(r.fecha_entrega + 'T00:00:00').toLocaleDateString('es-MX')}</td>
                    <td className="px-2 py-1.5 text-by-gray-dark">{r.entregado_a ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.puesto ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.sello_inicial ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.sello_final ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.cantidad ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.tipo_sello ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.recibido_por ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.observaciones ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.firma ?? '—'}</td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => startTransition(() => eliminarEntregaSello(r.id))} className="text-[10.5px] text-red-500 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {entrega.length === 0 && (
                  <tr><td colSpan={12} className="px-3 py-6 text-center text-[12px] text-by-gray-light">Sin registros de entrega.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'anomalias' && (
        <>
          {mostrarForm && (
            <form
              action={(fd) =>
                startTransition(async () => {
                  await crearAnomaliaSello(fd)
                  setMostrarForm(false)
                })
              }
              className="grid grid-cols-4 gap-2 rounded-xl border border-black/5 bg-white p-4"
            >
              <div>
                <label className="mb-1 block text-[10px] text-by-gray-light">Fecha</label>
                <input name="fecha" type="date" className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
              </div>
              <input name="sello_esperado" placeholder="No. de sello esperado" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="sello_suplantado" placeholder="No. de sello suplantado" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="unidad_placas" placeholder="Unidad / Placas" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="tipo_anomalia" placeholder="Tipo de anomalía" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="accion_tomada" placeholder="Acción tomada" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="notificado_a" placeholder="Notificado a" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="responsable_registro" placeholder="Responsable del registro" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="firma" placeholder="Firma" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="observaciones" placeholder="Observaciones" className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <button disabled={pendiente} className="col-span-4 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
                {pendiente ? 'Guardando…' : 'Guardar anomalía'}
              </button>
            </form>
          )}
          <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
            <table className="w-full text-left text-[11.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
                  <th className="px-2 py-2 font-normal">No.</th>
                  <th className="px-2 py-2 font-normal">Fecha</th>
                  <th className="px-2 py-2 font-normal">Sello esperado</th>
                  <th className="px-2 py-2 font-normal">Sello suplantado</th>
                  <th className="px-2 py-2 font-normal">Unidad / Placas</th>
                  <th className="px-2 py-2 font-normal">Tipo de anomalía</th>
                  <th className="px-2 py-2 font-normal">Acción tomada</th>
                  <th className="px-2 py-2 font-normal">Notificado a</th>
                  <th className="px-2 py-2 font-normal">Responsable</th>
                  <th className="px-2 py-2 font-normal">Observaciones</th>
                  <th className="px-2 py-2 font-normal">Firma</th>
                  <th className="px-2 py-2 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {anomalias.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 last:border-0">
                    <td className="px-2 py-1.5 text-by-gray-light">{r.numero}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-MX')}</td>
                    <td className="px-2 py-1.5 text-by-gray-dark">{r.sello_esperado ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-dark">{r.sello_suplantado ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.unidad_placas ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.tipo_anomalia ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.accion_tomada ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.notificado_a ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.responsable_registro ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.observaciones ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{r.firma ?? '—'}</td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => startTransition(() => eliminarAnomaliaSello(r.id))} className="text-[10.5px] text-red-500 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {anomalias.length === 0 && (
                  <tr><td colSpan={12} className="px-3 py-6 text-center text-[12px] text-by-gray-light">Sin registros de anomalías.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
