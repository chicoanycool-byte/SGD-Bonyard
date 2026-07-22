"use client";

import { Search, Bell, Menu } from "lucide-react";

type TopbarProps = {
  userName: string;
  userRole: string;
  notificationCount?: number;
  onToggleMobileMenu?: () => void;
};

export default function Topbar({
  userName,
  userRole,
  notificationCount = 0,
  onToggleMobileMenu,
}: TopbarProps) {
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex items-center gap-4 h-16 px-4 lg:px-6 bg-white border-b border-border-subtle sticky top-0 z-20">
      <button
        onClick={onToggleMobileMenu}
        className="lg:hidden p-2 -ml-2 text-brand-gray-dark"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray"
          />
          <input
            type="text"
            placeholder="Buscar documentos, tareas, registros..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border-subtle bg-surface focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
          />
        </div>
      </div>

      <button className="relative p-2 text-brand-gray-dark hover:text-brand-900" aria-label="Notificaciones">
        <Bell size={20} />
        {notificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 w-4 rounded-full bg-status-danger text-white text-[10px] font-medium">
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </button>

      <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
        <div className="h-9 w-9 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-semibold">
          {initials}
        </div>
        <div className="hidden md:block leading-tight">
          <p className="text-sm font-medium text-brand-900">{userName}</p>
          <p className="text-[11px] text-brand-gray">{userRole}</p>
        </div>
      </div>
    </header>
  );
}
