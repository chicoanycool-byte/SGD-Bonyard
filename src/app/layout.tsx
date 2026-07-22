// EJEMPLO de cómo envolver tus páginas del panel con Sidebar + Topbar.
// Copia el patrón dentro de tu app/(dashboard)/layout.tsx real,
// usando ahí tu lógica actual de sesión/rol (usuario_actual()).

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
  // En tu layout real, obtén esto de tu sesión/Supabase, no como prop.
  userName = "Carlos Hernández",
  userRole = "Coordinador SGI",
  notificationCount = 3,
}: {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
  notificationCount?: number;
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Topbar
          userName={userName}
          userRole={userRole}
          notificationCount={notificationCount}
        />
        {children}
      </div>
    </div>
  );
}
