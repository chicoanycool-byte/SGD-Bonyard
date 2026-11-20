import AppShell from "@/components/AppShell";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { requerirUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { estadoCapacitacion, ESTADO_CAP } from "@/lib/capacitacion";

function mesesAtras(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

function diasAdelante(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function contar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tabla: string,
  filtros: (q: any) => any
) {
  const { count } = await filtros(
    supabase.from(tabla).select("id", { count: "exact", head: true })
  );
  return count ?? 0;
}

export default async function InicioPage() {
  const quien = await requerirUsuario();
  const supabase = await createClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [
    tareasPendientes,
    solicitudesPendientes,
    accionesVencidas,
    notificacionesNoLeidas,
    quejasAbiertas,
    pncAbiertas,
    acAbiertas,
    acCerradas,
    { data: pendientesLista },
    { data: notificacionesLista },
    { data: indicadoresValores },
    { data: pncSeisMeses },
    auditoriasTotal,
    auditoriasCerradas,
    quejasTotal,
    quejasCerradas,
    acTotal,
    acCerradasTotal,
    pncTotal,
    pncCerradasTotal,
  ] = await Promise.all([
    contar(supabase, "pendientes", (q) => q.eq("usuario_id", quien.id).neq("estatus", "cerrado")),
    contar(supabase, "solicitudes_documento", (q) => q.eq("estatus", "pendiente")),
    contar(supabase, "acciones_correctivas", (q) =>
      q.lt("fecha_compromiso", hoy).not("estatus", "in", "(cerrada,rechazada)")
    ),
    contar(supabase, "notificaciones", (q) => q.eq("usuario_id", quien.id).eq("leido", false)),
    contar(supabase, "quejas", (q) => q.neq("estatus", "cerrada")),
    contar(supabase, "pnc_registros", (q) => q.eq("estatus", "abierto")),
    contar(supabase, "acciones_correctivas", (q) => q.neq("estatus", "cerrada")),
    contar(supabase, "acciones_correctivas", (q) => q.eq("estatus", "cerrada")),
    supabase
      .from("pendientes")
      .select("id, descripcion, modulo, fecha_limite")
      .eq("usuario_id", quien.id)
      .neq("estatus", "cerrado")
      .order("fecha_limite", { ascending: true, nullsFirst: false })
      .limit(5),
    supabase
      .from("notificaciones")
      .select("id, mensaje, tipo")
      .eq("usuario_id", quien.id)
      .eq("leido", false)
      .order("creado_en", { ascending: false })
      .limit(5),
    supabase.from("indicadores_valores").select("valor, requiere_ac, indicador_id"),
    supabase
      .from("pnc_registros")
      .select("fecha")
      .gte("fecha", mesesAtras(5).toISOString().slice(0, 10)),
    contar(supabase, "auditorias", (q) => q),
    contar(supabase, "auditorias", (q) => q.eq("estatus", "cerrada")),
    contar(supabase, "quejas", (q) => q),
    contar(supabase, "quejas", (q) => q.eq("estatus", "cerrada")),
    contar(supabase, "acciones_correctivas", (q) => q),
    contar(supabase, "acciones_correctivas", (q) => q.eq("estatus", "cerrada")),
    contar(supabase, "pnc_registros", (q) => q),
    contar(supabase, "pnc_registros", (q) => q.eq("estatus", "cerrado")),
  ]);

  // "Mi día": lo que le toca a esta persona (acciones a su cargo y auditorías donde participa)
  const en14 = diasAdelante(14).toISOString().slice(0, 10);
  const [{ data: misAcciones }, { data: misAuditorias }] = await Promise.all([
    supabase
      .from("acciones_correctivas")
      .select("id, folio, descripcion, fecha_compromiso")
      .eq("responsable_id", quien.id)
      .in("estatus", ["abierta", "en_proceso", "rechazada"])
      .order("fecha_compromiso", { ascending: true, nullsFirst: false })
      .limit(5),
    supabase
      .from("auditorias")
      .select("id, fecha, nave, norma")
      .eq("estatus", "programada")
      .gte("fecha", hoy)
      .lte("fecha", en14)
      .or(
        `auditor_lider_id.eq.${quien.id},auditor_auxiliar_id.eq.${quien.id},auditado_id.eq.${quien.id}`
      )
      .order("fecha", { ascending: true })
      .limit(5),
  ]);

  // Capacitaciones propias que requieren atención (requisitos del puesto vencidos, por vencer o sin registro)
  const { data: yo } = await supabase.from("usuarios").select("puesto_id").eq("id", quien.id).single();
  const [{ data: reqPuesto }, { data: cursosCap }, { data: regsCap }] = await Promise.all([
    supabase.from("capacitacion_requisitos").select("curso_id").eq("puesto_id", (yo?.puesto_id as string) ?? "00000000-0000-0000-0000-000000000000"),
    supabase.from("capacitacion_cursos").select("id, codigo, nombre").eq("activo", true),
    supabase.from("capacitacion_registros").select("curso_id, fecha, vigente_hasta").eq("usuario_id", quien.id).order("fecha", { ascending: false }),
  ]);
  const ultimoCap = new Map<string, string | null>();
  for (const r of regsCap ?? []) if (!ultimoCap.has(r.curso_id as string)) ultimoCap.set(r.curso_id as string, (r.vigente_hasta as string | null) ?? null);
  const misCapacitaciones = (reqPuesto ?? [])
    .map((r) => {
      const c = (cursosCap ?? []).find((x) => x.id === r.curso_id);
      if (!c) return null;
      const tiene = ultimoCap.has(c.id as string);
      const estado = estadoCapacitacion(ultimoCap.get(c.id as string), tiene, hoy);
      return { id: c.id as string, titulo: `${c.codigo} ${c.nombre}`, estado: ESTADO_CAP[estado].label, urgente: estado === "vencido" || estado === "pendiente", ok: estado === "vigente" || estado === "sin_vencimiento" };
    })
    .filter((x): x is { id: string; titulo: string; estado: string; urgente: boolean; ok: boolean } => !!x && !x.ok);

  const porcentaje = (parte: number, total: number) =>
    total > 0 ? Math.round((parte / total) * 100) : 0;

  // Tendencia PNC: conteo por mes de los últimos 6 meses
  const meses = Array.from({ length: 6 }).map((_, i) => mesesAtras(5 - i));
  const tendenciaPNC = meses.map((m) => {
    const label = m.toLocaleDateString("es-MX", { month: "short" }).replace(".", "");
    const inicio = new Date(m.getFullYear(), m.getMonth(), 1);
    const fin = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    const value = (pncSeisMeses ?? []).filter((r) => {
      const f = new Date(r.fecha as string);
      return f >= inicio && f < fin;
    }).length;
    return { label: label.charAt(0).toUpperCase() + label.slice(1), value };
  });

  const cumplimientoIndicadores = porcentaje(
    (indicadoresValores ?? []).filter((v) => v.valor !== null && !v.requiere_ac).length,
    (indicadoresValores ?? []).filter((v) => v.valor !== null).length
  );

  const data = {
    userName: quien.nombre.split(" ")[0],
    usuario: quien.usuario,
    resumen: {
      tareasPendientes,
      documentosPorAprobar: solicitudesPendientes,
      accionesVencidas,
      quejasAbiertas,
      notificacionesNoLeidas,
    },
    pendientes: (pendientesLista ?? []).map((p) => ({
      id: p.id,
      titulo: p.descripcion || "Pendiente",
      documento: p.modulo,
      tipo: p.modulo,
      prioridad: (p.fecha_limite && p.fecha_limite < hoy ? "Alta" : "Media") as "Alta" | "Media",
      vencimiento: p.fecha_limite
        ? new Date(p.fecha_limite).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
        : "Sin fecha",
    })),
    notificaciones: (notificacionesLista ?? []).map((n) => ({
      id: n.id,
      texto: n.mensaje,
      href: "/notificaciones",
    })),
    kpis: {
      cumplimientoIndicadores,
      acAbiertas,
      quejasAbiertas,
      pncAbiertas,
      acEfectividad: porcentaje(acCerradas, acAbiertas + acCerradas),
    },
    misAcciones: (misAcciones ?? []).map((a) => ({
      id: a.id as string,
      titulo: `${a.folio ?? "Sin folio"} · ${(a.descripcion as string | null)?.slice(0, 80) ?? "Acción"}`,
      vencida: !!a.fecha_compromiso && (a.fecha_compromiso as string) < hoy,
      fecha: a.fecha_compromiso
        ? new Date(a.fecha_compromiso as string + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
        : "Sin fecha",
    })),
    misCapacitaciones,
    misAuditorias: (misAuditorias ?? []).map((a) => ({
      id: a.id as string,
      titulo: `Auditoría ${a.nave ?? ""}`.trim(),
      fecha: new Date(a.fecha as string + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" }),
    })),
    tendenciaPNC,
    procesos: [
      { label: "Auditorías", percent: porcentaje(auditoriasCerradas, auditoriasTotal) },
      { label: "Quejas", percent: porcentaje(quejasCerradas, quejasTotal) },
      { label: "Acciones Correctivas", percent: porcentaje(acCerradasTotal, acTotal) },
      { label: "Producto No Conforme", percent: porcentaje(pncCerradasTotal, pncTotal) },
    ],
  };

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/inicio">
      <DashboardHome {...data} rol={quien.rol} />
    </AppShell>
  );
}
