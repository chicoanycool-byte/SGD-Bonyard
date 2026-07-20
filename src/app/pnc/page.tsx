import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'

export default async function PncPage() {
  const quien = await requerirUsuario()

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/pnc">
      <div className="flex flex-col gap-4">
        <p className="text-[14px] font-medium text-by-gray-dark">
          Producto y Equipo No Conforme
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/pnc/capturar"
            className="rounded-xl border border-black/5 bg-white p-6 text-center transition hover:border-by-accent hover:shadow-sm"
          >
            <p className="mb-1 text-[15px] font-medium text-by-gray-dark">Capturar PNC</p>
            <p className="text-[12px] text-by-gray-light">
              Registrar un nuevo producto o equipo no conforme
            </p>
          </Link>
          <Link
            href="/pnc/registro"
            className="rounded-xl border border-black/5 bg-white p-6 text-center transition hover:border-by-accent hover:shadow-sm"
          >
            <p className="mb-1 text-[15px] font-medium text-by-gray-dark">Ver registro PNC</p>
            <p className="text-[12px] text-by-gray-light">
              Consultar, filtrar y exportar el histórico (FSG-11)
            </p>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
