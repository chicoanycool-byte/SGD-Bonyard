import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardVerificacion from './DashboardVerificacion'

export default async function DashboardVerificacionPage() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') redirect('/inicio')
  const supabase = await createClient()

  const { data } = await supabase
    .from('verificacion_respuestas')
    .select(
      'respuesta, estatus, fecha_compromiso, fecha_cierre_real, checklist:verificacion_checklist(bloque), verificacion:verificaciones(fecha)'
    )

  const hallazgos = (data ?? []).map((h) => {
    const checklist = h.checklist as unknown as { bloque: string | null } | null
    const verificacion = h.verificacion as unknown as { fecha: string } | null
    return {
      bloque: checklist?.bloque ?? null,
      respuesta: h.respuesta as string | null,
      estatus: h.estatus as string,
      fecha_compromiso: h.fecha_compromiso as string | null,
      fecha_cierre_real: h.fecha_cierre_real as string | null,
      verificacion_fecha: verificacion?.fecha ?? '',
    }
  })

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/verificacion-sgi">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Dashboard de Verificación del SGI</p>
        <Link
          href="/verificacion-sgi"
          className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
        >
          ← Volver
        </Link>
      </div>
      <DashboardVerificacion hallazgos={hallazgos} />
    </AppShell>
  )
}
