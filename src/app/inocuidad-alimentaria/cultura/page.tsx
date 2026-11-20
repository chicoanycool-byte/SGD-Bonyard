import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import CulturaClient from './CulturaClient'

export default async function CulturaPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const esCoordinador = quien.rol === 'coordinador_sgi'

  const [{ data: objetivos }, { data: evaluaciones }, { data: usuarios }] = await Promise.all([
    supabase
      .from('cultura_objetivos')
      .select('id, elemento, objetivo, indicador, meta, fecha_limite, avance, estatus, responsable:usuarios!cultura_objetivos_responsable_id_fkey(nombre)')
      .order('creado_en', { ascending: true }),
    supabase
      .from('cultura_evaluaciones')
      .select('id, fecha, metodo, nave, participantes, resultado_pct, conclusiones, acciones')
      .order('fecha', { ascending: false }),
    esCoordinador
      ? supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre')
      : Promise.resolve({ data: [] as { id: string; nombre: string }[] }),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/inocuidad-alimentaria/cultura">
      <CulturaClient
        esCoordinador={esCoordinador}
        usuarios={usuarios ?? []}
        objetivos={(objetivos ?? []).map((o) => ({
          id: o.id as string,
          elemento: o.elemento as string,
          objetivo: o.objetivo as string,
          indicador: o.indicador as string,
          meta: o.meta as string,
          fecha_limite: o.fecha_limite as string | null,
          avance: o.avance as string | null,
          estatus: o.estatus as string,
          responsable: (o.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
        }))}
        evaluaciones={(evaluaciones ?? []).map((e) => ({
          id: e.id as string,
          fecha: e.fecha as string,
          metodo: e.metodo as string,
          nave: e.nave as string | null,
          participantes: e.participantes as number | null,
          resultado_pct: e.resultado_pct as number | null,
          conclusiones: e.conclusiones as string,
          acciones: e.acciones as string | null,
        }))}
      />
    </AppShell>
  )
}
