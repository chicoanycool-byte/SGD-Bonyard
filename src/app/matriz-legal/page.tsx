import Link from 'next/link'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import MatrizLegalTabla from './MatrizLegalTabla'

const ROLES_GESTION = ['coordinador_sgi']

export default async function MatrizLegalPage() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') redirect('/matriz-legal/plan-accion')
  const puedeEditar = ROLES_GESTION.includes(quien.rol)
  const supabase = await createClient()

  const { data: filas } = await supabase.from('matriz_legal').select('*').order('numero')

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/matriz-legal"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-by-gray-dark">
            Matriz de Requisitos Legales (FSG-19)
          </p>
          <div className="flex gap-2">
            <Link
              href="/matriz-legal/indicadores"
              className="h-8 rounded-md bg-by-primary px-3 text-[12px] font-medium leading-8 text-white transition hover:bg-by-primary-dark"
            >
              Ver Indicador
            </Link>
            <Link
              href="/matriz-legal/plan-accion"
              className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
            >
              Plan de Acción
            </Link>
          </div>
        </div>

        <MatrizLegalTabla
          filas={filas ?? []}
          puedeEditar={puedeEditar}
          esCoordinador={quien.rol === 'coordinador_sgi'}
        />
      </div>
    </AppShell>
  )
}
