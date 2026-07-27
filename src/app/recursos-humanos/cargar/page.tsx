import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import CargarDocumentosClient from './CargarDocumentosClient'

export default async function CargarDocumentosPage() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') {
    redirect('/inicio')
  }

  const supabase = await createClient()
  const [{ data: organigrama }, { data: descriptivos }, { data: puestos }] = await Promise.all([
    supabase
      .from('rrhh_documentos')
      .select('id, nombre_archivo, storage_path, actualizado_en')
      .eq('tipo', 'organigrama')
      .maybeSingle(),
    supabase
      .from('rrhh_documentos')
      .select('id, puesto_id, nombre_archivo, storage_path, actualizado_en, puestos(nombre)')
      .eq('tipo', 'descriptivo_puesto')
      .order('actualizado_en', { ascending: false }),
    supabase.from('puestos').select('id, nombre').order('nombre'),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/recursos-humanos/cargar">
      <CargarDocumentosClient
        organigrama={organigrama ?? null}
        descriptivos={(descriptivos ?? []).map((d) => ({
          id: d.id,
          puesto_id: d.puesto_id as string,
          puesto_nombre: (d.puestos as unknown as { nombre: string } | null)?.nombre ?? '—',
          nombre_archivo: d.nombre_archivo,
          storage_path: d.storage_path,
          actualizado_en: d.actualizado_en,
        }))}
        puestos={puestos ?? []}
      />
    </AppShell>
  )
}
