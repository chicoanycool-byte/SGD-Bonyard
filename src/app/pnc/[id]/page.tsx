import { notFound } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DetallePNC from './DetallePNC'

export default async function DetallePncPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const quien = await requerirUsuario()
  const supabase = await createClient()

  const { data: registro } = await supabase.from('pnc_registros').select('*').eq('id', id).single()
  if (!registro) notFound()

  let fotoUrl: string | null = null
  if (registro.foto_path) {
    const { data } = await supabase.storage.from('pnc').createSignedUrl(registro.foto_path, 300)
    fotoUrl = data?.signedUrl ?? null
  }

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/pnc">
      <div className="flex flex-col gap-4">
        <DetallePNC
          registro={registro}
          fotoUrl={fotoUrl}
          esCoordinador={quien.rol === 'coordinador_sgi'}
        />
      </div>
    </AppShell>
  )
}
