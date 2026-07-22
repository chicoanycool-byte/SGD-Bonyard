// EJEMPLO de app/inicio/page.tsx (Server Component).
// Reemplaza el objeto `data` por queries reales a Supabase:
// - resumen: counts de pendientes, documentos, ac_ap vencidas, training
// - notificaciones: tabla `notificaciones` filtrada por usuario_actual()
// - kpis / tendenciaPNC: agregados desde pnc / indicadores
// - procesos: % calculado por módulo (documental, auditorías, etc.)

import DashboardHome from "@/components/dashboard/DashboardHome";

export default async function InicioPage() {
  // const supabase = await createClient();
  // const { data: pendientes } = await supabase.from("pendientes").select("*")...

  const data = {
    userName: "Carlos",
    resumen: {
      tareasPendientes: 18,
      documentosPorAprobar: 7,
      documentosPorRevisar: 12,
      accionesVencidas: 3,
      entrenamientosPendientes: 5,
    },
    pendientes: [
      {
        id: "1",
        titulo: "Aprobar: PSG-14 Procedimiento HACCP",
        documento: "DOC-PR-0147 · Revisión 05",
        tipo: "Aprobación",
        prioridad: "Alta" as const,
        vencimiento: "20/ago",
      },
      {
        id: "2",
        titulo: "Revisar: FSG-19 Matriz de Requisitos Legales",
        documento: "DOC-FO-0218 · Revisión 03",
        tipo: "Revisión",
        prioridad: "Media" as const,
        vencimiento: "22/ago",
      },
      {
        id: "3",
        titulo: "AC-24-0037: Investigación raíz",
        documento: "Correctiva",
        tipo: "AC/AP",
        prioridad: "Alta" as const,
        vencimiento: "23/ago",
      },
    ],
    notificaciones: [
      { id: "1", texto: "10 documentos vencen en los próximos 30 días.", href: "/documentos?vence=30" },
      { id: "2", texto: "7 documentos pendientes de aprobación.", href: "/documentos?estado=aprobacion" },
      { id: "3", texto: "3 acciones correctivas vencidas. Requieren atención inmediata.", href: "/ac-ap?estado=vencida" },
    ],
    kpis: {
      cumplimientoDocumental: 92,
      cumplimientoEntrenamiento: 88,
      pncAbiertas: 8,
      capaEfectividad: 95,
    },
    tendenciaPNC: [
      { label: "Mar", value: 22 },
      { label: "Abr", value: 18 },
      { label: "May", value: 16 },
      { label: "Jun", value: 12 },
      { label: "Jul", value: 9 },
    ],
    procesos: [
      { label: "Control Documental", percent: 92 },
      { label: "Recorridos BPA", percent: 94 },
      { label: "Matriz Legal", percent: 90 },
      { label: "Auditorías Internas", percent: 85 },
      { label: "AC/AP", percent: 78 },
      { label: "Proveedores Críticos", percent: 88 },
    ],
  };

  return <DashboardHome {...data} />;
}
