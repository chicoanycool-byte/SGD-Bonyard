import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ObjetivosClient from './ObjetivosClient'

export default async function ObjetivosPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const [{ data: objetivos }, { data: indicadores }, { data: usuarios }, { data: valores }] = await Promise.all([
    supabase
      .from('objetivos_calidad')
      .select(
        'id, descripcion, meta_texto, indicador_id, responsable:usuarios!objetivos_calidad_responsable_id_fkey(nombre), indicador:indicadores_catalogo(id, nombre, meta_operador, meta_valor)'
      )
      .order('creado_en'),
    supabase.from('indicadores_catalogo').select('id, nombre, meta_operador, meta_valor').order('nombre'),
    supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre'),
    supabase.from('indicadores_valores').select('indicador_id, anio, mes, valor').not('valor', 'is', null),
  ])

  // último valor capturado por indicador
  const ultimoValorPorIndicador = new Map<string, number>()
  const ultimaClavePorIndicador = new Map<string, string>()
  for (const v of valores ?? []) {
    const clave = `${v.anio}-${String(v.mes).padStart(2, '0')}`
    const claveActual = ultimaClavePorIndicador.get(v.indicador_id)
    if (!claveActual || clave > claveActual) {
      ultimoValorPorIndicador.set(v.indicador_id, v.valor as number)
      ultimaClavePorIndicador.set(v.indicador_id, clave)
    }
  }

  const objetivosMapeados = (objetivos ?? []).map((o) => ({
    id: o.id as string,
    descripcion: o.descripcion as string,
    meta_texto: o.meta_texto as string | null,
    indicador_nombre: (o.indicador as unknown as { nombre: string } | null)?.nombre ?? null,
    responsable_nombre: (o.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
    meta_operador: (o.indicador as unknown as { meta_operador: string } | null)?.meta_operador ?? null,
    meta_valor: (o.indicador as unknown as { meta_valor: number } | null)?.meta_valor ?? null,
    ultimo_valor: o.indicador_id ? ultimoValorPorIndicador.get(o.indicador_id as string) ?? null : null,
  }))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/direccion/objetivos">
      <ObjetivosClient
        esCoordinador={quien.rol === 'coordinador_sgi'}
        objetivos={objetivosMapeados}
        indicadores={indicadores ?? []}
        usuarios={usuarios ?? []}
      />
    </AppShell>
  )
}
