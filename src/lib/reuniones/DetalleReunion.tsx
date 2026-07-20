'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  guardarDesarrolloReunion,
  guardarAcuerdos,
  cerrarReunion,
  editarReunion,
  actualizarMiAcuerdo,
  type Acuerdo,
} from './actions'

type Usuario = { id: string; nombre: string }

export default function DetalleReunion({
  reunion,
  ruta,
  puedeEditar,
  usuarios,
  usuarioActualId,
}: {
  reunion: {
    id: string
    fecha: string
    hora: string | null
    lugar: string | null
    link_virtual: string | null
    invitados: string[]
    agenda: string | null
    asistentes: string | null
    desarrollo: string | null
    conclusiones: string | null
    acuerdos: Acuerdo[]
    estatus: string
    convocante_nombre: string | null
  }
  ruta: string
  puedeEditar: boolean
  usuarios: Usuario[]
  usuarioActualId: string
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const bloqueado = reunion.estatus === 'realizada'

  const [editandoDatos, setEditandoDatos] = useState(false)
  const [datosForm, setDatosForm] = useState({
    fecha: reunion.fecha,
    hora: reunion.hora ?? '',
    lugar: reunion.lugar ?? '',
    link_virtual: reunion.link_virtual ?? '',
    agenda: reunion.agenda ?? '',
    invitados: reunion.invitados ?? [],
  })

  const [asistentes, setAsistentes] = useState(reunion.asistentes ?? '')
  const [desarrollo, setDesarrollo] = useState(reunion.desarrollo ?? '')
  const [conclusiones, setConclusiones] = useState(reunion.conclusiones ?? '')
  const [acuerdos, setAcuerdos] = useState<Acuerdo[]>(
    reunion.acuerdos.length > 0
      ? reunion.acuerdos
      : [{ acuerdo: '', responsable_id: '', responsable_nombre: '', fecha_compromiso: '', estatus: 'abierto' }]
  )

  function alternarInvitadoEdit(id: string) {
    setDatosForm((prev) => ({
      ...prev,
      invitados: prev.invitados.includes(id)
        ? prev.invitados.filter((x) => x !== id)
        : [...prev.invitados, id],
    }))
  }

  const invitadosNombres = usuarios
    .filter((u) => reunion.invitados.includes(u.id))
    .map((u) => u.nombre)

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[14px] font-medium text-by-gray-dark">
            {new Date(reunion.fecha + 'T00:00:00').toLocaleDateString('es-MX')}
            {reunion.hora ? ` · ${reunion.hora}` : ''}
          </p>
          <div className="flex gap-2">
            <a
              href={`${ruta}/${reunion.id}/minuta`}
              className="h-8 rounded-md border border-by-primary px-3 text-[12.5px] font-medium leading-8 text-by-primary hover:bg-by-primary/5"
            >
              Descargar minuta (Word)
            </a>
            {puedeEditar && !bloqueado && (
              <>
                <button
                  onClick={() => setEditandoDatos(!editandoDatos)}
                  className="h-8 rounded-md border border-black/10 px-3 text-[12.5px] font-medium text-by-gray-dark hover:bg-black/5"
                >
                  {editandoDatos ? 'Cancelar' : 'Editar datos'}
                </button>
                <button
                  disabled={pending}
                  onClick={() => {
                    if (!confirm('¿Cerrar esta reunión? Se generarán pendientes para cada acuerdo con responsable asignado.')) return
                    startTransition(async () => {
                      await cerrarReunion(reunion.id, ruta)
                      router.refresh()
                    })
                  }}
                  className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
                >
                  Cerrar reunión
                </button>
              </>
            )}
          </div>
        </div>

        {!editandoDatos ? (
          <div className="grid grid-cols-3 gap-3 text-[12.5px]">
            <div>
              <p className="text-by-gray-light">Lugar</p>
              <p className="text-by-gray-dark">{reunion.lugar ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Convocante</p>
              <p className="text-by-gray-dark">{reunion.convocante_nombre ?? '—'}</p>
            </div>
            <div>
              <p className="text-by-gray-light">Estatus</p>
              <p className="text-by-gray-dark">{bloqueado ? 'Realizada' : 'Programada / En proceso'}</p>
            </div>
            {reunion.link_virtual && (
              <div className="col-span-3">
                <p className="text-by-gray-light">Liga de la reunión virtual</p>
                <a href={reunion.link_virtual} target="_blank" className="text-by-accent hover:underline">
                  {reunion.link_virtual}
                </a>
              </div>
            )}
            <div className="col-span-3">
              <p className="text-by-gray-light">Invitados</p>
              <p className="text-by-gray-dark">{invitadosNombres.join(', ') || '—'}</p>
            </div>
            {reunion.agenda && (
              <div className="col-span-3">
                <p className="text-by-gray-light">Agenda</p>
                <p className="text-by-gray-dark">{reunion.agenda}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha</label>
                <input
                  type="date"
                  value={datosForm.fecha}
                  onChange={(e) => setDatosForm({ ...datosForm, fecha: e.target.value })}
                  className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[12.5px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Hora</label>
                <input
                  type="time"
                  value={datosForm.hora}
                  onChange={(e) => setDatosForm({ ...datosForm, hora: e.target.value })}
                  className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[12.5px]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-by-gray-dark">Lugar</label>
                <input
                  value={datosForm.lugar}
                  onChange={(e) => setDatosForm({ ...datosForm, lugar: e.target.value })}
                  className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[12.5px]"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-[11px] text-by-gray-dark">Liga (si es virtual)</label>
                <input
                  value={datosForm.link_virtual}
                  onChange={(e) => setDatosForm({ ...datosForm, link_virtual: e.target.value })}
                  className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[12.5px]"
                />
              </div>
              <div className="col-span-3">
                <label className="mb-1 block text-[11px] text-by-gray-dark">Agenda</label>
                <textarea
                  value={datosForm.agenda}
                  onChange={(e) => setDatosForm({ ...datosForm, agenda: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[12.5px]"
                />
              </div>
              <div className="col-span-3">
                <label className="mb-1 block text-[11px] text-by-gray-dark">Invitados</label>
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-md border border-black/10 p-2">
                  {usuarios.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-[12px] text-by-gray-dark"
                    >
                      <input
                        type="checkbox"
                        checked={datosForm.invitados.includes(u.id)}
                        onChange={() => alternarInvitadoEdit(u.id)}
                      />
                      {u.nombre}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await editarReunion(reunion.id, ruta, {
                    fecha: datosForm.fecha,
                    hora: datosForm.hora || null,
                    lugar: datosForm.lugar || null,
                    link_virtual: datosForm.link_virtual || null,
                    agenda: datosForm.agenda || null,
                    invitados: datosForm.invitados,
                  })
                  setEditandoDatos(false)
                  router.refresh()
                })
              }
              className="h-8 w-fit rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-60"
            >
              Guardar cambios
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Desarrollo de la reunión</p>
        <div className="mb-3">
          <label className="mb-1 block text-[11px] text-by-gray-dark">Asistentes reales</label>
          <input
            disabled={bloqueado || !puedeEditar}
            value={asistentes}
            onChange={(e) => setAsistentes(e.target.value)}
            placeholder="Nombres separados por coma"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px]"
          />
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-[11px] text-by-gray-dark">Minuta / desarrollo</label>
          <textarea
            disabled={bloqueado || !puedeEditar}
            value={desarrollo}
            onChange={(e) => setDesarrollo(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px]"
          />
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-[11px] text-by-gray-dark">Conclusiones</label>
          <textarea
            disabled={bloqueado || !puedeEditar}
            value={conclusiones}
            onChange={(e) => setConclusiones(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px]"
          />
        </div>
        {!bloqueado && puedeEditar && (
          <button
            disabled={pending}
            onClick={() => {
              const fd = new FormData()
              fd.set('asistentes', asistentes)
              fd.set('desarrollo', desarrollo)
              fd.set('conclusiones', conclusiones)
              startTransition(() => guardarDesarrolloReunion(reunion.id, ruta, fd))
            }}
            className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
          >
            Guardar
          </button>
        )}
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-3 text-[13px] font-medium text-by-gray-dark">Acuerdos</p>
        <div className="flex flex-col gap-2">
          {acuerdos.map((a, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              <input
                disabled={bloqueado || !puedeEditar}
                placeholder="Acuerdo"
                value={a.acuerdo}
                onChange={(e) => {
                  const c = [...acuerdos]
                  c[i] = { ...c[i], acuerdo: e.target.value }
                  setAcuerdos(c)
                }}
                className="h-8 rounded-md border border-black/10 px-2.5 text-[12.5px]"
              />
              <select
                disabled={bloqueado || !puedeEditar}
                value={a.responsable_id}
                onChange={(e) => {
                  const usuario = usuarios.find((u) => u.id === e.target.value)
                  const c = [...acuerdos]
                  c[i] = { ...c[i], responsable_id: e.target.value, responsable_nombre: usuario?.nombre ?? '' }
                  setAcuerdos(c)
                }}
                className="h-8 rounded-md border border-black/10 px-2.5 text-[12.5px]"
              >
                <option value="">— Responsable —</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
              <input
                disabled={bloqueado || !puedeEditar}
                type="date"
                value={a.fecha_compromiso}
                onChange={(e) => {
                  const c = [...acuerdos]
                  c[i] = { ...c[i], fecha_compromiso: e.target.value }
                  setAcuerdos(c)
                }}
                className="h-8 rounded-md border border-black/10 px-2.5 text-[12.5px]"
              />
              <select
                disabled={bloqueado || !(puedeEditar || a.responsable_id === usuarioActualId)}
                value={a.estatus}
                onChange={(e) => {
                  const nuevoEstatus = e.target.value as 'abierto' | 'cerrado'
                  const c = [...acuerdos]
                  c[i] = { ...c[i], estatus: nuevoEstatus }
                  setAcuerdos(c)
                  if (!puedeEditar && a.responsable_id === usuarioActualId) {
                    startTransition(() => actualizarMiAcuerdo(reunion.id, ruta, i, nuevoEstatus))
                  }
                }}
                className="h-8 rounded-md border border-black/10 px-2.5 text-[12.5px]"
              >
                <option value="abierto">Abierto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
          ))}
        </div>
        {!bloqueado && puedeEditar && (
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() =>
                setAcuerdos([...acuerdos, { acuerdo: '', responsable_id: '', responsable_nombre: '', fecha_compromiso: '', estatus: 'abierto' }])
              }
              className="text-[12px] text-by-accent hover:underline"
            >
              + Agregar acuerdo
            </button>
            <button
              disabled={pending}
              onClick={() => startTransition(() => guardarAcuerdos(reunion.id, ruta, acuerdos))}
              className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
            >
              Guardar acuerdos
            </button>
          </div>
        )}
        <p className="mt-2 text-[10.5px] text-by-gray-light">
          Al cerrar la reunión, cada acuerdo con responsable asignado le genera un pendiente y notificación (portal + correo).
        </p>
      </div>
    </div>
  )
}
