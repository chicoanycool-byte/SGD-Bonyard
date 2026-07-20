import { notFound } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DetalleReunion from '@/lib/reuniones/DetalleReunion'
import type { Acuerdo } from '@/lib/reuniones/actions'

const ROLES_GESTION = ['coordinador_sgi']

export default async function DetallePagina({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data }, { data: usuarios }] = await Promise.all([
    supabase
      .from('reuniones_sgi')
      .select(
        'id, fecha, hora, lugar, link_virtual, invitados, agenda, asistentes, desarrollo, conclusiones, acuerdos, estatus, convocante:usuarios!reuniones_sgi_convocante_id_fkey(nombre)'
      )
      .eq('id', id)
      .single(),
    supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre'),
  ])

  if (!data) notFound()

  const reunion = {
    id: data.id as string,
    fecha: data.fecha as string,
    hora: data.hora as string | null,
    lugar: data.lugar as string | null,
    link_virtual: data.link_virtual as string | null,
    invitados: (data.invitados ?? []) as string[],
    agenda: data.agenda as string | null,
    asistentes: data.asistentes as string | null,
    desarrollo: data.desarrollo as string | null,
    conclusiones: data.conclusiones as string | null,
    acuerdos: (data.acuerdos ?? []) as Acuerdo[],
    estatus: data.estatus as string,
    convocante_nombre: (data.convocante as unknown as { nombre: string } | null)?.nombre ?? null,
  }

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/reunion-haccp">
      <DetalleReunion
        reunion={reunion}
        ruta="/reunion-haccp"
        puedeEditar={ROLES_GESTION.includes(quien.rol)}
        usuarios={usuarios ?? []}
        usuarioActualId={quien.id}
      />
    </AppShell>
  )
}
