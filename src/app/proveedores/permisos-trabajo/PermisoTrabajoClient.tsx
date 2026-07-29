'use client'

import { Fragment, useState, useTransition } from 'react'
import { crearPermisoTrabajo, actualizarEstatusPermiso, cerrarConVoBo, eliminarPermisoTrabajo } from './actions'

type Vehiculo = { marca: string; modelo: string; placas: string }
type Persona = { nombre: string; nss: string }
type Protocolo = { protocolo: string; seleccionado: boolean; descripcion: string }

type Permiso = {
  id: string
  folio: string | null
  estatus: string
  nombre_empresa: string
  razon_social: string | null
  fecha: string
  vigencia: string | null
  tipo_ingreso: string | null
  identificacion: string | null
  epp_casco: boolean
  epp_chaleco: boolean
  epp_botas: boolean
  vehiculos: Vehiculo[]
  personal: Persona[]
  tipo_mantenimiento: string | null
  solicitante_bonyard: string | null
  descripcion_trabajo: string | null
  hojas_seguridad_anexas: string | null
  herramientas_equipo: string | null
  emisiones_aire: boolean | null
  emisiones_aire_detalle: string | null
  descargas_agua: boolean | null
  descargas_agua_detalle: string | null
  trabajo_alturas: boolean | null
  trabajo_alturas_detalle: string | null
  trabajos_confinados: boolean | null
  trabajos_confinados_detalle: string | null
  soldadura_calor: boolean | null
  soldadura_calor_detalle: string | null
  generacion_desperdicios: boolean | null
  desperdicios_detalle: string | null
  desperdicio_reciclable: boolean | null
  reciclable_detalle: string | null
  consume_energia: boolean | null
  energia_tipo: string | null
  energia_detalle: string | null
  protocolos: Protocolo[]
  comentarios_adicionales: string | null
  firma_solicitante: string | null
  firma_seguridad_patrimonial: string | null
  firma_contratista: string | null
  firma_coordinador_sgi: string | null
  firma_solicitante_vobo: string | null
}

const PROTOCOLOS_BASE: Protocolo[] = [
  { protocolo: 'Barreras físicas', seleccionado: false, descripcion: 'Colocar barreras físicas como plástico, tabla roca, distancias entre los productos y las actividades a realizar' },
  { protocolo: 'Acordonamiento', seleccionado: false, descripcion: 'Acordonamiento de las áreas de trabajo' },
  { protocolo: 'Limpiezas periódicas', seleccionado: false, descripcion: 'Realizar limpiezas periódicas con sustancias de grado alimenticio' },
  { protocolo: 'Fumigaciones', seleccionado: false, descripcion: 'Realizar fumigaciones' },
  { protocolo: 'Ventilación especial', seleccionado: false, descripcion: 'Implementar ventilación especial para crear flujos de aire que protejan al producto almacenado' },
  { protocolo: 'Retirar producto', seleccionado: false, descripcion: 'Retirar producto de las instalaciones' },
  { protocolo: 'Otros', seleccionado: false, descripcion: '' },
]

const RIESGO_PREGUNTAS: { campo: keyof Permiso; detalle: keyof Permiso; pregunta: string; ayuda: string }[] = [
  { campo: 'emisiones_aire', detalle: 'emisiones_aire_detalle', pregunta: '¿El trabajo producirá o causará la fuga de cualquier emisión al aire?', ayuda: 'Liste las emisiones y los métodos para prevenir la repercusión al medio ambiente.' },
  { campo: 'descargas_agua', detalle: 'descargas_agua_detalle', pregunta: '¿El trabajo producirá o causará la descarga de cualquier agua residual?', ayuda: '¿Cómo será tratada el agua residual? Indique contenido de la descarga.' },
  { campo: 'trabajo_alturas', detalle: 'trabajo_alturas_detalle', pregunta: '¿El trabajo implica trabajos en alturas superiores a 1.50 m?', ayuda: 'Indique el equipo de protección a utilizar y anexe evidencia de capacitación.' },
  { campo: 'trabajos_confinados', detalle: 'trabajos_confinados_detalle', pregunta: '¿El trabajo implica trabajos en áreas confinadas?', ayuda: 'Indique el equipo de protección a utilizar y anexe evidencia de capacitación.' },
  { campo: 'soldadura_calor', detalle: 'soldadura_calor_detalle', pregunta: '¿El trabajo generará chispas, fuego o calor (soldadura, cortes, desbastes)?', ayuda: 'Liste las fuentes de chispas/fuego/calor y los medios preventivos y correctivos.' },
  { campo: 'generacion_desperdicios', detalle: 'desperdicios_detalle', pregunta: '¿El trabajo traerá como resultado algún desperdicio?', ayuda: 'Liste los desperdicios y cómo serán manejados.' },
  { campo: 'desperdicio_reciclable', detalle: 'reciclable_detalle', pregunta: '¿Algún desperdicio generado será reciclable?', ayuda: 'Liste los desperdicios reciclables y dónde/cómo serán reciclados.' },
]

