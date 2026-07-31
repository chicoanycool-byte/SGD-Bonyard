'use client'

import { useState, useTransition } from 'react'
import {
  crearFilaVulnerabilidad, eliminarFilaVulnerabilidad, actualizarEncabezadoVulnerabilidad,
  crearAnalisisProductoFraude, eliminarAnalisisProductoFraude,
  crearMedidaMitigacion, eliminarMedidaMitigacion,
} from './actions'

type Vulnerabilidad = {
  id: string; nave: string; area: string; proceso: string; etapas_flujo: string | null
  dilucion: string | null; sustitucion: string | null; ocultamiento: string | null; mejoras_no_aprobadas: string | null
  mercado_negro: string | null; mal_etiquetado: string | null; falsificacion: string | null
  vulnerabilidad: number | null; severidad: number | null; probabilidad: number | null; sumatoria: number | null
  nivel_riesgo: string | null; medidas_control: string | null
}
type EncVuln = { nave: string; fecha_realizacion: string | null; fecha_actualizacion: string | null; participantes: string | null }
type ProductoFraude = {
  id: string; producto: string; proveedor: string | null; cliente: string | null; origen_materia_prima: string | null
  dilucion: string | null; sustitucion: string | null; ocultamiento: string | null; mejoras_no_aprobadas: string | null
  mercado_negro: string | null; mal_etiquetado: string | null; falsificacion: string | null
  costo_disponibilidad: number | null; pais_origen_distancia: number | null; proveedor_certificado: number | null
  identidad_preservada: number | null; severidad_fraude: number | null; nivel_riesgo: number | null; medida_control: string | null
}
type EncProductos = { fecha_realizacion: string | null; fecha_actualizacion: string | null; participantes: string | null } | null
type Mitigacion = { id: string; tipo_fraude: string; medida: string | null; responsable: string | null; frecuencia: string | null; accion_correctiva: string | null }
type EncMitigacion = { fecha_realizacion: string | null; fecha_actualizacion: string | null; firma_coordinador_sgi: string | null; firma_gerente_operaciones: string | null } | null

function nivelColor(nivel: number | string | null) {
  if (nivel == null) return 'bg-[#f4f6f6] text-by-gray-light'
  if (typeof nivel === 'string') {
    return nivel.toLowerCase().includes('insignif') ? 'bg-[#eaf5f0] text-[#3d6b53]' : 'bg-[#fdf3e3] text-[#9a6b1c]'
  }
  if (nivel >= 26) return 'bg-[#eaf5f0] text-[#3d6b53]'
  if (nivel >= 21) return 'bg-[#e6f0fa] text-[#2d5f8a]'
  if (nivel >= 12) return 'bg-[#fdf3e3] text-[#9a6b1c]'
  return 'bg-[#fdecea] text-[#a13c33]'
}

const FRAUDE_COLS = [
  { key: 'dilucion', label: 'Dilución' },
  { key: 'sustitucion', label: 'Sustitución' },
  { key: 'ocultamiento', label: 'Ocultamiento' },
  { key: 'mejoras_no_aprobadas', label: 'Mejoras no aprobadas' },
  { key: 'mercado_negro', label: 'Mercado negro' },
  { key: 'mal_etiquetado', label: 'Mal etiquetado' },
  { key: 'falsificacion', label: 'Falsificación' },
] as const

