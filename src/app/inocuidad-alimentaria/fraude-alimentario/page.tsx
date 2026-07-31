import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import FraudeAlimentarioClient from './FraudeAlimentarioClient'

export default async function FraudeAlimentarioPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [
    { data: vulnerabilidad },
    { data: encabezadosVuln },
    { data: productos },
    { data: encabezadoProductos },
    { data: mitigacion },
    { data: encabezadoMitigacion },
  ] = await Promise.all([
    supabase.from('fraude_vulnerabilidad_procesos').select('*').order('nave').order('orden'),
    supabase.from('fraude_vulnerabilidad_encabezado').select('*'),
    supabase.from('fraude_analisis_productos').select('*').order('orden'),
    supabase.from('fraude_analisis_productos_encabezado').select('*').limit(1).maybeSingle(),
    supabase.from('fraude_plan_mitigacion').select('*').order('orden'),
    supabase.from('fraude_plan_mitigacion_encabezado').select('*').limit(1).maybeSingle(),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/inocuidad-alimentaria/fraude-alimentario">
      <FraudeAlimentarioClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        vulnerabilidad={vulnerabilidad ?? []}
        encabezadosVuln={encabezadosVuln ?? []}
        productos={productos ?? []}
        encabezadoProductos={encabezadoProductos ?? null}
        mitigacion={mitigacion ?? []}
        encabezadoMitigacion={encabezadoMitigacion ?? null}
      />
    </AppShell>
  )
}