const ESTATUS_STYLE: Record<string, string> = {
  vigente: 'bg-[#eaf5f0] text-[#3d6b53]',
  cerrado: 'bg-[#f1efe8] text-[#5f5e5a]',
  cancelado: 'bg-[#fdecea] text-[#a13c33]',
}

function SiNo({ nombre, defaultValue }: { nombre: string; defaultValue?: boolean | null }) {
  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-1 text-[12px]">
        <input type="radio" name={nombre} value="si" defaultChecked={defaultValue === true} /> Sí
      </label>
      <label className="flex items-center gap-1 text-[12px]">
        <input type="radio" name={nombre} value="no" defaultChecked={defaultValue === false || defaultValue === undefined} /> No
      </label>
    </div>
  )
}

export default function PermisoTrabajoClient({ permisos }: { permisos: Permiso[] }) {
  const [pendiente, startTransition] = useTransition()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [cerrandoId, setCerrandoId] = useState<string | null>(null)

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([{ marca: '', modelo: '', placas: '' }])
  const [personal, setPersonal] = useState<Persona[]>([{ nombre: '', nss: '' }])
  const [protocolos, setProtocolos] = useState<Protocolo[]>(PROTOCOLOS_BASE)

  function resetForm() {
    setVehiculos([{ marca: '', modelo: '', placas: '' }])
    setPersonal([{ nombre: '', nss: '' }])
    setProtocolos(PROTOCOLOS_BASE)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Permiso de Trabajo <span className="text-[11px] font-normal text-by-gray-light">(FSG-25)</span>
        </p>
        <div className="flex items-center gap-2">
          <a href="/proveedores/permisos-trabajo/exportar/excel" className="h-8 rounded-md border border-by-primary px-3 text-[12px] font-medium leading-8 text-by-primary">
            Exportar Excel
          </a>
          <button
            onClick={() => {
              setMostrarForm(!mostrarForm)
              if (!mostrarForm) resetForm()
            }}
            className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white"
          >
            {mostrarForm ? 'Cancelar' : 'Nuevo permiso'}
          </button>
        </div>
      </div>

      {mostrarForm && (
        <form
          action={(fd) => {
            fd.set('vehiculos_json', JSON.stringify(vehiculos.filter((v) => v.marca || v.modelo || v.placas)))
            fd.set('personal_json', JSON.stringify(personal.filter((p) => p.nombre || p.nss)))
            fd.set('protocolos_json', JSON.stringify(protocolos.filter((p) => p.seleccionado)))
            startTransition(async () => {
              await crearPermisoTrabajo(fd)
              setMostrarForm(false)
            })
          }}
          className="flex flex-col gap-5 rounded-xl border border-black/5 bg-white p-4"
        >
          {/* Datos de proveedor */}
          <div>
            <p className="mb-2 rounded bg-[#14302B] px-2 py-1 text-[11px] font-medium uppercase text-white">Datos de proveedor</p>
            <div className="grid grid-cols-4 gap-2">
              <input name="nombre_empresa" placeholder="Nombre empresa" required className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="razon_social" placeholder="Razón social" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <div>
                <label className="mb-1 block text-[10px] text-by-gray-light">Fecha</label>
                <input name="fecha" type="date" className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-by-gray-light">Vigencia</label>
                <input name="vigencia" type="date" className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
              </div>
              <div className="col-span-2 flex items-end gap-4">
                <div>
                  <p className="mb-1 text-[10px] text-by-gray-light">Tipo de ingreso</p>
                  <label className="mr-3 text-[12px]"><input type="radio" name="tipo_ingreso" value="caminando" defaultChecked /> Caminando</label>
                  <label className="text-[12px]"><input type="radio" name="tipo_ingreso" value="vehiculo" /> Vehículo</label>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] text-by-gray-light">Se identifica con</p>
                <label className="mr-3 text-[12px]"><input type="radio" name="identificacion" value="INE" defaultChecked /> INE</label>
                <label className="text-[12px]"><input type="radio" name="identificacion" value="Licencia" /> Licencia</label>
              </div>
              <div>
                <p className="mb-1 text-[10px] text-by-gray-light">EPP</p>
                <label className="mr-2 text-[12px]"><input type="checkbox" name="epp_casco" /> Casco</label>
                <label className="mr-2 text-[12px]"><input type="checkbox" name="epp_chaleco" /> Chaleco</label>
                <label className="text-[12px]"><input type="checkbox" name="epp_botas" /> Botas</label>
              </div>
            </div>
          </div>

          {/* Datos del vehículo */}
          <div>
            <p className="mb-2 rounded bg-[#14302B] px-2 py-1 text-[11px] font-medium uppercase text-white">Datos del vehículo a ingresar</p>
            {vehiculos.map((v, idx) => (
              <div key={idx} className="mb-1.5 grid grid-cols-4 gap-2">
                <input placeholder="Marca" value={v.marca} onChange={(e) => setVehiculos(vehiculos.map((x, i) => (i === idx ? { ...x, marca: e.target.value } : x)))} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                <input placeholder="Modelo" value={v.modelo} onChange={(e) => setVehiculos(vehiculos.map((x, i) => (i === idx ? { ...x, modelo: e.target.value } : x)))} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                <input placeholder="Placas" value={v.placas} onChange={(e) => setVehiculos(vehiculos.map((x, i) => (i === idx ? { ...x, placas: e.target.value } : x)))} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                {vehiculos.length > 1 && (
                  <button type="button" onClick={() => setVehiculos(vehiculos.filter((_, i) => i !== idx))} className="text-[11px] text-red-500">Quitar</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setVehiculos([...vehiculos, { marca: '', modelo: '', placas: '' }])} className="text-[11px] text-by-accent hover:underline">
              + Agregar vehículo
            </button>
          </div>

          {/* Datos de personal */}
          <div>
            <p className="mb-2 rounded bg-[#14302B] px-2 py-1 text-[11px] font-medium uppercase text-white">Datos de personal a ingresar</p>
            {personal.map((p, idx) => (
              <div key={idx} className="mb-1.5 grid grid-cols-4 gap-2">
                <input placeholder="Nombre completo" value={p.nombre} onChange={(e) => setPersonal(personal.map((x, i) => (i === idx ? { ...x, nombre: e.target.value } : x)))} className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                <input placeholder="NSS" value={p.nss} onChange={(e) => setPersonal(personal.map((x, i) => (i === idx ? { ...x, nss: e.target.value } : x)))} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                {personal.length > 1 && (
                  <button type="button" onClick={() => setPersonal(personal.filter((_, i) => i !== idx))} className="text-[11px] text-red-500">Quitar</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setPersonal([...personal, { nombre: '', nss: '' }])} className="text-[11px] text-by-accent hover:underline">
              + Agregar persona
            </button>
          </div>

          {/* Datos del mantenimiento */}
          <div>
            <p className="mb-2 rounded bg-[#14302B] px-2 py-1 text-[11px] font-medium uppercase text-white">Datos del mantenimiento</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 flex items-center gap-4">
                <span className="text-[11px] text-by-gray-light">Tipo de mantenimiento:</span>
                <label className="text-[12px]"><input type="radio" name="tipo_mantenimiento" value="correctivo" defaultChecked /> Correctivo</label>
                <label className="text-[12px]"><input type="radio" name="tipo_mantenimiento" value="preventivo" /> Preventivo</label>
                <label className="text-[12px]"><input type="radio" name="tipo_mantenimiento" value="nuevo" /> Nuevo</label>
              </div>
              <input name="solicitante_bonyard" placeholder="Solicitante Bonyard" className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <textarea name="descripcion_trabajo" placeholder="Descripción del trabajo a realizar" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
              <input name="hojas_seguridad_anexas" placeholder="Hojas de seguridad anexas (si aplica sustancias químicas)" className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <textarea name="herramientas_equipo" placeholder="Herramientas y equipo de trabajo" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            </div>
          </div>

          {/* Evaluación de riesgos */}
          <div>
            <p className="mb-2 rounded bg-[#14302B] px-2 py-1 text-[11px] font-medium uppercase text-white">Evaluación de riesgos ambientales / seguridad</p>
            <div className="flex flex-col gap-3">
              {RIESGO_PREGUNTAS.map((r) => (
                <div key={String(r.campo)} className="rounded-md bg-[#f9faf9] p-2">
                  <p className="mb-1 text-[12px] text-by-gray-dark">{r.pregunta}</p>
                  <SiNo nombre={String(r.campo)} />
                  <input name={String(r.detalle)} placeholder={r.ayuda} className="mt-1.5 h-8 w-full rounded-md border border-black/10 px-2 text-[11.5px]" />
                </div>
              ))}
              <div className="rounded-md bg-[#f9faf9] p-2">
                <p className="mb-1 text-[12px] text-by-gray-dark">¿El trabajo consumirá energía (electricidad, aire comprimido, gas natural, vapor, etc.)?</p>
                <SiNo nombre="consume_energia" />
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <input name="energia_tipo" placeholder="Tipo de energía" className="h-8 rounded-md border border-black/10 px-2 text-[11.5px]" />
                  <input name="energia_detalle" placeholder="Cómo se consumirá / cómo se minimizará" className="h-8 rounded-md border border-black/10 px-2 text-[11.5px]" />
                </div>
              </div>
            </div>
          </div>

          {/* Protocolos contaminación cruzada */}
          <div>
            <p className="mb-2 rounded bg-[#14302B] px-2 py-1 text-[11px] font-medium uppercase text-white">
              Protocolos para evitar la contaminación cruzada durante mantenimientos o reparaciones temporales
            </p>
            <div className="flex flex-col gap-1.5">
              {protocolos.map((p, idx) => (
                <label key={p.protocolo} className="flex items-start gap-2 text-[12px] text-by-gray-dark">
                  <input
                    type="checkbox"
                    checked={p.seleccionado}
                    onChange={(e) => setProtocolos(protocolos.map((x, i) => (i === idx ? { ...x, seleccionado: e.target.checked } : x)))}
                    className="mt-0.5 h-3.5 w-3.5"
                  />
                  <span>
                    <strong>{p.protocolo}</strong>
                    {p.protocolo === 'Otros' ? (
                      <input
                        placeholder="Especifica"
                        value={p.descripcion}
                        onChange={(e) => setProtocolos(protocolos.map((x, i) => (i === idx ? { ...x, descripcion: e.target.value } : x)))}
                        className="ml-2 h-7 w-64 rounded-md border border-black/10 px-1.5 text-[11.5px]"
                      />
                    ) : (
                      <span className="text-by-gray-light"> — {p.descripcion}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <textarea name="comentarios_adicionales" placeholder="Comentarios adicionales" rows={2} className="rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />

          {/* Firmas */}
          <div>
            <p className="mb-2 rounded bg-[#14302B] px-2 py-1 text-[11px] font-medium uppercase text-white">Firmas</p>
            <div className="grid grid-cols-2 gap-2">
              <input name="firma_solicitante" placeholder="Nombre y firma SOLICITANTE" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="firma_seguridad_patrimonial" placeholder="Nombre y firma SEGURIDAD PATRIMONIAL" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="firma_contratista" placeholder="Nombre y firma CONTRATISTA" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
              <input name="firma_coordinador_sgi" placeholder="Nombre y firma COORDINADOR DEL SGI" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            </div>
          </div>

          <button disabled={pendiente} className="h-9 w-fit rounded-md bg-by-primary px-5 text-[13px] font-medium text-white disabled:opacity-50">
            {pendiente ? 'Guardando…' : 'Guardar permiso'}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Folio</th>
              <th className="px-3 py-2 font-normal">Empresa</th>
              <th className="px-3 py-2 font-normal">Fecha</th>
              <th className="px-3 py-2 font-normal">Tipo mantenimiento</th>
              <th className="px-3 py-2 font-normal">Estatus</th>
              <th className="px-3 py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {permisos.map((p) => {
              const abierto = expandido === p.id
              return (
                <Fragment key={p.id}>
                  <tr className="border-b border-black/5 last:border-0">
                    <td className="px-3 py-2 text-by-gray-light">{p.folio}</td>
                    <td className="px-3 py-2 text-by-gray-dark">
                      <button onClick={() => setExpandido(abierto ? null : p.id)} className="hover:underline">
                        {p.nombre_empresa}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-by-gray-light">{new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-MX')}</td>
                    <td className="px-3 py-2 text-by-gray-light capitalize">{p.tipo_mantenimiento ?? '—'}</td>
                    <td className="px-3 py-2">
                      <select
                        defaultValue={p.estatus}
                        onChange={(e) => startTransition(() => actualizarEstatusPermiso(p.id, e.target.value))}
                        className={'h-7 rounded-full border-0 px-2 text-[11px] ' + (ESTATUS_STYLE[p.estatus] ?? '')}
                      >
                        <option value="vigente">Vigente</option>
                        <option value="cerrado">Cerrado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <a href={`/proveedores/permisos-trabajo/exportar/pdf?id=${p.id}`} target="_blank" className="text-[11px] text-by-accent hover:underline">
                          PDF
                        </a>
                        <button
                          onClick={() => startTransition(() => eliminarPermisoTrabajo(p.id))}
                          disabled={pendiente}
                          className="text-[11px] text-red-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {abierto && (
                    <tr className="border-b border-black/5 bg-[#fafbfa]">
                      <td colSpan={6} className="px-4 py-3 text-[11.5px]">
                        <div className="grid grid-cols-2 gap-3">
                          <p><span className="text-by-gray-light">Razón social: </span>{p.razon_social ?? '—'}</p>
                          <p><span className="text-by-gray-light">Vigencia: </span>{p.vigencia ? new Date(p.vigencia + 'T00:00:00').toLocaleDateString('es-MX') : '—'}</p>
                          <p><span className="text-by-gray-light">Ingreso: </span>{p.tipo_ingreso ?? '—'} · <span className="text-by-gray-light">ID: </span>{p.identificacion ?? '—'}</p>
                          <p><span className="text-by-gray-light">EPP: </span>{[p.epp_casco && 'Casco', p.epp_chaleco && 'Chaleco', p.epp_botas && 'Botas'].filter(Boolean).join(', ') || '—'}</p>
                          <p className="col-span-2"><span className="text-by-gray-light">Solicitante Bonyard: </span>{p.solicitante_bonyard ?? '—'}</p>
                          <p className="col-span-2"><span className="text-by-gray-light">Descripción: </span>{p.descripcion_trabajo ?? '—'}</p>
                          {p.vehiculos.length > 0 && (
                            <p className="col-span-2"><span className="text-by-gray-light">Vehículos: </span>{p.vehiculos.map((v) => `${v.marca} ${v.modelo} (${v.placas})`).join(' · ')}</p>
                          )}
                          {p.personal.length > 0 && (
                            <p className="col-span-2"><span className="text-by-gray-light">Personal: </span>{p.personal.map((x) => `${x.nombre} (${x.nss})`).join(' · ')}</p>
                          )}
                          {p.protocolos.length > 0 && (
                            <p className="col-span-2"><span className="text-by-gray-light">Protocolos: </span>{p.protocolos.map((x) => x.protocolo).join(', ')}</p>
                          )}
                          {p.comentarios_adicionales && (
                            <p className="col-span-2"><span className="text-by-gray-light">Comentarios: </span>{p.comentarios_adicionales}</p>
                          )}
                        </div>

                        {p.estatus !== 'cerrado' && (
                          <div className="mt-3 border-t border-black/5 pt-3">
                            {cerrandoId === p.id ? (
                              <form
                                action={(fd) =>
                                  startTransition(async () => {
                                    await cerrarConVoBo(fd)
                                    setCerrandoId(null)
                                  })
                                }
                                className="flex items-center gap-2"
                              >
                                <input type="hidden" name="id" value={p.id} />
                                <input name="firma_solicitante_vobo" placeholder="Nombre y firma SOLICITANTE — Vo.Bo. al término de los trabajos" className="h-7 w-96 rounded-md border border-black/10 px-2 text-[11px]" />
                                <button className="text-[11px] text-by-accent hover:underline">Guardar y cerrar</button>
                              </form>
                            ) : (
                              <button onClick={() => setCerrandoId(p.id)} className="text-[11px] text-by-accent hover:underline">
                                Dar Vo.Bo. al término de los trabajos y cerrar
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
            {permisos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin permisos de trabajo registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
