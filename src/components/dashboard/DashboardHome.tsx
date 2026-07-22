import {
  ClipboardList,
  FileEdit,
  AlertOctagon,
  MessageSquareWarning,
  Bell,
  ShieldCheck,
  Users,
  ChevronRight,
} from "lucide-react";
import SummaryCard from "./SummaryCard";
import TrendChart from "./TrendChart";
import ProcessBar from "./ProcessBar";
import { ROL_LABEL } from "@/lib/permisos";
import { config } from "@/lib/config";

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
  rol: string;
  pendientes: Pendiente[];
  notificaciones: Notificacion[];
  kpis: {
    cumplimientoIndicadores: number;
    acAbiertas: number;
    quejasAbiertas: number;
    pncAbiertas: number;
    acEfectividad: number;
  };
  tendenciaPNC: { label: string; value: number }[];
  procesos: { label: string; percent: number }[];
  resumen: {
    tareasPendientes: number;
    documentosPorAprobar: number;
    accionesVencidas: number;
    quejasAbiertas: number;
    notificacionesNoLeidas: number;
  };
};

const prioridadStyles: Record<Pendiente["prioridad"], string> = {
  Alta: "bg-status-danger/10 text-status-danger",
  Media: "bg-status-warn/10 text-status-warn",
  Baja: "bg-status-ok/10 text-status-ok",
};

export default function DashboardHome({
  userName,
  rol,
  pendientes,
  notificaciones,
  kpis,
  tendenciaPNC,
  procesos,
  resumen,
}: DashboardHomeProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-brand-900">¡Bienvenido, {userName}!</h1>
        <p className="text-sm text-brand-gray">{ROL_LABEL[rol] ?? rol}</p>
      </div>

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
          icon={FileEdit}
          iconBg="bg-status-ok"
          label="Solicitudes de documentos pendientes"
          value={resumen.documentosPorAprobar}
          href="/solicitudes"
          linkLabel="Ver solicitudes"
        />
        <SummaryCard
          icon={AlertOctagon}
          iconBg="bg-status-warn"
          label="Acciones correctivas vencidas"
          value={resumen.accionesVencidas}
          href="/ac-ap"
          linkLabel="Ver AC/AP"
        />
        <SummaryCard
          icon={MessageSquareWarning}
          iconBg="bg-brand-green"
          label="Quejas abiertas"
          value={resumen.quejasAbiertas}
          href="/quejas"
          linkLabel="Ver quejas"
        />
        <SummaryCard
          icon={Bell}
          iconBg="bg-brand-teal-light"
          label="Notificaciones sin leer"
          value={resumen.notificacionesNoLeidas}
          href="/notificaciones"
          linkLabel="Ver notificaciones"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-surface-card rounded-xl border border-border-subtle p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-brand-900">Mis pendientes</h2>
            <a href="/pendientes" className="text-xs font-medium text-brand-teal flex items-center gap-1 hover:underline">
              Ver todos <ChevronRight size={14} />
            </a>
          </div>
          {pendientes.length === 0 && (
            <p className="text-sm text-brand-gray py-4">No tienes pendientes abiertos. 🎉</p>
          )}
          <div className="divide-y divide-border-subtle">
            {pendientes.map((p) => (
              <a key={p.id} href="/pendientes" className="flex items-center gap-4 py-3 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-900 truncate">{p.titulo}</p>
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

        <div className="bg-surface-card rounded-xl border border-border-subtle p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-brand-teal" />
            <h2 className="font-semibold text-brand-900">Alertas y notificaciones</h2>
          </div>
          {notificaciones.length === 0 && (
            <p className="text-sm text-brand-gray">Sin notificaciones pendientes.</p>
          )}
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-surface-card rounded-xl border border-border-subtle p-5">
          <h2 className="font-semibold text-brand-900 mb-4">Indicadores</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi label="Indicadores en meta" value={kpis.cumplimientoIndicadores} meta="≥ 90%" />
            <Kpi label="AC/AP abiertas" value={kpis.acAbiertas} meta="Al mínimo" isCount />
            <Kpi label="No Conformidades Abiertas" value={kpis.pncAbiertas} meta="≤ 10" isCount />
            <Kpi label="Efectividad AC/AP (cierre)" value={kpis.acEfectividad} meta="≥ 90%" />
          </div>
          <p className="text-xs text-brand-gray mb-1">Producto/Equipo No Conforme (últimos 6 meses)</p>
          <TrendChart points={tendenciaPNC} />
        </div>

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
        <Users size={14} /> {config.empresaNombre} · {config.normas}
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
