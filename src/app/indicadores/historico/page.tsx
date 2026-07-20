import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import HistoricoIndicadores from './HistoricoIndicadores'

export default async function HistoricoIndicadoresPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const anio = new Date().getFullYear()

  const [{ data: catalogo }, { data: valoresData }] = await Promise.all([
    supabase
      .from('indicadores_catalogo')
      .select('id, numero, proceso, nombre, meta_texto, meta_operador, meta_valor')
      .order('numero'),
    supabase
      .from('indicadores_valores')
      .select('indicador_id, mes, valor')
      .eq('anio', anio),
  ])

  const indicadores = (catalogo ?? []).map((i) => ({
    id: i.id as string,
    numero: i.numero as number,
    proceso: i.proceso as string,
    nombre: i.nombre as string,
    meta_texto: i.meta_texto as string,
    meta_operador: i.meta_operador as string,
    meta_valor: Number(i.meta_valor),
  }))

  const valores = (valoresData ?? []).map((v) => ({
    indicador_id: v.indicador_id as string,
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
          Histórico anual de indicadores
        </p>
        <Link
          href="/indicadores"
          className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
        >
          ← Volver
        </Link>
      </div>
      <HistoricoIndicadores indicadores={indicadores} valores={valores} anioInicial={anio} />
    </AppShell>
  )
}
