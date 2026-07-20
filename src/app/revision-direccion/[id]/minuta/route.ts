import { NextResponse } from 'next/server'
import { Packer } from 'docx'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { generarMinutaDocx } from '@/lib/reuniones/minuta'
import type { Acuerdo } from '@/lib/reuniones/actions'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('reuniones_sgi')
    .select(
      'tipo, fecha, hora, lugar, link_virtual, invitados, agenda, asistentes, desarrollo, conclusiones, acuerdos, convocante:usuarios!reuniones_sgi_convocante_id_fkey(nombre)'
    )
    .eq('id', id)
    .single()

  if (!data) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  const invitadosIds = (data.invitados ?? []) as string[]
  const { data: usuariosInvitados } = await supabase
    .from('usuarios')
    .select('id, nombre, puesto')
    .in('id', invitadosIds.length > 0 ? invitadosIds : ['00000000-0000-0000-0000-000000000000'])

  const doc = generarMinutaDocx({
    tipo: data.tipo as string,
    fecha: data.fecha as string,
    hora: data.hora as string | null,
    lugar: data.lugar as string | null,
    linkVirtual: data.link_virtual as string | null,
    convocanteNombre: (data.convocante as unknown as { nombre: string } | null)?.nombre ?? null,
    invitados: (usuariosInvitados ?? []).map((u) => ({ nombre: u.nombre as string, puesto: u.puesto as string | null })),
    asistentes: data.asistentes as string | null,
    agenda: data.agenda as string | null,
    desarrollo: data.desarrollo as string | null,
    conclusiones: data.conclusiones as string | null,
    acuerdos: (data.acuerdos ?? []) as Acuerdo[],
  })

  const buffer = await Packer.toBuffer(doc)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="Minuta_revision_direccion_${data.fecha}.docx"`,
    },
  })
}
