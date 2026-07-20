import Image from 'next/image'
import { requerirUsuario } from '@/lib/auth'
import CambiarPasswordForm from './CambiarPasswordForm'

export default async function CambiarPasswordPage() {
  const quien = await requerirUsuario({ omitirRedireccionPassword: true })

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[400px] overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm">
        <div className="bg-by-primary px-6 pb-6 pt-8 text-center">
          <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-md bg-white/95 px-3 py-1.5">
            <Image src="/logo-bonyard.png" alt="Bon Yard" width={90} height={30} className="h-7 w-auto" />
            <span className="h-5 w-px bg-black/10" />
            <Image src="/logo-sqf.png" alt="SQF" width={48} height={24} className="h-6 w-auto" />
            <Image src="/logo-iso.png" alt="ISO 9001:2015" width={24} height={24} className="h-6 w-auto" />
          </div>
          <p className="text-[15px] font-medium text-white">Hola, {quien.nombre}</p>
          <p className="mt-1 text-[12px] text-by-accent">
            Debes crear una nueva contraseña antes de continuar
          </p>
        </div>
        <div className="p-6">
          <CambiarPasswordForm />
        </div>
      </div>
    </div>
  )
}
