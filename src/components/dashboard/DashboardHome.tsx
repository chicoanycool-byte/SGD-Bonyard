import {
  FileCheck2,
  RefreshCcw,
  AlertOctagon,
  GraduationCap,
  ClipboardList,
  ShieldCheck,
  Users,
  Bell,
  ChevronRight,
} from "lucide-react";
import SummaryCard from "./SummaryCard";
import TrendChart from "./TrendChart";
import ProcessBar from "./ProcessBar";

// ---------------------------------------------------------------
// Tipos — reemplaza estos mocks por tus queries reales a Supabase
// (pendientes, notificaciones, ac_ap, pnc, indicadores, etc.)
// ---------------------------------------------------------------
type Pendiente = {
  id: string;
  titulo: string;
  documento: string;
  tipo: string;
  prioridad: "Alta" | "Media" | "Baja";
  vencimiento: string;
};

type Notificacion = {
  id: string;
  texto: string;
  href: string;
};

type DashboardHomeProps = {
  userName: string;
  pendientes: Pendiente[];
  notificaciones: Notificacion[];
  kpis: {
    cumplimientoDocumental: number;
    cumplimientoEntrenamiento: number;
    pncAbiertas: number;
    capaEfectividad: number;
  };
  tendenciaPNC: { label: string; value: number }[];
  procesos: { label: string; percent: number }[];
  resumen: {
    tareasPendientes: number;
    documentosPorAprobar: number;
    documentosPorRevisar: number;
    accionesVencidas: number;
    entrenamientosPendientes: number;
  };
};

const prioridadStyles: Record<Pendiente["prioridad"], string> = {
  Alta: "bg-status-danger/10 text-status-danger",
  Media: "bg-status-warn/10 text-status-warn",
  Baja: "bg-status-ok/10 text-status-ok",
};

export default function DashboardHome({
  userName,
  pendientes,
  notificaciones,
  kpis,
  tendenciaPNC,
  procesos,
  resumen,
}: DashboardHomeProps) {
  return (
    <div className="p-4 lg:p-8 space-y-6 bg-surface min-h-screen">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-semibold text-brand-900">
          ¡Bienvenido, {userName}!
        </h1>
        <p className="text-sm text-brand-gray">Coordinador de Sistema de Gestión Integral</p>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          icon={ClipboardList}
          iconBg="bg-brand-teal"
          label="Tareas pendientes"
          value={resumen.tareasPendientes}
          href="/pendientes"
          linkLabel="Ver mis tareas"
        />
        <SummaryCard
          icon={FileCheck2}
          iconBg="bg-status-ok"
          label="Documentos por aprobar"
          value={resumen.documentosPorAprobar}
          href="/documentos?estado=aprobacion"
          linkLabel="Ir a aprobaciones"
        />
        <SummaryCard
          icon={RefreshCcw}
          iconBg="bg-brand-green"
          label="Documentos próximos a revisión"
          value={resumen.documentosPorRevisar}
          href="/documentos?estado=revision"
          linkLabel="Ver calendario"
        />
        <SummaryCard
          icon={AlertOctagon}
          iconBg="bg-status-warn"
          label="Acciones vencidas"
          value={resumen.accionesVencidas}
          href="/ac-ap?estado=vencida"
          linkLabel="Ver AC/AP"
        />
        <SummaryCard
          icon={GraduationCap}
          iconBg="bg-brand-teal-light"
          label="Entrenamientos pendientes"
          value={resumen.entrenamientosPendientes}
          href="/training"
          linkLabel="Ir a Training"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Mis pendientes */}
        <div className="xl:col-span-2 bg-surface-card rounded-xl border border-border-subtle p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-brand-900">Mis pendientes</h2>
            <a href="/pendientes" className="text-xs font-medium text-brand-teal flex items-center gap-1 hover:underline">
              Ver todos <ChevronRight size={14} />
            </a>
          </div>
          <div className="divide-y divide-border-subtle">
            {pendientes.map((p) => (
              <a
                key={p.id}
                href={`/pendientes/${p.id}`}
                className="flex items-center gap-4 py-3 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-900 truncate">{p.titulo}</p>
                  <p className="text-xs text-brand-gray">{p.documento}</p>
                </div>
                <span className="hidden sm:inline text-xs text-brand-gray-dark">{p.tipo}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${prioridadStyles[p.prioridad]}`}>
                  {p.prioridad}
                </span>
                <span className="hidden md:inline text-xs text-brand-gray w-20 text-right">{p.vencimiento}</span>
                <ChevronRight size={16} className="text-brand-gray group-hover:text-brand-900" />
              </a>
            ))}
          </div>
        </div>

        {/* Alertas y notificaciones */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-brand-teal" />
            <h2 className="font-semibold text-brand-900">Alertas y notificaciones</h2>
          </div>
          <ul className="space-y-4">
            {notificaciones.map((n) => (
              <li key={n.id} className="text-sm">
                <p className="text-brand-900">{n.texto}</p>
                <a href={n.href} className="text-xs text-brand-teal hover:underline">
                  Ver detalle
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* KPIs + tendencia */}
        <div className="xl:col-span-2 bg-surface-card rounded-xl border border-border-subtle p-5">
          <h2 className="font-semibold text-brand-900 mb-4">Indicadores (KPIs)</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi label="Cumplimiento Documental" value={kpis.cumplimientoDocumental} meta="≥ 90%" />
            <Kpi label="Cumplimiento Entrenamiento" value={kpis.cumplimientoEntrenamiento} meta="≥ 90%" />
            <Kpi label="No Conformidades Abiertas" value={kpis.pncAbiertas} meta="≤ 10" isCount />
            <Kpi label="Efectividad CAPA" value={kpis.capaEfectividad} meta="≥ 90%" />
          </div>
          <p className="text-xs text-brand-gray mb-1">Tendencia de No Conformidades (últimos meses)</p>
          <TrendChart points={tendenciaPNC} />
        </div>

        {/* Estado de procesos clave */}
        <div className="bg-surface-card rounded-xl border border-border-subtle p-5">
          <h2 className="font-semibold text-brand-900 mb-2">Estado de procesos clave</h2>
          <div>
            {procesos.map((p) => (
              <ProcessBar key={p.label} icon={ShieldCheck} label={p.label} percent={p.percent} />
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-brand-gray flex items-center gap-2">
        <Users size={14} /> Bon Yard Servicios · SQF · ISO 9001:2015
      </p>
    </div>
  );
}

function Kpi({
  label,
  value,
  meta,
  isCount = false,
}: {
  label: string;
  value: number;
  meta: string;
  isCount?: boolean;
}) {
  return (
    <div className="rounded-lg bg-surface p-4">
      <p className="text-xs text-brand-gray-dark mb-1">{label}</p>
      <p className="text-2xl font-semibold text-brand-900">
        {value}
        {!isCount && "%"}
      </p>
      <p className="text-[11px] text-brand-gray">Meta: {meta}</p>
    </div>
  );
}
