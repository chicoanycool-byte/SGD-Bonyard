import AppShell from '@/components/AppShell'
import DocumentoInstitucionalVista from '@/components/DocumentoInstitucionalVista'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function PoliticaCalidadPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const { data: documento } = await supabase
    .from('documentos_institucionales')
    .select('nombre_archivo, storage_path, actualizado_en')
    .eq('tipo', 'politica_calidad')
    .maybeSingle()

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/politica-calidad">
      <DocumentoInstitucionalVista
        titulo="Política de Calidad e Inocuidad"
        tipo="politica_calidad"
        documento={documento ?? null}
        esCoordinador={quien.rol === 'coordinador_sgi'}
      />
    </AppShell>
  )
}
