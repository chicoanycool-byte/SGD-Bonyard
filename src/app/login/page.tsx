import Image from 'next/image'
import { iniciarSesion } from './actions'
import PasswordField from './PasswordField'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

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
          <p className="text-[16px] font-medium text-white">BONYARD Servicios</p>
          <p className="mt-1 text-[12px] text-by-accent">
            SGD · Sistema de Gestión Documental
          </p>
        </div>

        <form action={iniciarSesion} className="px-6 py-6">
          <label
            htmlFor="usuario"
            className="mb-1 block text-[12px] text-by-gray-dark"
          >
            Usuario
          </label>
          <input
            id="usuario"
            name="usuario"
            type="text"
            autoComplete="username"
            placeholder="nombre.apellido"
            required
            className="mb-4 h-9 w-full rounded-md border border-black/10 px-3 text-[14px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />

          <label
            htmlFor="password"
            className="mb-1 block text-[12px] text-by-gray-dark"
          >
            Contraseña
          </label>
          <PasswordField />

          <div className="mb-4 mt-2 text-right">
            <a
              href="/login/recuperar"
              className="text-[12px] text-by-accent hover:underline"
            >
              Olvidé mi contraseña
            </a>
          </div>

          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {decodeURIComponent(error)}
            </p>
          )}

          <button
            type="submit"
            className="h-9 w-full rounded-md bg-by-primary text-[14px] font-medium text-white transition hover:bg-by-primary-dark"
          >
            Iniciar sesión
          </button>

          <div className="mt-5 flex justify-center gap-5 opacity-50">
            <span className="text-[10px] text-by-gray-light">SQF</span>
            <span className="text-[10px] text-by-gray-light">ISO 9001:2015</span>
          </div>
        </form>
      </div>
    </div>
  )
}
