import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { hoyMX } from '@/lib/capacitacion'
import { estadoMuestreo } from '@/lib/monitoreo'
import MonitoreoClient, { type PuntoVista, type ResultadoVista } from './MonitoreoClient'

export default async function MonitoreoAmbientalPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()
  const hoy = hoyMX()

  const [{ data: puntosRaw }, { data: resRaw }, { data: usuarios }] = await Promise.all([
    supabase.from('monitoreo_puntos').select('id, codigo, nombre, nave, zona, tipo, indicador, riesgo, frecuencia_dias, limite, activo').order('codigo'),
    supabase
      .from('monitoreo_resultados')
      .select('id, punto_id, fecha, resultado, valor, laboratorio, observaciones, accion_id')
      .order('fecha', { ascending: false })
      .limit(200),
    supabase.from('usuarios').select('id, nombre').eq('estatus', 'activo').order('nombre'),
  ])

  const resultados = (resRaw ?? []) as unknown as ResultadoVista[]
  const ultimo = new Map<string, ResultadoVista>()
  for (const r of resultados) if (!ultimo.has(r.punto_id)) ultimo.set(r.punto_id, r)

  const puntos: PuntoVista[] = (puntosRaw ?? []).map((p) => {
    const u = ultimo.get(p.id as string)
    const { estado, proxima } = estadoMuestreo(u?.fecha ?? null, p.frecuencia_dias as number, hoy)
    return {
      id: p.id as string,
      codigo: p.codigo as string,
      nombre: p.nombre as string,
      nave: p.nave as string,
      zona: (p.zona as string | null) ?? null,
      tipo: p.tipo as string,
      indicador: (p.indicador as string | null) ?? null,
      riesgo: p.riesgo as string,
      frecuencia_dias: p.frecuencia_dias as number,
      limite: (p.limite as string | null) ?? null,
      activo: p.activo as boolean,
      estado,
      proxima,
      ultimaFecha: u?.fecha ?? null,
      ultimoResultado: u?.resultado ?? null,
    }
  })

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/inocuidad-alimentaria/monitoreo-ambiental">
      <MonitoreoClient
        puntos={puntos}
        resultados={resultados}
        usuarios={(usuarios ?? []).map((u) => ({ id: u.id as string, nombre: u.nombre as string }))}
        esCoord={quien.rol === 'coordinador_sgi'}
        hoy={hoy}
      />
    </AppShell>
  )
}
