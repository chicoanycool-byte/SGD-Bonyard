import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import NuevaVerificacionForm from './NuevaVerificacionForm'

export default async function VerificacionSgiPage() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') redirect('/inicio')
  const supabase = await createClient()

  const { data } = await supabase
    .from('verificaciones')
    .select(
      'id, numero, fecha, periodo_evaluado, area_proceso, estatus, aplicado_por:usuarios!verificaciones_aplicado_por_id_fkey(nombre)'
    )
    .order('fecha', { ascending: false })

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/verificacion-sgi">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-by-gray-dark">Verificación del SGI</p>
          <div className="flex gap-2">
            <Link
              href="/verificacion-sgi/dashboard"
              className="h-8 rounded-md bg-by-primary px-3 text-[12px] font-medium leading-8 text-white transition hover:bg-by-primary-dark"
            >
              Ver Dashboard
            </Link>
            <a
              href="/verificacion-sgi/exportar/excel"
              className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
            >
              Exportar Excel
            </a>
            <a
              href="/verificacion-sgi/exportar/pdf"
              className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
            >
              Exportar PDF
            </a>
          </div>
        </div>

        <NuevaVerificacionForm />

        <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
                <th className="px-4 py-2 font-normal">No.</th>
                <th className="px-4 py-2 font-normal">Fecha</th>
                <th className="px-4 py-2 font-normal">Período evaluado</th>
                <th className="px-4 py-2 font-normal">Área / Proceso</th>
                <th className="px-4 py-2 font-normal">Aplicado por</th>
                <th className="px-4 py-2 font-normal">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((v) => (
                <tr key={v.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-2 text-by-gray-dark">
                    <Link href={`/verificacion-sgi/${v.id}`} className="hover:underline">
                      {v.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {new Date(v.fecha + 'T00:00:00').toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">{v.periodo_evaluado ?? '—'}</td>
                  <td className="px-4 py-2 text-by-gray-light">{v.area_proceso ?? '—'}</td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {(v.aplicado_por as unknown as { nombre: string } | null)?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-[11px] ' +
                        (v.estatus === 'cerrada'
                          ? 'bg-[#eaf5f0] text-[#3d6b53]'
                          : 'bg-[#e6f0fa] text-[#2d5f8a]')
                      }
                    >
                      {v.estatus === 'cerrada' ? 'Cerrada' : 'En proceso'}
                    </span>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                    No hay verificaciones registradas.
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
