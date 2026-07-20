import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import SolicitudForm from './SolicitudForm'
import SolicitudesTabla from './SolicitudesTabla'

export default async function SolicitudesPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('solicitudes_documento')
    .select(
      'id, tipo, codigo, nombre, justificacion, descripcion_cambio, estatus, comentario_revision, storage_path, creado_en, solicitado_por, usuarios!solicitudes_documento_solicitado_por_fkey(nombre)'
    )
    .order('creado_en', { ascending: false })

  const solicitudes = (data ?? []).map((s) => ({
    id: s.id as string,
    tipo: s.tipo as 'modificacion' | 'alta',
    codigo: s.codigo as string | null,
    nombre: s.nombre as string,
    justificacion: s.justificacion as string,
    descripcion_cambio: s.descripcion_cambio as string | null,
    estatus: s.estatus as 'pendiente' | 'aprobada' | 'rechazada',
    comentario_revision: s.comentario_revision as string | null,
    storage_path: s.storage_path as string | null,
    creado_en: s.creado_en as string,
    solicitante_nombre:
      (s.usuarios as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/solicitudes">
      <div className="flex flex-col gap-4">
        <SolicitudForm />
        <SolicitudesTabla
          solicitudes={solicitudes}
          esCoordinador={quien.rol === 'coordinador_sgi'}
        />
      </div>
    </AppShell>
  )
}
