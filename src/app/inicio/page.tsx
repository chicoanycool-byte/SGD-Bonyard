import AppShell from "@/components/AppShell";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { requerirUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function mesesAtras(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
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
