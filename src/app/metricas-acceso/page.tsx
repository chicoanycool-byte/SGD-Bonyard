import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ROL_LABEL } from '@/lib/permisos'

type Metrica = {
  usuario_id: string
  usuario: string
  nombre: string
  rol: string
  estatus: string
  total_accesos: number
  minutos_totales: number
  ultimo_acceso: string | null
}

function formatearDuracion(minutos: number) {
  if (!minutos) return '—'
  const horas = Math.floor(minutos / 60)
  const mins = Math.round(minutos % 60)
  if (horas === 0) return `${mins} min`
  return `${horas} h ${mins} min`
}

export default async function MetricasAccesoPage() {
  const quien = await requerirUsuario()

  if (quien.rol !== 'coordinador_sgi') {
    redirect('/inicio')
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('obtener_metricas_acceso')
  const metricas = (data ?? []) as Metrica[]

  const totalIngresos = metricas.reduce((acc, m) => acc + Number(m.total_accesos), 0)
  const totalMinutos = metricas.reduce((acc, m) => acc + Number(m.minutos_totales), 0)
  const usuariosConAcceso = metricas.filter((m) => Number(m.total_accesos) > 0).length

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/metricas-acceso">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[14px] font-medium text-by-gray-dark">
            Métricas de acceso al portal
          </p>
          <p className="mt-0.5 text-[12px] text-by-gray-light">
            Cuántas veces ha ingresado cada usuario y cuánto tiempo ha navegado en el sistema.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-black/5 bg-white p-4 text-[12.5px] text-red-600">
            No se pudieron cargar las métricas: {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <p className="text-[11px] text-by-gray-light">Usuarios con acceso</p>
            <p className="mt-1 text-[20px] font-medium text-by-gray-dark">{usuariosConAcceso}</p>
          </div>
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <p className="text-[11px] text-by-gray-light">Total de ingresos</p>
            <p className="mt-1 text-[20px] font-medium text-by-gray-dark">{totalIngresos}</p>
          </div>
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <p className="text-[11px] text-by-gray-light">Tiempo navegado (todos)</p>
            <p className="mt-1 text-[20px] font-medium text-by-gray-dark">
              {formatearDuracion(totalMinutos)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-black/5 bg-white">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
                <th className="px-4 py-2 font-normal">Usuario</th>
                <th className="px-4 py-2 font-normal">Rol</th>
                <th className="px-4 py-2 font-normal">Ingresos</th>
                <th className="px-4 py-2 font-normal">Tiempo navegado</th>
                <th className="px-4 py-2 font-normal">Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {metricas.map((m) => (
                <tr key={m.usuario_id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-2">
                    <p className="font-medium text-by-gray-dark">{m.nombre}</p>
                    <p className="text-[11px] text-by-gray-light">
                      {m.usuario}
                      {m.estatus !== 'activo' ? ` · ${m.estatus}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {ROL_LABEL[m.rol] ?? m.rol}
                  </td>
                  <td className="px-4 py-2 text-by-gray-dark">{m.total_accesos}</td>
                  <td className="px-4 py-2 text-by-gray-dark">
                    {formatearDuracion(Number(m.minutos_totales))}
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {m.ultimo_acceso
                      ? new Date(m.ultimo_acceso).toLocaleString('es-MX', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Nunca'}
                  </td>
                </tr>
              ))}
              {metricas.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                    Aún no hay datos de acceso registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-by-gray-light">
          El tiempo navegado es una estimación basada en la última actividad detectada en cada
          sesión (revisa cada minuto mientras el usuario usa el sistema), no es un cronómetro exacto.
        </p>
      </div>
    </AppShell>
  )
}
