import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import RecursosHumanosClient from './RecursosHumanosClient'

export default async function RecursosHumanosPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: organigrama }, { data: descriptivos }, { data: puestos }] = await Promise.all([
    supabase
      .from('rrhh_documentos')
      .select('id, nombre_archivo, storage_path, actualizado_en')
      .eq('tipo', 'organigrama')
      .maybeSingle(),
    supabase.rpc('listar_descriptivos_visibles'),
    quien.rol === 'coordinador_sgi'
      ? supabase.from('puestos').select('id, nombre, area').order('nombre')
      : Promise.resolve({ data: null }),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/recursos-humanos">
      <RecursosHumanosClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        organigrama={organigrama ?? null}
        descriptivos={descriptivos ?? []}
        puestos={puestos ?? []}
      />
    </AppShell>
  )
}
