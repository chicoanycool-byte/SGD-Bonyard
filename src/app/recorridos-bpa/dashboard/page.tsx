import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardBpa from './DashboardBpa'

export default async function DashboardBpaPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('bpa_respuestas')
    .select(
      'respuesta, estatus, fecha_compromiso, fecha_cierre_real, checklist:bpa_checklist(area, nivel_riesgo), recorrido:bpa_recorridos(fecha, naves_inspeccionadas)'
    )

  const hallazgos = (data ?? []).map((h) => {
    const checklist = h.checklist as unknown as { area: string | null; nivel_riesgo: string | null } | null
    const recorrido = h.recorrido as unknown as { fecha: string; naves_inspeccionadas: string | null } | null
    return {
      area: checklist?.area ?? null,
      nivel_riesgo: checklist?.nivel_riesgo ?? null,
      respuesta: h.respuesta as string | null,
      estatus: h.estatus as string,
      fecha_compromiso: h.fecha_compromiso as string | null,
      fecha_cierre_real: h.fecha_cierre_real as string | null,
      recorrido_fecha: recorrido?.fecha ?? '',
      nave: recorrido?.naves_inspeccionadas ?? null,
    }
  })

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/recorridos-bpa"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Dashboard de Recorridos BPA</p>
        <Link
          href="/recorridos-bpa"
          className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
        >
          ← Volver
        </Link>
      </div>
      <DashboardBpa hallazgos={hallazgos} />
    </AppShell>
  )
}
