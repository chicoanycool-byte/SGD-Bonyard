import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'

export default async function PncPage() {
  const quien = await requerirUsuario()

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/pnc">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[16px] font-medium text-by-gray-dark">Producto y equipo no conforme</p>
          <p className="text-[12.5px] text-by-gray">Aquí reportas cuando un producto o un equipo no cumple, y consultas lo ya reportado.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/pnc/capturar"
            className="rounded-xl border border-black/5 bg-white p-6 text-center transition hover:border-by-accent hover:shadow-sm"
          >
            <p className="mb-1 text-[15px] font-medium text-by-gray-dark">Reportar algo no conforme</p>
            <p className="text-[12px] text-by-gray-light">
              Producto dañado o equipo que falló. Te guía paso a paso.
            </p>
          </Link>
          <Link
            href="/pnc/registro"
            className="rounded-xl border border-black/5 bg-white p-6 text-center transition hover:border-by-accent hover:shadow-sm"
          >
            <p className="mb-1 text-[15px] font-medium text-by-gray-dark">Ver lo ya reportado</p>
            <p className="text-[12px] text-by-gray-light">
              Consultar, filtrar y exportar el FSG-11 Registro de producto no conforme
            </p>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
