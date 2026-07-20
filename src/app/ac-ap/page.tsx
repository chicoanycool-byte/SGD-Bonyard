import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import AcApTabla from './AcApTabla'
import NuevaAccionManualForm from './NuevaAccionManualForm'

export default async function AcApPage() {
  const quien = await requerirUsuario()
  const esCoordinador = quien.rol === 'coordinador_sgi'
  const supabase = await createClient()

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('id, nombre')
    .eq('estatus', 'activo')
    .order('nombre')

  let consulta = supabase
    .from('acciones_correctivas')
    .select(
      'id, folio, tipo_accion, descripcion, tipo_nc, estatus, fecha_compromiso, creado_en, fecha_cierre, responsable_id, responsable:usuarios!acciones_correctivas_responsable_id_fkey(nombre)'
    )
    .order('creado_en', { ascending: false })

  // Los roles distintos a Coordinador SGI solo ven las AC/AP que tienen asignadas
  if (!esCoordinador) {
    consulta = consulta.eq('responsable_id', quien.id)
  }

  const { data } = await consulta

  const acciones = (data ?? []).map((a) => ({
    id: a.id as string,
    folio: a.folio as string | null,
    tipo_accion: a.tipo_accion as string,
    descripcion: a.descripcion as string,
    tipo_nc: a.tipo_nc as string | null,
    estatus: a.estatus as string,
    fecha_compromiso: a.fecha_compromiso as string | null,
    creado_en: a.creado_en as string,
    fecha_cierre: a.fecha_cierre as string | null,
    responsable_nombre:
      (a.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/ac-ap"
    >
      {esCoordinador && <NuevaAccionManualForm usuarios={usuarios ?? []} />}
      <AcApTabla acciones={acciones} esCoordinador={esCoordinador} />
    </AppShell>
  )
}
