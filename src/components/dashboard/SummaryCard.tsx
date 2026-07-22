import Link from "next/link";
import { ChevronRight, LucideIcon } from "lucide-react";

type SummaryCardProps = {
  icon: LucideIcon;
  iconBg: string; // clase de fondo del ícono, ej. "bg-brand-teal"
  label: string;
  value: number | string;
  href: string;
  linkLabel: string;
};

export default function SummaryCard({
  icon: Icon,
  iconBg,
  label,
  value,
  href,
  linkLabel,
}: SummaryCardProps) {
  return (
    <div className="bg-surface-card rounded-xl border border-border-subtle p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${iconBg}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <p className="text-sm text-brand-gray-dark leading-snug">{label}</p>
      </div>
      <p className="text-3xl font-semibold text-brand-900">{value}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-medium text-brand-teal hover:underline"
      >
        {linkLabel}
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}
