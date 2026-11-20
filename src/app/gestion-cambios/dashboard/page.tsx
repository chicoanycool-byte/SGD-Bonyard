import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ESTATUS_CAMBIO, RIESGO_CAMBIO, TIPOS_CAMBIO } from '@/lib/cambios'

function Tarjeta({ titulo, valor, nota }: { titulo: string; valor: string | number; nota?: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="text-[11.5px] text-by-gray">{titulo}</p>
      <p className="mt-1 text-2xl font-semibold text-by-gray-dark">{valor}</p>
      {nota && <p className="mt-0.5 text-[11px] text-by-gray">{nota}</p>}
    </div>
  )
}

function Barras({ titulo, filas }: { titulo: string; filas: { label: string; n: number }[] }) {
  const max = Math.max(1, ...filas.map((f) => f.n))
  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">{titulo}</p>
      {filas.length === 0 && <p className="text-[12px] text-by-gray">Sin datos todavía.</p>}
      <div className="flex flex-col gap-2">
        {filas.map((f) => (
          <div key={f.label} className="flex items-center gap-3 text-[12px]">
            <span className="w-44 shrink-0 truncate text-by-gray-dark">{f.label}</span>
            <div className="h-2.5 flex-1 rounded-full bg-black/5">
              <div className="h-2.5 rounded-full bg-by-accent" style={{ width: `${(f.n / max) * 100}%` }} />
            </div>
            <span className="w-6 text-right font-medium text-by-gray-dark">{f.n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function DashboardCambiosPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const { data } = await supabase
    .from('cambios')
    .select('tipo, estatus, riesgo_nivel, afecta_inocuidad, fecha_planeada, fecha_implementacion, cambio_efectivo, creado_en, fecha_cierre')

  const cambios = data ?? []
  const hoy = new Date().toISOString().slice(0, 10)
  const total = cambios.length
  const abiertos = cambios.filter((c) => c.estatus !== 'cerrado' && c.estatus !== 'rechazado').length
  const retrasados = cambios.filter((c) => c.estatus === 'aprobado' && c.fecha_planeada && c.fecha_planeada < hoy).length
  const cerrados = cambios.filter((c) => c.estatus === 'cerrado')
  const efectivos = cerrados.filter((c) => c.cambio_efectivo).length
  const dias = cerrados
    .filter((c) => c.fecha_cierre)
    .map((c) => (new Date(c.fecha_cierre as string).getTime() - new Date(c.creado_en as string).getTime()) / 86400000)
  const promedio = dias.length ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : null

  const contar = (clave: 'estatus' | 'tipo' | 'riesgo_nivel', nombres: Record<string, string | { label: string }>) =>
    Object.entries(nombres)
      .map(([k, v]) => ({
        label: typeof v === 'string' ? v : v.label,
        n: cambios.filter((c) => c[clave] === k).length,
      }))
      .filter((f) => f.n > 0)

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/gestion-cambios/dashboard">
      <div className="flex flex-col gap-4">
        <p className="text-[14px] font-medium text-by-gray-dark">Métricas · Gestión de cambios</p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Tarjeta titulo="Cambios registrados" valor={total} />
          <Tarjeta titulo="En proceso" valor={abiertos} nota="Sin cerrar ni rechazar" />
          <Tarjeta titulo="Aprobados con retraso" valor={retrasados} nota="Pasó su fecha planeada" />
          <Tarjeta
            titulo="Cambios efectivos"
            valor={cerrados.length ? `${Math.round((efectivos / cerrados.length) * 100)}%` : '—'}
            nota={`${efectivos} de ${cerrados.length} cerrados`}
          />
          <Tarjeta titulo="Días promedio al cierre" valor={promedio ?? '—'} nota="Desde la solicitud" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Barras titulo="Por estatus" filas={contar('estatus', ESTATUS_CAMBIO)} />
          <Barras titulo="Por tipo de cambio" filas={contar('tipo', TIPOS_CAMBIO)} />
          <Barras titulo="Por nivel de riesgo" filas={contar('riesgo_nivel', RIESGO_CAMBIO)} />
        </div>
      </div>
    </AppShell>
  )
}
