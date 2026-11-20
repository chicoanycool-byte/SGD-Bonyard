import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ESTATUS_CAMBIO, RIESGO_CAMBIO, TIPOS_CAMBIO } from '@/lib/cambios'
import SolicitarCambioForm from './SolicitarCambioForm'

export default async function GestionCambiosPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('cambios')
    .select(
      'id, folio, titulo, tipo, nave, riesgo_nivel, estatus, afecta_inocuidad, fecha_planeada, creado_en, responsable:usuarios!cambios_responsable_id_fkey(nombre)'
    )
    .order('creado_en', { ascending: false })

  const cambios = data ?? []
  const porEvaluar = cambios.filter((c) => c.estatus === 'solicitado').length
  const porVerificar = cambios.filter((c) => c.estatus === 'implementado').length

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/gestion-cambios">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[16px] font-medium text-by-gray-dark">Gestión de cambios</p>
            <p className="text-[12.5px] text-by-gray">Todo cambio se pide aquí, se evalúa y se cierra cuando se comprueba que funcionó. Cada cambio pasa por: solicitado, aprobado, implementado y cerrado.</p>
          </div>
          {quien.rol === 'coordinador_sgi' && (porEvaluar > 0 || porVerificar > 0) && (
            <p className="text-[12px] text-by-gray">
              {porEvaluar > 0 && <span className="mr-3 font-medium text-amber-700">{porEvaluar} por evaluar</span>}
              {porVerificar > 0 && <span className="font-medium text-violet-700">{porVerificar} por verificar</span>}
            </p>
          )}
        </div>

        <SolicitarCambioForm />

        <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-black/5 text-left text-[11px] uppercase tracking-wide text-by-gray">
                <th className="px-3 py-2">Folio</th>
                <th className="px-3 py-2">Cambio</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Nave</th>
                <th className="px-3 py-2">Riesgo</th>
                <th className="px-3 py-2">Responsable</th>
                <th className="px-3 py-2">Fecha planeada</th>
                <th className="px-3 py-2">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {cambios.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-by-gray">Todavía no hay cambios registrados.</td>
                </tr>
              )}
              {cambios.map((c) => {
                const est = ESTATUS_CAMBIO[c.estatus as string]
                const resp = (c.responsable as unknown as { nombre: string } | null)?.nombre
                return (
                  <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/gestion-cambios/${c.id}`} className="text-by-primary hover:underline">{c.folio}</Link>
                    </td>
                    <td className="px-3 py-2">
                      {c.titulo}
                      {c.afecta_inocuidad && <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700">Inocuidad</span>}
                    </td>
                    <td className="px-3 py-2">{TIPOS_CAMBIO[c.tipo as string] ?? c.tipo}</td>
                    <td className="px-3 py-2">{c.nave ?? '—'}</td>
                    <td className="px-3 py-2">{c.riesgo_nivel ? RIESGO_CAMBIO[c.riesgo_nivel as string] : 'Sin evaluar'}</td>
                    <td className="px-3 py-2">{resp ?? '—'}</td>
                    <td className="px-3 py-2">
                      {c.fecha_planeada ? new Date(c.fecha_planeada + 'T12:00:00').toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + (est?.clase ?? '')}>{est?.label ?? c.estatus}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
