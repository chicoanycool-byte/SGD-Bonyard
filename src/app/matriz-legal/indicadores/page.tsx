import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function IndicadorLegalPage() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') redirect('/matriz-legal/plan-accion')
  const supabase = await createClient()

  const { data: filas } = await supabase.from('matriz_legal').select('evidencia')
  const { data: plan } = await supabase
    .from('matriz_legal_plan_accion')
    .select('nivel_riesgo, estatus')

  const total = filas?.length ?? 0
  const cumplen = (filas ?? []).filter((f) => f.evidencia === 'SI').length
  const incumplen = (filas ?? []).filter((f) => f.evidencia === 'NO').length
  const na = (filas ?? []).filter((f) => f.evidencia === 'NA').length
  const sinCapturar = (filas ?? []).filter((f) => !f.evidencia).length
  const base = total - na - sinCapturar
  const porcentaje = base > 0 ? Math.round((cumplen / base) * 100) : null

  const semaforo =
    porcentaje === null
      ? { texto: 'SIN DATO', color: 'bg-[#f1efe8] text-[#5f5e5a]' }
      : porcentaje >= 85
        ? { texto: 'VERDE', color: 'bg-[#eaf5f0] text-[#3d6b53]' }
        : porcentaje >= 68
          ? { texto: 'AMARILLO', color: 'bg-[#fdf3e3] text-[#9a6b1c]' }
          : { texto: 'ROJO', color: 'bg-[#fdecea] text-[#a13c33]' }

  const criticosAbiertos = (plan ?? []).filter(
    (p) => p.nivel_riesgo?.includes('CRÍTICO') && p.estatus === 'Abierto'
  ).length
  const mayoresAbiertos = (plan ?? []).filter(
    (p) => p.nivel_riesgo?.includes('MAYOR') && p.estatus === 'Abierto'
  ).length

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/matriz-legal"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Indicador de Cumplimiento Legal (FSG-19)
        </p>
        <Link
          href="/matriz-legal"
          className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
        >
          ← Volver a la matriz
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-black/5 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-medium text-by-gray-dark">
              % Cumplimiento Legal Global
            </p>
            <span className={'rounded-full px-3 py-1 text-[12px] font-medium ' + semaforo.color}>
              {semaforo.texto}
            </span>
          </div>
          <p className="text-[32px] font-semibold text-by-primary">
            {porcentaje !== null ? `${porcentaje}%` : '—'}
          </p>
          <p className="text-[11px] text-by-gray-light">Meta: ≥ 85%</p>
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="rounded-lg bg-[#f4f6f6] px-4 py-3 text-by-primary">
            <p className="mb-1 text-[11px] opacity-80">Total requisitos</p>
            <p className="text-[22px] font-medium">{total}</p>
          </div>
          <div className="rounded-lg bg-[#eaf5f0] px-4 py-3 text-[#3d6b53]">
            <p className="mb-1 text-[11px] opacity-80">Cumplen (SI)</p>
            <p className="text-[22px] font-medium">{cumplen}</p>
          </div>
          <div className="rounded-lg bg-[#fdecea] px-4 py-3 text-[#a13c33]">
            <p className="mb-1 text-[11px] opacity-80">Incumplen (NO)</p>
            <p className="text-[22px] font-medium">{incumplen}</p>
          </div>
          <div className="rounded-lg bg-[#f1efe8] px-4 py-3 text-[#5f5e5a]">
            <p className="mb-1 text-[11px] opacity-80">N/A</p>
            <p className="text-[22px] font-medium">{na}</p>
          </div>
          <div className="rounded-lg bg-[#fdf3e3] px-4 py-3 text-[#9a6b1c]">
            <p className="mb-1 text-[11px] opacity-80">Sin capturar</p>
            <p className="text-[22px] font-medium">{sinCapturar}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <p className="mb-1 text-[13px] font-medium text-by-gray-dark">
              Hallazgos Críticos Abiertos
            </p>
            <p className="text-[28px] font-semibold text-[#a13c33]">{criticosAbiertos}</p>
            <p className="text-[11px] text-by-gray-light">
              Meta: 0. Cada uno requiere acción correctiva en ≤ 30 días.
            </p>
          </div>
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <p className="mb-1 text-[13px] font-medium text-by-gray-dark">
              Hallazgos Mayores Abiertos
            </p>
            <p className="text-[28px] font-semibold text-[#9a6b1c]">{mayoresAbiertos}</p>
            <p className="text-[11px] text-by-gray-light">Meta: 0. Cerrar en ≤ 60 días.</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
