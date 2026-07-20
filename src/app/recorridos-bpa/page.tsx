import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import NuevoRecorridoForm from './NuevoRecorridoForm'

const TIPO_LABEL: Record<string, string> = {
  rutinaria: 'Rutinaria',
  extraordinaria: 'Extraordinaria',
  auditoria_interna: 'Auditoría interna',
  pre_auditoria_sqf: 'Pre-auditoría SQF',
}

export default async function RecorridosBpaPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('bpa_recorridos')
    .select(
      'id, fecha, naves_inspeccionadas, tipo_inspeccion, turno, estatus, inspector:usuarios!bpa_recorridos_inspector_id_fkey(nombre)'
    )
    .order('fecha', { ascending: false })

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/recorridos-bpa"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-by-gray-dark">Recorridos BPA</p>
          <div className="flex gap-2">
            <Link
              href="/recorridos-bpa/dashboard"
              className="h-8 rounded-md bg-by-primary px-3 text-[12px] font-medium leading-8 text-white transition hover:bg-by-primary-dark"
            >
              Ver Dashboard
            </Link>
            <a
              href="/recorridos-bpa/exportar/excel"
              className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
            >
              Exportar Excel
            </a>
            <a
              href="/recorridos-bpa/exportar/pdf"
              className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
            >
              Exportar PDF
            </a>
          </div>
        </div>

        {quien.rol === 'coordinador_sgi' && <NuevoRecorridoForm />}

        <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
                <th className="px-4 py-2 font-normal">Fecha</th>
                <th className="px-4 py-2 font-normal">Nave(s)</th>
                <th className="px-4 py-2 font-normal">Tipo</th>
                <th className="px-4 py-2 font-normal">Turno</th>
                <th className="px-4 py-2 font-normal">Inspector</th>
                <th className="px-4 py-2 font-normal">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((r) => (
                <tr key={r.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-2 text-by-gray-dark">
                    <Link href={`/recorridos-bpa/${r.id}`} className="hover:underline">
                      {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-MX')}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">{r.naves_inspeccionadas ?? '—'}</td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {TIPO_LABEL[r.tipo_inspeccion] ?? r.tipo_inspeccion}
                  </td>
                  <td className="px-4 py-2 text-by-gray-light">{r.turno ?? '—'}</td>
                  <td className="px-4 py-2 text-by-gray-light">
                    {(r.inspector as unknown as { nombre: string } | null)?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        'rounded-full px-2 py-0.5 text-[11px] ' +
                        (r.estatus === 'cerrado'
                          ? 'bg-[#eaf5f0] text-[#3d6b53]'
                          : 'bg-[#e6f0fa] text-[#2d5f8a]')
                      }
                    >
                      {r.estatus === 'cerrado' ? 'Cerrado' : 'En proceso'}
                    </span>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                    No hay recorridos registrados.
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
