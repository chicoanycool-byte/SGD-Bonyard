import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { cambiarEstatusUsuario } from './actions'
import NuevoUsuarioForm from './NuevoUsuarioForm'
import RestablecerPasswordBoton from './RestablecerPasswordBoton'
import EditarUsuarioBoton from './EditarUsuarioBoton'
import { redirect } from 'next/navigation'

const ROL_LABEL: Record<string, string> = {
  coordinador_sgi: 'Coordinador SGI',
  director: 'Director',
  gerente: 'Gerente',
  jefe: 'Jefe',
  supervisor: 'Supervisor',
}

const ESTATUS_ESTILO: Record<string, string> = {
  activo: 'bg-[#eaf5f0] text-[#3d6b53]',
  pausado: 'bg-[#fdf3e3] text-[#9a6b1c]',
  baja: 'bg-[#f1efe8] text-[#5f5e5a]',
}

export default async function UsuariosPage() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    redirect('/inicio')
  }

  const supabase = await createClient()
  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, usuario, nombre, correo, puesto, rol, estatus')
    .order('nombre')

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/usuarios">
      <div className="flex flex-col gap-4">
        <NuevoUsuarioForm />

        <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
                <th className="px-4 py-2 font-normal">Usuario</th>
                <th className="px-4 py-2 font-normal">Nombre</th>
                <th className="px-4 py-2 font-normal">Puesto</th>
                <th className="px-4 py-2 font-normal">Rol</th>
                <th className="px-4 py-2 font-normal">Estatus</th>
                <th className="px-4 py-2 font-normal">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(usuarios ?? []).map((u) => (
                <tr key={u.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-2 text-by-gray-dark">{u.usuario}</td>
                  <td className="px-4 py-2 text-by-gray-dark">{u.nombre}</td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {u.puesto ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {ROL_LABEL[u.rol] ?? u.rol}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-[11px] ' +
                        (ESTATUS_ESTILO[u.estatus] ?? '')
                      }
                    >
                      {u.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-3">
                      {u.estatus !== 'activo' && (
                        <form
                          action={cambiarEstatusUsuario.bind(null, u.id, 'activo')}
                        >
                          <button className="text-[12px] text-by-accent hover:underline">
                            Activar
                          </button>
                        </form>
                      )}
                      {u.estatus === 'activo' && (
                        <form
                          action={cambiarEstatusUsuario.bind(
                            null,
                            u.id,
                            'pausado'
                          )}
                        >
                          <button className="text-[12px] text-by-accent hover:underline">
                            Pausar
                          </button>
                        </form>
                      )}
                      {u.estatus !== 'baja' && (
                        <form
                          action={cambiarEstatusUsuario.bind(null, u.id, 'baja')}
                        >
                          <button className="text-[12px] text-red-600 hover:underline">
                            Dar de baja
                          </button>
                        </form>
                      )}
                      <RestablecerPasswordBoton usuarioId={u.id} nombre={u.nombre} />
                      <EditarUsuarioBoton usuario={u} />
                    </div>
                  </td>
                </tr>
              ))}
              {(usuarios ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-[12px] text-by-gray-light"
                  >
                    Aún no hay usuarios dados de alta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
