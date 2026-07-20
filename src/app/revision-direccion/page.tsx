import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import NuevaReunionForm from '@/lib/reuniones/NuevaReunionForm'
import ListaReuniones from '@/lib/reuniones/ListaReuniones'

const ROLES_GESTION = ['coordinador_sgi']

export default async function Pagina() {
  const quien = await requerirUsuario()
  const puedeGestionar = ROLES_GESTION.includes(quien.rol)
  const supabase = await createClient()

  const [{ data }, { data: usuarios }] = await Promise.all([
    supabase
      .from('reuniones_sgi')
      .select('id, fecha, hora, lugar, estatus, convocante:usuarios!reuniones_sgi_convocante_id_fkey(nombre)')
      .eq('tipo', 'revision_direccion')
      .order('fecha', { ascending: false }),
    supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre'),
  ])

  const reuniones = (data ?? []).map((r) => ({
    id: r.id as string,
    fecha: r.fecha as string,
    hora: r.hora as string | null,
    lugar: r.lugar as string | null,
    estatus: r.estatus as string,
    convocante_nombre: (r.convocante as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/revision-direccion">
      <div className="flex flex-col gap-4">
        <p className="text-[14px] font-medium text-by-gray-dark">Revisión por la Dirección</p>
        {puedeGestionar && (
          <NuevaReunionForm tipo="revision_direccion" ruta="/revision-direccion" titulo="Programar revisión por la dirección" usuarios={usuarios ?? []} />
        )}
        <ListaReuniones reuniones={reuniones} ruta="/revision-direccion" />
      </div>
    </AppShell>
  )
}
