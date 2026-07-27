'use client'

import { useTransition } from 'react'
import { crearPermisoTrabajo, actualizarEstatusPermiso, eliminarPermisoTrabajo } from './actions'

type Permiso = {
  id: string
  folio: string | null
  contratista_nombre: string
  tipo_trabajo: string
  area: string | null
  fecha_inicio: string
  fecha_fin: string | null
  medidas_seguridad: string | null
  epp_requerido: string | null
  estatus: string
  autoriza_nombre: string | null
}
type Proveedor = { id: string; nombre: string }

const ESTATUS_STYLE: Record<string, string> = {
  vigente: 'bg-[#eaf5f0] text-[#3d6b53]',
  cerrado: 'bg-[#f1efe8] text-[#5f5e5a]',
  cancelado: 'bg-[#fdecea] text-[#a13c33]',
}

export default function PermisosTrabajoClient({
  puedeGestionar,
  permisos,
  proveedores,
}: {
  puedeGestionar: boolean
  permisos: Permiso[]
  proveedores: Proveedor[]
}) {
  const [pendiente, startTransition] = useTransition()

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Permiso de trabajo (contratistas)</p>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Folio</th>
              <th className="px-3 py-2 font-normal">Contratista</th>
              <th className="px-3 py-2 font-normal">Trabajo</th>
              <th className="px-3 py-2 font-normal">Área</th>
              <th className="px-3 py-2 font-normal">Vigencia</th>
              <th className="px-3 py-2 font-normal">Autorizó</th>
              <th className="px-3 py-2 font-normal">Estatus</th>
              {puedeGestionar && <th className="px-3 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {permisos.map((p) => (
              <tr key={p.id} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-2 text-by-gray-light">{p.folio}</td>
                <td className="px-3 py-2 text-by-gray-dark">{p.contratista_nombre}</td>
                <td className="px-3 py-2 text-by-gray-light">{p.tipo_trabajo}</td>
                <td className="px-3 py-2 text-by-gray-light">{p.area ?? '—'}</td>
                <td className="px-3 py-2 text-by-gray-light">
                  {new Date(p.fecha_inicio).toLocaleDateString('es-MX')}
                  {p.fecha_fin ? ` – ${new Date(p.fecha_fin).toLocaleDateString('es-MX')}` : ''}
                </td>
                <td className="px-3 py-2 text-by-gray-light">{p.autoriza_nombre ?? '—'}</td>
                <td className="px-3 py-2">
                  {puedeGestionar ? (
                    <select
                      defaultValue={p.estatus}
                      onChange={(e) => startTransition(() => actualizarEstatusPermiso(p.id, e.target.value))}
                      className={'h-7 rounded-full border-0 px-2 text-[11px] ' + (ESTATUS_STYLE[p.estatus] ?? '')}
                    >
                      <option value="vigente">Vigente</option>
                      <option value="cerrado">Cerrado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  ) : (
                    <span className={'rounded-full px-2 py-0.5 text-[11px] ' + (ESTATUS_STYLE[p.estatus] ?? '')}>
                      {p.estatus}
                    </span>
                  )}
                </td>
                {puedeGestionar && (
                  <td className="px-3 py-2">
                    <button
                      onClick={() => startTransition(() => eliminarPermisoTrabajo(p.id))}
                      disabled={pendiente}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {permisos.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin permisos de trabajo registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {puedeGestionar && (
        <form
          action={(fd) => startTransition(() => crearPermisoTrabajo(fd))}
          className="rounded-xl border border-black/5 bg-white p-4"
        >
          <p className="mb-3 text-[12.5px] font-medium text-by-gray-dark">Nuevo permiso de trabajo</p>
          <div className="grid grid-cols-3 gap-2">
            <select name="proveedor_id" defaultValue="" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="">Sin proveedor ligado</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <input name="contratista_nombre" placeholder="Nombre del contratista / empresa" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="tipo_trabajo" placeholder="Tipo de trabajo (ej. mantenimiento eléctrico)" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="area" placeholder="Área / nave" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <div>
              <label className="mb-1 block text-[10.5px] text-by-gray-light">Fecha de inicio</label>
              <input name="fecha_inicio" type="date" required className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] text-by-gray-light">Fecha de fin (opcional)</label>
              <input name="fecha_fin" type="date" className="h-8 w-full rounded-md border border-black/10 px-2 text-[12px]" />
            </div>
            <textarea name="medidas_seguridad" placeholder="Medidas de seguridad requeridas" rows={2} className="col-span-3 rounded-md border border-black/10 px-2 py-1.5 text-[12px]" />
            <input name="epp_requerido" placeholder="EPP requerido (ej. casco, botas, guantes)" className="col-span-3 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="col-span-3 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Registrar permiso
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
