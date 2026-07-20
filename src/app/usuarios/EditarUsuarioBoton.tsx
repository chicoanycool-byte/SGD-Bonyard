'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { editarUsuario } from './actions'

const ROL_LABEL: Record<string, string> = {
  coordinador_sgi: 'Coordinador SGI',
  director: 'Director',
  gerente: 'Gerente',
  jefe: 'Jefe',
  supervisor: 'Supervisor',
}

export default function EditarUsuarioBoton({
  usuario,
}: {
  usuario: {
    id: string
    usuario: string
    nombre: string
    correo: string
    puesto: string | null
    rol: string
  }
}) {
  const [editando, setEditando] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [campos, setCampos] = useState({
    usuario: usuario.usuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
    puesto: usuario.puesto ?? '',
    rol: usuario.rol,
  })

  const inputCls = 'h-8 w-full rounded-md border border-black/10 px-2 text-[12.5px]'

  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        className="text-[12px] text-by-accent hover:underline"
      >
        Editar
      </button>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
          <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
            Editar usuario
          </p>
          <div className="flex flex-col gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">Usuario (login)</label>
              <input
                value={campos.usuario}
                onChange={(e) => setCampos({ ...campos, usuario: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">Nombre completo</label>
              <input
                value={campos.nombre}
                onChange={(e) => setCampos({ ...campos, nombre: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">Correo</label>
              <input
                type="email"
                value={campos.correo}
                onChange={(e) => setCampos({ ...campos, correo: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">Puesto</label>
              <input
                value={campos.puesto}
                onChange={(e) => setCampos({ ...campos, puesto: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-by-gray-dark">Rol</label>
              <select
                value={campos.rol}
                onChange={(e) => setCampos({ ...campos, rol: e.target.value })}
                className={inputCls}
              >
                {Object.entries(ROL_LABEL).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null)
                  const resultado = await editarUsuario(usuario.id, campos)
                  if (resultado.error) {
                    setError(resultado.error)
                    return
                  }
                  setEditando(false)
                  router.refresh()
                })
              }
              className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-60"
            >
              {pending ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              onClick={() => setEditando(false)}
              className="h-8 rounded-md border border-black/10 px-4 text-[12.5px] text-by-gray-dark hover:bg-black/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
