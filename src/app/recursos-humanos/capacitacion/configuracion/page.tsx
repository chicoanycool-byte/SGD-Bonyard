import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ConfiguracionClient from './ConfiguracionClient'

export default async function ConfiguracionCapacitacionPage() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') redirect('/recursos-humanos/capacitacion')
  const supabase = await createClient()

  const [{ data: cursos }, { data: puestos }, { data: req }] = await Promise.all([
    supabase.from('capacitacion_cursos').select('id, codigo, nombre, norma, clausula, vigencia_meses, activo').order('codigo'),
    supabase.from('puestos').select('id, nombre, area').order('area').order('nombre'),
    supabase.from('capacitacion_requisitos').select('puesto_id, curso_id'),
  ])

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/recursos-humanos/capacitacion">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-by-gray-dark">Cursos y requisitos por puesto</p>
          <Link href="/recursos-humanos/capacitacion" className="text-[12.5px] text-by-primary hover:underline">Volver</Link>
        </div>
        <p className="text-[12.5px] text-by-gray">
          Aquí defines qué cursos existen, cada cuántos meses se renuevan y qué puesto los necesita. Con eso la pantalla de capacitación sabe quién está al día y a quién avisarle.
        </p>
        <ConfiguracionClient
          cursos={(cursos ?? []) as never}
          puestos={(puestos ?? []) as never}
          requisitos={(req ?? []).map((r) => `${r.puesto_id}|${r.curso_id}`)}
        />
      </div>
    </AppShell>
  )
}
