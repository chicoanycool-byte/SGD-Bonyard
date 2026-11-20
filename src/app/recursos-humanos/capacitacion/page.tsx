import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ESTADO_CAP, estadoCapacitacion, fechaMX, hoyMX } from '@/lib/capacitacion'
import RegistrarCapacitacionForm from './RegistrarCapacitacionForm'
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

  let cumplidos = 0, porVencer = 0, vencidos = 0, pendientes = 0
  const filas = usuarios.map((u) => {
    const celdas = cursos.map((c) => {
      const req = u.puesto_id ? requeridos.has(`${u.puesto_id}|${c.id}`) : false
      const reg = ultimo.get(`${u.id}|${c.id}`)
      if (!req && !reg) return { req, reg, estado: null as null }
      const estado = estadoCapacitacion(reg?.vigente_hasta as string | null, !!reg, hoy)
      if (req) {
        if (estado === 'vencido') vencidos++
        else if (estado === 'pendiente') pendientes++
        else if (estado === 'por_vencer') porVencer++
        else cumplidos++
      }
      return { req, reg, estado }
    })
    return { u, celdas }
  })
  const totalReq = cumplidos + porVencer + vencidos + pendientes
  const pct = totalReq ? Math.round(((cumplidos + porVencer) / totalReq) * 100) : 0

  const historial = registros.filter((r) => esCoord || r.usuario_id === quien.id).slice(0, 15)
  const nombreUsuario = new Map((usuariosRaw ?? []).map((u) => [u.id as string, u.nombre as string]))
  const cursoPorId = new Map(cursos.map((c) => [c.id, c]))

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/recursos-humanos/capacitacion">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] font-medium text-by-gray-dark">
            {esCoord ? 'Matriz de capacitación' : 'Mi capacitación'}
          </p>
          {esCoord && (
            <Link href="/recursos-humanos/capacitacion/configuracion" className="text-[12.5px] text-by-primary hover:underline">
              Cursos y requisitos por puesto
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ['Cumplimiento', `${pct} %`, 'text-by-gray-dark'],
            ['Vigentes', cumplidos, 'text-emerald-700'],
            ['Por vencer (30 días)', porVencer, 'text-amber-700'],
            ['Vencidas', vencidos, 'text-red-700'],
            ['Sin registro', pendientes, 'text-gray-600'],
          ].map(([t, v, c]) => (
            <div key={t as string} className="rounded-xl border border-black/5 bg-white p-3">
              <p className="text-[11px] text-by-gray">{t}</p>
              <p className={'text-[20px] font-semibold ' + c}>{v}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-black/5 text-left text-[11px] text-by-gray">
                <th className="sticky left-0 bg-white px-3 py-2">Persona</th>
                {cursos.map((c) => (
                  <th key={c.id} className="px-2 py-2 align-bottom" title={`${c.codigo} ${c.nombre}`}>
                    <span className="block font-medium text-by-gray-dark">{c.codigo}</span>
                    <span className="block max-w-[110px] truncate font-normal">{c.nombre}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.length === 0 && (
                <tr><td colSpan={cursos.length + 1} className="px-3 py-6 text-center text-by-gray">No hay personas para mostrar.</td></tr>
              )}
              {filas.map(({ u, celdas }) => (
                <tr key={u.id} className="border-b border-black/5 last:border-0">
                  <td className="sticky left-0 bg-white px-3 py-2">
                    <span className="font-medium text-by-gray-dark">{u.nombre}</span>
                    <span className="block text-[11px] text-by-gray">{u.puesto ?? 'Sin puesto'}</span>
                  </td>
                  {celdas.map((c, i) => (
                    <td key={cursos[i].id} className="px-2 py-2">
                      {c.estado ? (
                        <span
                          title={c.reg ? `Última: ${fechaMX(c.reg.fecha as string)} · vence: ${fechaMX(c.reg.vigente_hasta as string)}` : 'Requerido, sin registro'}
                          className={'inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-medium ' + ESTADO_CAP[c.estado].clase + (c.req ? '' : ' opacity-60')}
                        >
                          {c.estado === 'pendiente' ? 'Falta' : c.reg?.vigente_hasta ? fechaMX(c.reg.vigente_hasta as string) : ESTADO_CAP[c.estado].label}
                        </span>
                      ) : (
                        <span className="text-black/20">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-black/5 px-3 py-2 text-[11px] text-by-gray">
            La fecha es el vencimiento. Se muestran los cursos que el puesto requiere y los que la persona ya tomó aunque no sean requisito (más tenues).
          </p>
        </div>

        {esCoord && (
          <RegistrarCapacitacionForm
            usuarios={(usuariosRaw ?? []).map((u) => ({ id: u.id as string, nombre: u.nombre as string }))}
            cursos={cursos}
          />
        )}

        <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
          <p className="px-3 pt-3 text-[13px] font-medium text-by-gray-dark">Últimos registros</p>
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
