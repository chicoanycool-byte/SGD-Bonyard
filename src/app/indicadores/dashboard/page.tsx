import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardIndicadores from './DashboardIndicadores'

export default async function DashboardIndicadoresPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: catalogo }, { data: valoresData }] = await Promise.all([
    supabase
      .from('indicadores_catalogo')
      .select(
        'id, proceso, nombre, meta_texto, meta_operador, meta_valor, periodo, responsable:usuarios!indicadores_catalogo_responsable_id_fkey(nombre)'
      )
      .order('numero'),
    supabase.from('indicadores_valores').select('indicador_id, anio, mes, valor'),
  ])

  const indicadores = (catalogo ?? []).map((i) => ({
    id: i.id as string,
    proceso: i.proceso as string,
    nombre: i.nombre as string,
    meta_texto: i.meta_texto as string,
    meta_operador: i.meta_operador as string,
    meta_valor: Number(i.meta_valor),
    periodo: i.periodo as string,
    responsable_nombre:
      (i.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  const valores = (valoresData ?? []).map((v) => ({
    indicador_id: v.indicador_id as string,
    anio: v.anio as number,
    mes: v.mes as number,
    valor: v.valor === null ? null : Number(v.valor),
  }))

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/indicadores"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Dashboard de Indicadores
        </p>
        <div className="flex gap-2">
          <a
            href="/indicadores/exportar/pdf"
            className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
          >
            Exportar PDF
          </a>
          <Link
            href="/indicadores"
            className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
          >
            ← Volver
          </Link>
        </div>
      </div>
      <DashboardIndicadores indicadores={indicadores} valores={valores} anio={new Date().getFullYear()} />
    </AppShell>
  )
}
