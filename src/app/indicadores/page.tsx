import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import TableroIndicadores from './TableroIndicadores'

export default async function IndicadoresPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const ahora = new Date()

  const [{ data: catalogo }, { data: valoresData }, { data: usuarios }] = await Promise.all([
    supabase.from('indicadores_catalogo').select('*').order('numero'),
    supabase
      .from('indicadores_valores')
      .select(
        'id, indicador_id, anio, mes, valor, comentario, requiere_ac, comentario_ia, accion_correctiva_id'
      )
      .eq('anio', ahora.getFullYear()),
    supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre'),
  ])

  const indicadores = (catalogo ?? []).map((i) => ({
    id: i.id as string,
    numero: i.numero as number,
    proceso: i.proceso as string,
    nombre: i.nombre as string,
    unidad: i.unidad as string,
    meta_texto: i.meta_texto as string,
    meta_operador: i.meta_operador as string,
    meta_valor: Number(i.meta_valor),
    periodo: i.periodo as string,
    responsable_puesto: i.responsable_puesto as string | null,
    responsable_id: i.responsable_id as string | null,
    meses_activos: (i.meses_activos ?? []) as string[],
  }))

  const valores = (valoresData ?? []).map((v) => ({
    id: v.id as string,
    indicador_id: v.indicador_id as string,
    anio: v.anio as number,
    mes: v.mes as number,
    valor: v.valor === null ? null : Number(v.valor),
    comentario: v.comentario as string | null,
    requiere_ac: v.requiere_ac as boolean,
    comentario_ia: v.comentario_ia as string | null,
    accion_correctiva_id: v.accion_correctiva_id as string | null,
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
          Tablero de Indicadores (FSG-06)
        </p>
        <div className="flex gap-2">
          <Link
            href="/indicadores/historico"
            className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
          >
            Ver histórico
          </Link>
          <Link
            href="/indicadores/dashboard"
            className="h-8 rounded-md bg-by-primary px-3 text-[12px] font-medium leading-8 text-white transition hover:bg-by-primary-dark"
          >
            Ver Dashboard
          </Link>
          <a
            href="/indicadores/exportar/excel"
            className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
          >
            Exportar Excel
          </a>
          <a
            href="/indicadores/exportar/pdf"
            className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
          >
            Exportar PDF
          </a>
        </div>
      </div>
      <TableroIndicadores
        indicadores={indicadores}
        valores={valores}
        usuarios={usuarios ?? []}
        esCoordinador={quien.rol === 'coordinador_sgi'}
        usuarioActualId={quien.id}
        anioInicial={ahora.getFullYear()}
        mesInicial={ahora.getMonth() + 1}
      />
    </AppShell>
  )
}
