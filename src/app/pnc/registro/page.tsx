import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import RegistroPncTabla from './RegistroPncTabla'

export default async function RegistroPncPage() {
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data } = await supabase
    .from('pnc_registros')
    .select('*')
    .order('creado_en', { ascending: false })

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/pnc">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-by-gray-dark">
            Control de Producto No Conforme (FSG-11)
          </p>
          <div className="flex gap-2">
            <a
              href="/pnc/registro/exportar/excel"
              className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
            >
              Exportar Excel
            </a>
            <a
              href="/pnc/registro/exportar/pdf"
              className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
            >
              Exportar PDF
            </a>
          </div>
        </div>
        <RegistroPncTabla registros={data ?? []} />
      </div>
    </AppShell>
  )
}