export default function FraudeAlimentarioClient({
  esCoordinador,
  vulnerabilidad,
  encabezadosVuln,
  productos,
  encabezadoProductos,
  mitigacion,
  encabezadoMitigacion,
}: {
  esCoordinador: boolean
  vulnerabilidad: Vulnerabilidad[]
  encabezadosVuln: EncVuln[]
  productos: ProductoFraude[]
  encabezadoProductos: EncProductos
  mitigacion: Mitigacion[]
  encabezadoMitigacion: EncMitigacion
}) {
  const [tab, setTab] = useState<'vulnerabilidad' | 'productos' | 'mitigacion'>('vulnerabilidad')
  const [pendiente, startTransition] = useTransition()
  const [nave, setNave] = useState('Nave 1')
  const [expandido, setExpandido] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)

  const vulnNave = vulnerabilidad.filter((v) => v.nave === nave)
  const encVuln = encabezadosVuln.find((e) => e.nave === nave) ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-by-gray-dark">Fraude Alimentario</p>
        <div className="flex gap-2">
          <button onClick={() => { setTab('vulnerabilidad'); setMostrarForm(false) }} className={'rounded-md px-3 py-1.5 text-[12px] ' + (tab === 'vulnerabilidad' ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')}>
            Vulnerabilidad de Procesos (FSG-33)
          </button>
          <button onClick={() => { setTab('productos'); setMostrarForm(false) }} className={'rounded-md px-3 py-1.5 text-[12px] ' + (tab === 'productos' ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')}>
            Análisis de Productos (FSG-32)
          </button>
          <button onClick={() => { setTab('mitigacion'); setMostrarForm(false) }} className={'rounded-md px-3 py-1.5 text-[12px] ' + (tab === 'mitigacion' ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')}>
            Plan de Mitigación (FSG-34)
          </button>
        </div>
      </div>

      {tab === 'vulnerabilidad' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              {['Nave 1', 'Nave 2'].map((n) => (
                <button key={n} onClick={() => setNave(n)} className={'rounded-md px-3 py-1.5 text-[12px] ' + (nave === n ? 'border border-by-accent bg-white text-by-accent' : 'bg-white text-by-gray-light')}>
                  {n}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <a href={`/inocuidad-alimentaria/fraude-alimentario/exportar/excel?tipo=vulnerabilidad&nave=${encodeURIComponent(nave)}`} className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">Excel</a>
              <a href={`/inocuidad-alimentaria/fraude-alimentario/exportar/pdf?tipo=vulnerabilidad&nave=${encodeURIComponent(nave)}`} target="_blank" className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">PDF</a>
            </div>
          </div>

          {esCoordinador && (
            <form action={(fd) => startTransition(() => actualizarEncabezadoVulnerabilidad(fd))} className="flex flex-wrap items-end gap-2 rounded-xl border border-black/5 bg-white p-3">
              <input type="hidden" name="nave" value={nave} />
              <div>
                <label className="mb-1 block text-[10px] text-by-gray-light">Fecha de realización</label>
                <input name="fecha_realizacion" type="date" defaultValue={encVuln?.fecha_realizacion ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-by-gray-light">Fecha de actualización</label>
                <input name="fecha_actualizacion" type="date" defaultValue={encVuln?.fecha_actualizacion ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[10px] text-by-gray-light">Participantes</label>
                <input name="participantes" defaultValue={encVuln?.participantes ?? ''} className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
              </div>
              <button disabled={pendiente} className="h-8 rounded-md border border-by-accent px-3 text-[12px] text-by-accent">Guardar</button>
            </form>
          )}
          {!esCoordinador && (
            <p className="text-[11px] text-by-gray-light">
              Realizado: {encVuln?.fecha_realizacion ? new Date(encVuln.fecha_realizacion).toLocaleDateString('es-MX') : '—'} · Próxima actualización: {encVuln?.fecha_actualizacion ? new Date(encVuln.fecha_actualizacion).toLocaleDateString('es-MX') : '—'} · Participantes: {encVuln?.participantes ?? '—'}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {vulnNave.map((v) => {
              const abierto = expandido === v.id
              return (
                <div key={v.id} className="overflow-hidden rounded-xl border border-black/5 bg-white">
                  <button onClick={() => setExpandido(abierto ? null : v.id)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left">
                    <div>
                      <span className="rounded-full bg-[#f0eafa] px-2 py-0.5 text-[10px] text-[#6b4fa0]">{v.area}</span>
                      <span className="ml-2 text-[13px] font-medium text-by-gray-dark">{v.proceso}</span>
                    </div>
                    <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + nivelColor(v.nivel_riesgo)}>
                      {v.nivel_riesgo} ({v.sumatoria})
                    </span>
                  </button>
                  {abierto && (
                    <div className="border-t border-black/5 p-4 text-[12px]">
                      <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Etapas del flujo</p>
                      <p className="mb-3 whitespace-pre-line text-by-gray-dark">{v.etapas_flujo}</p>
                      <div className="mb-3 grid grid-cols-4 gap-2">
                        {FRAUDE_COLS.map((c) => (
                          <div key={c.key} className="rounded-md bg-[#f9faf9] px-2 py-1.5">
                            <p className="text-[10px] text-by-gray-light">{c.label}</p>
                            <p className="text-[12.5px] font-medium text-by-gray-dark">{(v as unknown as Record<string, string | null>)[c.key] ?? '—'}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mb-3 grid grid-cols-4 gap-2">
                        <p><span className="text-by-gray-light">Vulnerabilidad: </span>{v.vulnerabilidad ?? '—'}</p>
                        <p><span className="text-by-gray-light">Severidad: </span>{v.severidad ?? '—'}</p>
                        <p><span className="text-by-gray-light">Probabilidad: </span>{v.probabilidad ?? '—'}</p>
                        <p><span className="text-by-gray-light">Sumatoria: </span>{v.sumatoria ?? '—'}</p>
                      </div>
                      <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Medidas de control</p>
                      <p className="whitespace-pre-line text-by-gray-dark">{v.medidas_control}</p>
                      {esCoordinador && (
                        <button onClick={() => startTransition(() => eliminarFilaVulnerabilidad(v.id))} className="mt-3 text-[11px] text-red-500 hover:underline">Eliminar</button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {esCoordinador && (
            <div className="rounded-xl border border-black/5 bg-white p-4">
              <button onClick={() => setMostrarForm(!mostrarForm)} className="text-[12px] text-by-accent hover:underline">
                {mostrarForm ? 'Cancelar' : '+ Agregar proceso'}
              </button>
              {mostrarForm && (
                <form action={(fd) => startTransition(async () => { await crearFilaVulnerabilidad(fd); setMostrarForm(false) })} className="mt-3 grid grid-cols-4 gap-2">
                  <input type="hidden" name="nave" value={nave} />
                  <input name="area" placeholder="Área (ej. ALMACEN)" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="proceso" placeholder="Proceso" required className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <textarea name="etapas_flujo" placeholder="Etapas del flujo" rows={2} className="col-span-4 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
                  {FRAUDE_COLS.map((c) => (
                    <select key={c.key} name={c.key} defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                      <option value="">{c.label}…</option>
                      <option value="X">X</option>
                      <option value="NA">NA</option>
                    </select>
                  ))}
                  <input name="vulnerabilidad" type="number" placeholder="Vulnerabilidad" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="severidad" type="number" placeholder="Severidad" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="probabilidad" type="number" placeholder="Probabilidad" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="sumatoria" type="number" placeholder="Sumatoria" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="nivel_riesgo" placeholder="Nivel de riesgo" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <textarea name="medidas_control" placeholder="Medidas de control" rows={2} className="col-span-4 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
                  <button disabled={pendiente} className="col-span-4 h-8 w-fit rounded-md bg-by-primary px-4 text-[12px] font-medium text-white disabled:opacity-50">Guardar</button>
                </form>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'productos' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-by-gray-light">
              Realizado: {encabezadoProductos?.fecha_realizacion ? new Date(encabezadoProductos.fecha_realizacion).toLocaleDateString('es-MX') : '—'} · Participantes: {encabezadoProductos?.participantes ?? '—'}
            </p>
            <div className="flex gap-2">
              <a href="/inocuidad-alimentaria/fraude-alimentario/exportar/excel?tipo=productos" className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">Excel</a>
              <a href="/inocuidad-alimentaria/fraude-alimentario/exportar/pdf?tipo=productos" target="_blank" className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">PDF</a>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
            <table className="w-full text-left text-[11.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[10px] uppercase text-by-gray-light">
                  <th className="px-2 py-2 font-normal">Producto</th>
                  <th className="px-2 py-2 font-normal">Proveedor</th>
                  <th className="px-2 py-2 font-normal">Origen</th>
                  <th className="px-2 py-2 font-normal">Severidad</th>
                  <th className="px-2 py-2 font-normal">Nivel de riesgo</th>
                  {esCoordinador && <th className="px-2 py-2 font-normal"></th>}
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 last:border-0">
                    <td className="px-2 py-1.5 text-by-gray-dark">{p.producto}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{p.proveedor ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{p.origen_materia_prima ?? '—'}</td>
                    <td className="px-2 py-1.5 text-by-gray-light">{p.severidad_fraude ?? '—'}</td>
                    <td className="px-2 py-1.5">
                      <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + nivelColor(p.nivel_riesgo)}>{p.nivel_riesgo ?? '—'}</span>
                    </td>
                    {esCoordinador && (
                      <td className="px-2 py-1.5">
                        <button onClick={() => startTransition(() => eliminarAnalisisProductoFraude(p.id))} className="text-[10.5px] text-red-500 hover:underline">Eliminar</button>
                      </td>
                    )}
                  </tr>
                ))}
                {productos.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-[12px] text-by-gray-light">Sin productos capturados.</td></tr>}
              </tbody>
            </table>
          </div>
          {esCoordinador && (
            <div className="rounded-xl border border-black/5 bg-white p-4">
              <button onClick={() => setMostrarForm(!mostrarForm)} className="text-[12px] text-by-accent hover:underline">
                {mostrarForm ? 'Cancelar' : '+ Agregar producto'}
              </button>
              {mostrarForm && (
                <form action={(fd) => startTransition(async () => { await crearAnalisisProductoFraude(fd); setMostrarForm(false) })} className="mt-3 grid grid-cols-4 gap-2">
                  <input name="producto" placeholder="Producto" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="proveedor" placeholder="Proveedor" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="cliente" placeholder="Cliente" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="origen_materia_prima" placeholder="Origen de la materia prima" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  {FRAUDE_COLS.map((c) => (
                    <select key={c.key} name={c.key} defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
                      <option value="">{c.label}…</option>
                      <option value="X">X</option>
                      <option value="NA">NA</option>
                    </select>
                  ))}
                  <input name="costo_disponibilidad" type="number" placeholder="Costo/Disponibilidad" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="pais_origen_distancia" type="number" placeholder="País de origen/distancia" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="proveedor_certificado" type="number" placeholder="Proveedor certificado" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="identidad_preservada" type="number" placeholder="Identidad preservada" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="severidad_fraude" type="number" placeholder="Severidad del fraude" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="nivel_riesgo" type="number" placeholder="Nivel de riesgo (suma)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <textarea name="medida_control" placeholder="Medida de control" rows={2} className="col-span-4 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
                  <button disabled={pendiente} className="col-span-4 h-8 w-fit rounded-md bg-by-primary px-4 text-[12px] font-medium text-white disabled:opacity-50">Guardar</button>
                </form>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'mitigacion' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-by-gray-light">
              Realizado: {encabezadoMitigacion?.fecha_realizacion ? new Date(encabezadoMitigacion.fecha_realizacion).toLocaleDateString('es-MX') : '—'} ·
              Coordinador del SGI: {encabezadoMitigacion?.firma_coordinador_sgi ?? '—'} · Gerente de Operaciones: {encabezadoMitigacion?.firma_gerente_operaciones ?? '—'}
            </p>
            <div className="flex gap-2">
              <a href="/inocuidad-alimentaria/fraude-alimentario/exportar/excel?tipo=mitigacion" className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">Excel</a>
              <a href="/inocuidad-alimentaria/fraude-alimentario/exportar/pdf?tipo=mitigacion" target="_blank" className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">PDF</a>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {mitigacion.map((m) => (
              <div key={m.id} className="rounded-xl border border-black/5 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-by-gray-dark">{m.tipo_fraude}</p>
                  {esCoordinador && (
                    <button onClick={() => startTransition(() => eliminarMedidaMitigacion(m.id))} className="text-[11px] text-red-500 hover:underline">Eliminar</button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 text-[12px]">
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Medida</p>
                    <p className="whitespace-pre-line text-by-gray-dark">{m.medida}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Responsable / Frecuencia</p>
                    <p className="text-by-gray-dark">{m.responsable}</p>
                    <p className="whitespace-pre-line text-by-gray-light">{m.frecuencia}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10.5px] uppercase text-by-gray-light">Acción correctiva</p>
                    <p className="whitespace-pre-line text-by-gray-dark">{m.accion_correctiva}</p>
                  </div>
                </div>
              </div>
            ))}
            {mitigacion.length === 0 && <p className="text-center text-[12px] text-by-gray-light">Sin medidas de mitigación capturadas.</p>}
          </div>
          {esCoordinador && (
            <div className="rounded-xl border border-black/5 bg-white p-4">
              <button onClick={() => setMostrarForm(!mostrarForm)} className="text-[12px] text-by-accent hover:underline">
                {mostrarForm ? 'Cancelar' : '+ Agregar medida'}
              </button>
              {mostrarForm && (
                <form action={(fd) => startTransition(async () => { await crearMedidaMitigacion(fd); setMostrarForm(false) })} className="mt-3 grid grid-cols-2 gap-2">
                  <input name="tipo_fraude" placeholder="Tipo de fraude" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <textarea name="medida" placeholder="Medida" rows={2} className="col-span-2 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
                  <input name="responsable" placeholder="Responsable" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <input name="frecuencia" placeholder="Frecuencia" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                  <textarea name="accion_correctiva" placeholder="Acción correctiva" rows={2} className="col-span-2 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
                  <button disabled={pendiente} className="col-span-2 h-8 w-fit rounded-md bg-by-primary px-4 text-[12px] font-medium text-white disabled:opacity-50">Guardar</button>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
