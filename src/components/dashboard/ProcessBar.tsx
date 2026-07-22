import { LucideIcon } from "lucide-react";

type ProcessBarProps = {
  icon: LucideIcon;
  label: string;
  percent: number; // 0-100
};

function colorFor(percent: number) {
  if (percent >= 90) return "bg-status-ok";
  if (percent >= 80) return "bg-brand-teal";
  return "bg-status-warn";
}

export default function ProcessBar({ icon: Icon, label, percent }: ProcessBarProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon size={16} className="text-brand-teal shrink-0" />
      <span className="text-sm text-brand-900 w-44 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
        <div
          className={`h-full rounded-full ${colorFor(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm font-medium text-brand-900 w-10 text-right">{percent}%</span>
    </div>
  );
}
