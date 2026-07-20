import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const TIPO_LABEL: Record<string, string> = {
  solicitud_documento: 'Solicitud de documento',
  auditoria: 'Auditoría',
  plan_reaccion: 'Plan de reacción',
  evaluacion_auditor: 'Evaluación de auditor',
  queja: 'Queja',
  ac_ap: 'AC / AP',
  indicador: 'Indicador',
  proveedor: 'Proveedor',
  recorrido_bpa: 'Recorrido BPA',
  verificacion_sgi: 'Verificación SGI',
  sistema: 'Sistema',
}

function tiempoRelativo(fechaIso: string) {
  const diffMs = Date.now() - new Date(fechaIso).getTime()
  const minutos = Math.floor(diffMs / 60000)
  if (minutos < 1) return 'hace un momento'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return `hace ${dias} d`
}

export default async function InicioPage() {
  const usuario = await requerirUsuario()
  const supabase = await createClient()
  const esDireccion = ['coordinador_sgi', 'gerente', 'director'].includes(
    usuario.rol
  )

  const [pendientesAbiertos, notificacionesNoLeidas, usuariosActivos, notificacionesRecientes] =
    await Promise.all([
      supabase
        .from('pendientes')
        .select('id', { count: 'exact', head: true })
        .eq('estatus', 'abierto'),
      supabase
        .from('notificaciones')
        .select('id', { count: 'exact', head: true })
        .eq('leido', false),
      esDireccion
        ? supabase
            .from('usuarios')
            .select('id', { count: 'exact', head: true })
            .eq('estatus', 'activo')
        : Promise.resolve({ count: null }),
      supabase
        .from('notificaciones')
        .select('id, tipo, mensaje, leido, creado_en')
        .order('creado_en', { ascending: false })
        .limit(6),
    ])

  const tarjetas = [
    {
      label: 'Pendientes abiertos',
      valor: pendientesAbiertos.count ?? 0,
      estilo: 'bg-[#f4f6f6] text-by-primary',
    },
    {
      label: 'Notificaciones sin leer',
      valor: notificacionesNoLeidas.count ?? 0,
      estilo: 'bg-[#f4f6f6] text-by-primary',
    },
    ...(esDireccion
      ? [
          {
            label: 'Usuarios activos',
            valor: usuariosActivos.count ?? 0,
            estilo: 'bg-[#eaf5f0] text-[#3d6b53]',
          },
        ]
      : []),
  ]

  const notificaciones = notificacionesRecientes.data ?? []

  return (
    <AppShell nombre={usuario.nombre} rol={usuario.rol} usuarioId={usuario.id} activo="/inicio">
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-1 text-[14px] font-medium text-by-gray-dark">
            Bienvenido, {usuario.nombre.split(' ')[0]}
          </p>
          <p className="text-[12px] text-by-gray-light">
            Resumen general del sistema de gestión.
          </p>
        </div>

        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${tarjetas.length}, 1fr)` }}
        >
          {tarjetas.map((t) => (
            <div key={t.label} className={`rounded-lg px-4 py-3 ${t.estilo}`}>
              <p className="mb-1 text-[11px] opacity-80">{t.label}</p>
              <p className="text-[22px] font-medium">{t.valor}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
            Notificaciones recientes
          </p>
          {notificaciones.length === 0 ? (
            <p className="text-[12px] text-by-gray-light">
              No tienes notificaciones todavía.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {notificaciones.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-[#f4f6f6] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    {!n.leido && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-by-accent" />
                    )}
                    <span className="text-[12px] text-by-gray-dark">
                      <span className="text-by-gray-light">
                        [{TIPO_LABEL[n.tipo] ?? n.tipo}]
                      </span>{' '}
                      {n.mensaje}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] text-by-gray-light">
                    {tiempoRelativo(n.creado_en)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
