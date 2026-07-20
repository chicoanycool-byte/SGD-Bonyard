import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ProgramarAuditoriaForm from './ProgramarAuditoriaForm'
import ProgramaAuditorias from './ProgramaAuditorias'

export default async function AuditoriasPage() {
  const quien = await requerirUsuario()
  const esCoordinador = quien.rol === 'coordinador_sgi'
  const supabase = await createClient()

  const [{ data: auditoriasData }, { data: usuarios }] = await Promise.all([
    supabase
      .from('auditorias')
      .select(
        'id, fecha, norma, tipo, proceso, cliente_nombre, nave, estatus, auditor_lider:usuarios!auditorias_auditor_lider_id_fkey(nombre), auditado:usuarios!auditorias_auditado_id_fkey(nombre)'
      )
      .order('fecha', { ascending: false }),
    esCoordinador
      ? supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre')
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
  ])

  const auditorias = (auditoriasData ?? []).map((a) => ({
    id: a.id as string,
    fecha: a.fecha as string,
    norma: a.norma as 'iso_9001' | 'sqf',
    tipo: a.tipo as 'interna' | 'cliente',
    proceso: a.proceso as string | null,
    cliente_nombre: a.cliente_nombre as string | null,
    nave: a.nave as string | null,
    estatus: a.estatus as string,
    auditor_lider_nombre:
      (a.auditor_lider as unknown as { nombre: string } | null)?.nombre ?? null,
    auditado_nombre:
      (a.auditado as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/auditorias"
    >
      <div className="flex flex-col gap-4">
        {esCoordinador && <ProgramarAuditoriaForm usuarios={usuarios ?? []} />}
        <ProgramaAuditorias auditorias={auditorias} puedeGestionar={esCoordinador} />
      </div>
    </AppShell>
  )
}
