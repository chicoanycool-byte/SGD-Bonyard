import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import EvaluacionInicialClient from './EvaluacionInicialClient'

export default async function EvaluacionInicialPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: evaluaciones }, { data: proveedores }] = await Promise.all([
    supabase
      .from('proveedor_evaluacion_inicial')
      .select('*, aprobador:usuarios!proveedor_evaluacion_inicial_aprobado_por_fkey(nombre)')
      .order('creado_en', { ascending: false }),
    supabase.from('proveedores').select('id, nombre').order('nombre'),
  ])

  const mapeadas = (evaluaciones ?? []).map((e) => ({
    ...e,
    aprobador_nombre: (e.aprobador as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/proveedores/evaluacion-inicial">
      <EvaluacionInicialClient
        puedeGestionar={quien.rol === 'coordinador_sgi' || quien.rol === 'jefe'}
        evaluaciones={mapeadas}
        proveedores={proveedores ?? []}
      />
    </AppShell>
  )
}
