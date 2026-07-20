import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import RegistrarQuejaForm from './RegistrarQuejaForm'
import QuejasTabla from './QuejasTabla'

const ROLES_GESTION = ['coordinador_sgi']

export default async function QuejasPage() {
  const quien = await requerirUsuario()
  const puedeGestionar = ROLES_GESTION.includes(quien.rol)
  const supabase = await createClient()

  const [{ data: quejasData }, { data: usuarios }] = await Promise.all([
    supabase
      .from('quejas')
      .select(
        'id, folio, tipo, criticidad, nombre_cliente, correo_cliente, tipo_queja, servicio, descripcion, escalada_ac, justificacion_ia, estatus, evidencia_cierre, correccion, respuesta_cliente, fecha_limite, fecha_cierre, creado_en, usuario_responsable_id, responsable:usuarios!quejas_usuario_responsable_id_fkey(nombre)'
      )
      .order('creado_en', { ascending: false }),
    supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre'),
  ])

  const quejas = (quejasData ?? []).map((q) => ({
    id: q.id as string,
    folio: q.folio as string | null,
    tipo: q.tipo as string | null,
    criticidad: q.criticidad as string | null,
    nombre_cliente: q.nombre_cliente as string,
    correo_cliente: q.correo_cliente as string | null,
    tipo_queja: q.tipo_queja as string,
    servicio: q.servicio as string,
    descripcion: q.descripcion as string,
    escalada_ac: q.escalada_ac as boolean,
    justificacion_ia: q.justificacion_ia as string | null,
    estatus: q.estatus as string,
    evidencia_cierre: q.evidencia_cierre as string | null,
    correccion: q.correccion as string | null,
    respuesta_cliente: q.respuesta_cliente as string | null,
    fecha_limite: q.fecha_limite as string | null,
    fecha_cierre: q.fecha_cierre as string | null,
    creado_en: q.creado_en as string,
    responsable_id: q.usuario_responsable_id as string | null,
    responsable_nombre:
      (q.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }))

  return (
    <AppShell
      nombre={quien.nombre}
      rol={quien.rol}
      usuarioId={quien.id}
      activo="/quejas"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] font-medium text-by-gray-dark">Quejas</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/quejas/dashboard"
              className="h-8 rounded-md bg-by-primary px-3 text-[12px] font-medium leading-8 text-white transition hover:bg-by-primary-dark"
            >
              Ver Dashboard
            </Link>
            <a
              href="/quejas/exportar/excel"
              className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
            >
              Exportar Excel
            </a>
            <a
              href="/quejas/exportar/pdf"
              className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
            >
              Exportar PDF
            </a>
          </div>
        </div>

        {puedeGestionar && <RegistrarQuejaForm usuarios={usuarios ?? []} />}
        <QuejasTabla
          quejas={quejas}
          usuarioActualId={quien.id}
          esCoordinador={quien.rol === 'coordinador_sgi'}
        />
      </div>
    </AppShell>
  )
}
