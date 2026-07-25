'use client'

import { useActionState, useRef, useEffect, useState } from 'react'
import { crearUsuario, type EstadoCrearUsuario } from './actions'

const ROL_LABEL: Record<string, string> = {
  coordinador_sgi: 'Coordinador SGI',
  director: 'Director',
  gerente: 'Gerente',
  jefe: 'Jefe',
  supervisor: 'Supervisor',
  auxiliar: 'Auxiliar',
  montacarguista: 'Montacarguista',
}

type Puesto = { id: string; nombre: string; rol_sistema: string }

const inicial: EstadoCrearUsuario = {}

export default function NuevoUsuarioForm({ puestos }: { puestos: Puesto[] }) {
  const [estado, formAction, pending] = useActionState(crearUsuario, inicial)
  const formRef = useRef<HTMLFormElement>(null)
  const [rolSeleccionado, setRolSeleccionado] = useState('')
  const [puestoNombre, setPuestoNombre] = useState('')

  useEffect(() => {
    if (estado.passwordTemporal) {
      formRef.current?.reset()
      setRolSeleccionado('')
      setPuestoNombre('')
    }
  }, [estado.passwordTemporal])

  function alCambiarPuesto(e: React.ChangeEvent<HTMLSelectElement>) {
    const puesto = puestos.find((p) => p.id === e.target.value)
    setRolSeleccionado(puesto?.rol_sistema ?? '')
    setPuestoNombre(puesto?.nombre ?? '')
  }

  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
        Dar de alta usuario
      </p>

      <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Usuario
          </label>
          <input
            name="usuario"
            placeholder="chernandez"
            required
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Nombre completo
          </label>
          <input
            name="nombre"
            placeholder="Nombre Apellido Apellido"
            required
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Correo (opcional)
          </label>
          <input
            name="correo"
            type="email"
            placeholder="nombre@bonyard.mx (si se deja vacío, se genera automático)"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Puesto
          </label>
          <select
            name="puesto_id"
            required
            defaultValue=""
            onChange={alCambiarPuesto}
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>
              Selecciona un puesto
            </option>
            {puestos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <input type="hidden" name="puesto_nombre" value={puestoNombre} />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Rol (se llena solo según el puesto, pero puedes ajustarlo)
          </label>
          <select
            name="rol"
            required
            value={rolSeleccionado}
            onChange={(e) => setRolSeleccionado(e.target.value)}
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          >
            <option value="" disabled>
              Selecciona un puesto primero
            </option>
            {Object.entries(ROL_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {estado.error && (
          <p className="col-span-2 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {estado.error}
          </p>
        )}

        {estado.passwordTemporal && (
          <div className="col-span-2 rounded-md bg-[#eaf5f0] px-3 py-2 text-[12px] text-[#3d6b53]">
            Usuario creado ({estado.correoCreado}). Contraseña temporal:{' '}
            <code className="font-medium">{estado.passwordTemporal}</code>
            <br />
            Compártesela por un canal seguro; se le pedirá cambiarla en su
            primer acceso.
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="col-span-2 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
        >
          {pending ? 'Creando…' : 'Crear usuario'}
        </button>
      </form>
    </div>
  )
}
