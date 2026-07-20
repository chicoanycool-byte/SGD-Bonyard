import AppShell from '@/components/AppShell'
import { requerirUsuario } from '@/lib/auth'
import CapturarPncForm from './CapturarPncForm'

export default async function CapturarPncPage() {
  const quien = await requerirUsuario()

  return (
    <AppShell nombre={quien.nombre} rol={quien.rol} usuarioId={quien.id} activo="/pnc">
      <CapturarPncForm />
    </AppShell>
  )
}
