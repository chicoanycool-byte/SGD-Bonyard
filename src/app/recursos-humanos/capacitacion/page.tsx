import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { estadoCapacitacion, fechaMX, hoyMX } from '@/lib/capacitacion'
import VistaCapacitacion, { type Item, type PersonaVista } from './VistaCapacitacion'
import BorrarRegistro from './BorrarRegistro'

type Curso = { id: string; codigo: string; nombre: string; norma: string; vigencia_meses: number | null }

export default async function MatrizCapacitacionPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const esCoord = quien.rol === 'coordinador_sgi'
  const hoy = hoyMX()

  const [{ data: usuariosRaw }, { data: cursosRaw }, { data: reqRaw }, { data: regRaw }] = await Promise.all([
    supabase.from('usuarios').select('id, nombre, puesto_id, puesto').eq('estatus', 'activo').order('nombre'),
    supabase.from('capacitacion_cursos').select('id, codigo, nombre, norma, vigencia_meses').eq('activo', true).order('codigo'),
    supabase.from('capacitacion_requisitos').select('puesto_id, curso_id'),
    supabase
      .from('capacitacion_registros')
      .select('id, usuario_id, curso_id, fecha, vigente_hasta, instructor, calificacion, evidencia')
      .order('fecha', { ascending: false }),
  ])

  const cursos = (cursosRaw ?? []) as Curso[]
  const usuarios = (usuariosRaw ?? []).filter((u) => esCoord || u.id === quien.id)
  const requeridos = new Set((reqRaw ?? []).map((r) => `${r.puesto_id}|${r.curso_id}`))
  const registros = regRaw ?? []

  // último registro por persona y curso
  const ultimo = new Map<string, (typeof registros)[number]>()
  for (const r of registros) {
    const k = `${r.usuario_id}|${r.curso_id}`
    if (!ultimo.has(k)) ultimo.set(k, r)
  }

  const personas: PersonaVista[] = usuarios.map((u) => ({
    id: u.id as string,
    nombre: u.nombre as string,
    puesto: (u.puesto as string | null) ?? null,
    items: cursos.flatMap((c): Item[] => {
      const req = u.puesto_id ? requeridos.has(`${u.puesto_id}|${c.id}`) : false
      const reg = ultimo.get(`${u.id}|${c.id}`)
      if (!req && !reg) return []
      return [{
        cursoId: c.id, codigo: c.codigo, nombre: c.nombre, req,
        estado: estadoCapacitacion(reg?.vigente_hasta as string | null, !!reg, hoy),
        vence: (reg?.vigente_hasta as string | null) ?? null,
        ultima: (reg?.fecha as string | null) ?? null,
      }]
    }),
  }))

  const historial = registros.filter((r) => esCoord || r.usuario_id === quien.id).slice(0, 15)
  const nombreUsuario = new Map((usuariosRaw ?? []).map((u) => [u.id as string, u.nombre as string]))
  const cursoPorId = new Map(cursos.map((c) => [c.id, c]))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/recursos-humanos/capacitacion">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] font-medium text-by-gray-dark">
            {esCoord ? 'Capacitación del personal' : 'Mi capacitación'}
          </p>
          {esCoord && (
            <Link href="/recursos-humanos/capacitacion/configuracion" className="text-[12.5px] text-by-primary hover:underline">
              Cursos y requisitos por puesto
            </Link>
          )}
        </div>

        <VistaCapacitacion
          personas={personas}
          cursos={cursos}
          todasLasPersonas={(usuariosRaw ?? []).map((u) => ({ id: u.id as string, nombre: u.nombre as string, puesto: (u.puesto as string | null) ?? null }))}
          esCoord={esCoord}
          hoy={hoy}
        />

        <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
          <p className="px-3 pt-3 text-[13px] font-medium text-by-gray-dark">Últimas capacitaciones registradas</p>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-black/5 text-left text-[11px] uppercase tracking-wide text-by-gray">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Persona</th>
                <th className="px-3 py-2">Curso</th>
                <th className="px-3 py-2">Instructor</th>
                <th className="px-3 py-2">Calif.</th>
                <th className="px-3 py-2">Vence</th>
                {esCoord && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-by-gray">Todavía no hay capacitaciones registradas.</td></tr>
              )}
              {historial.map((r) => {
                const c = cursoPorId.get(r.curso_id as string)
                return (
                  <tr key={r.id} className="border-b border-black/5 last:border-0">
                    <td className="px-3 py-2">{fechaMX(r.fecha as string)}</td>
                    <td className="px-3 py-2">{nombreUsuario.get(r.usuario_id as string) ?? '—'}</td>
                    <td className="px-3 py-2">{c ? `${c.codigo} ${c.nombre}` : '—'}</td>
                    <td className="px-3 py-2">{r.instructor ?? '—'}</td>
                    <td className="px-3 py-2">{r.calificacion ?? '—'}</td>
                    <td className="px-3 py-2">{fechaMX(r.vigente_hasta as string)}</td>
                    {esCoord && <td className="px-3 py-2 text-right"><BorrarRegistro id={r.id as string} /></td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
