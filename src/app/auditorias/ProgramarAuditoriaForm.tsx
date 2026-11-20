'use client'

import { useActionState, useRef, useEffect, useState } from 'react'
import { programarAuditoria, type EstadoProgramarAuditoria } from './actions'

type Usuario = { id: string; nombre: string }

const inicial: EstadoProgramarAuditoria = {}

export default function ProgramarAuditoriaForm({
  usuarios,
}: {
  usuarios: Usuario[]
}) {
  const [estado, formAction, pending] = useActionState(programarAuditoria, inicial)
  const formRef = useRef<HTMLFormElement>(null)
  const [tipo, setTipo] = useState('')

  useEffect(() => {
    if (estado.ok) {
      formRef.current?.reset()
      setTipo('')
    }
  }, [estado.ok])

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Programar auditoría
      </p>
      <form ref={formRef} action={formAction} className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Fecha
          </label>
          <input
            name="fecha"
            type="date"
            required
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Norma
          </label>
          <select
            name="norma"
            required
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>Selecciona</option>
            <option value="iso_9001">ISO 9001:2015</option>
            <option value="sqf">SQF</option>
            <option value="ambas">Ambas (ISO 9001:2015 + SQF)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Tipo
          </label>
          <select
            name="tipo"
            required
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>Selecciona</option>
            <option value="interna">Interna</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>

        {tipo === 'cliente' && (
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">
              Nombre del cliente
            </label>
            <input
              name="cliente_nombre"
              placeholder="Nombre del cliente"
              required
              className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Nave auditada
          </label>
          <select
            name="nave"
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="">Selecciona</option>
            <option value="Nave 1">Nave 1</option>
            <option value="Nave 2">Nave 2</option>
            <option value="Nave 3">Nave 3</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Proceso / Área
          </label>
          <select
            name="proceso"
            required
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>Selecciona</option>
            <option value="Almacén">Almacén</option>
            <option value="Transporte">Transporte</option>
            <option value="Ambas">Ambas</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Auditor líder
          </label>
          <select
            name="auditor_lider_id"
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="">— Sin asignar —</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Auditor auxiliar
          </label>
          <select
            name="auditor_auxiliar_id"
            defaultValue=""
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="">— Sin asignar —</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>

        <div className="col-span-3">
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Comentarios
          </label>
          <input
            name="observaciones"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>

        {estado.error && (
          <p className="col-span-3 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {estado.error}
          </p>
        )}
        {estado.ok && (
          <p className="col-span-3 rounded-md bg-[#eaf5f0] px-3 py-2 text-[12px] text-[#3d6b53]">
            Auditoría programada y notificada a los involucrados.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="col-span-3 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
        >
          {pending ? 'Programando…' : 'Programar auditoría'}
        </button>
      </form>
    </div>
  )
}
