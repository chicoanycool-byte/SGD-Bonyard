import Link from "next/link";
import {
  FilePlus2,
  Search,
  MessageSquareWarning,
  Wrench,
  ClipboardCheck,
  BarChart3,
  ListChecks,
  Bot,
  type LucideIcon,
} from "lucide-react";

type Acceso = { label: string; href: string; icon: LucideIcon };

export default function AccesosRapidos({ esCoordinador }: { esCoordinador: boolean }) {
  const accesos: Acceso[] = [
    {
      label: esCoordinador ? "Nuevo Documento" : "Solicitar Documento",
      href: esCoordinador ? "/documentos-alta" : "/solicitudes",
      icon: FilePlus2,
    },
    { label: "Buscar Documento", href: "/documentos", icon: Search },
    { label: "Registrar Queja", href: "/quejas", icon: MessageSquareWarning },
    { label: "Nueva AC/AP", href: "/ac-ap", icon: Wrench },
    ...(esCoordinador
      ? [{ label: "Programar Auditoría", href: "/auditorias", icon: ClipboardCheck }]
      : []),
    { label: "Dashboard de Indicadores", href: "/indicadores/dashboard", icon: BarChart3 },
    { label: "Mis Pendientes", href: "/pendientes", icon: ListChecks },
    { label: "Tu Asesor", href: "/asesor", icon: Bot },
  ];

  return (
    <div className="bg-surface-card rounded-xl border border-border-subtle p-5">
      <h2 className="font-semibold text-brand-900 mb-3">Accesos rápidos</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {accesos.map(({ label, href, icon: Icon }) => (
          <Link
            key={href + label}
            href={href}
            className="flex flex-col items-center gap-2 rounded-lg border border-border-subtle p-3 text-center transition-colors hover:border-brand-teal hover:bg-surface"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
              <Icon size={17} strokeWidth={1.8} />
            </div>
            <span className="text-[11.5px] leading-tight text-brand-gray-dark">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
