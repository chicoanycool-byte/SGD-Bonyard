import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PendientesTabla from './PendientesTabla'

const ROLES_VEN_TODO = ['coordinador_sgi', 'gerente', 'director']

// Arma el link de "ir a" según el módulo. Para recorridos_bpa, referencia_id
// es el id de la respuesta (bpa_respuestas), así que hay que resolver a qué
// recorrido pertenece.
function rutaModulo(modulo: string, referenciaId: string | null): string | null {
  switch (modulo) {
    case 'ac_ap':
      return referenciaId ? `/ac-ap/${referenciaId}` : '/ac-ap'
    case 'auditorias':
      return referenciaId ? `/auditorias/${referenciaId}` : '/auditorias'
    case 'solicitudes':
      return '/solicitudes'
    case 'quejas':
      return '/quejas'
    case 'indicadores':
      return '/indicadores'
    case 'proveedores':
      return '/proveedores'
    case 'matriz-legal':
      return '/matriz-legal/plan-accion'
    case 'usuarios':
      return '/usuarios'
    case 'reuniones':
      return null
    default:
      return null
  }
}

export default async function PendientesPage() {
  const quien = await requerirUsuario()
  const veTodo = ROLES_VEN_TODO.includes(quien.rol)
  const supabase = await createClient()

  const { data } = await supabase
    .from('pendientes')
    .select(
      'id, modulo, referencia_id, descripcion, estatus, fecha_limite, creado_en, usuario_id, usuarios!pendientes_usuario_id_fkey(nombre)'
    )
    .order('creado_en', { ascending: false })
    .limit(200)

  // Caso especial: recorridos_bpa guarda el id de la respuesta, hay que
  // resolver a qué recorrido pertenece para armar el link correcto.
  const idsRespuestasBpa = (data ?? [])
    .filter((p) => p.modulo === 'recorridos_bpa' && p.referencia_id)
    .map((p) => p.referencia_id as string)

  let mapaRecorridos: Record<string, string> = {}
  if (idsRespuestasBpa.length > 0) {
    const { data: respuestas } = await supabase
      .from('bpa_respuestas')
      .select('id, recorrido_id')
      .in('id', idsRespuestasBpa)
    mapaRecorridos = Object.fromEntries(
      (respuestas ?? []).map((r) => [r.id as string, r.recorrido_id as string])
    )
  }

  const pendientes = (data ?? []).map((p) => {
    const referenciaId = p.referencia_id as string | null
    let ruta: string | null
    if (p.modulo === 'recorridos_bpa') {
      const recorridoId = referenciaId ? mapaRecorridos[referenciaId] : null
      ruta = recorridoId ? `/recorridos-bpa/${recorridoId}` : '/recorridos-bpa'
    } else {
      ruta = rutaModulo(p.modulo as string, referenciaId)
    }

    return {
      id: p.id as string,
      modulo: p.modulo as string,
      descripcion: p.descripcion as string | null,
      estatus: p.estatus as string,
      fecha_limite: p.fecha_limite as string | null,
      creado_en: p.creado_en as string,
      usuario_id: p.usuario_id as string,
      usuario_nombre:
        (p.usuarios as unknown as { nombre: string } | null)?.nombre ?? null,
      ruta,
    }
  })

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/pendientes"
    >
      <PendientesTabla
        pendientes={pendientes}
        mostrarUsuario={veTodo}
        usuarioActualId={quien.id}
        puedeCerrarTodo={quien.rol === 'coordinador_sgi'}
      />
    </AppShell>
  )
}
