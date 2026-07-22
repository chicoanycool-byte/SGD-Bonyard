import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import BotonesAtrasActualizar from './BotonesAtrasActualizar'
import MenuLateral from './MenuLateral'
import { ROL_LABEL } from '@/lib/permisos'

const NAV = [
  { href: '/inicio', label: 'Inicio', soloCoordinador: false, siempre: true },
  { href: '/documentos', label: 'Ver documentos del SGI', soloCoordinador: false },
  { href: '/documentos-alta', label: 'Alta o actualización de documentos', soloCoordinador: true },
  { href: '/solicitudes', label: 'Solicitud de cambio de documentos', soloCoordinador: false },
  { href: '/auditorias', label: 'Auditorías', soloCoordinador: false },
  { href: '/quejas', label: 'Quejas', soloCoordinador: false },
  { href: '/ac-ap', label: 'Acciones Correctivas y Preventivas', soloCoordinador: false },
  { href: '/indicadores', label: 'Tablero de indicadores', soloCoordinador: false },
  { href: '/reunion-haccp', label: 'Reunión Equipo HACCP', soloCoordinador: false },
  { href: '/revision-direccion', label: 'Revisión por la Dirección', soloCoordinador: false },
  { href: '/proveedores', label: 'Proveedores', soloCoordinador: true },
  { href: '/recorridos-bpa', label: 'Recorridos BPAs', soloCoordinador: false },
  { href: '/verificacion-sgi', label: 'Verificación del SGI', soloCoordinador: true },
  { href: '/matriz-legal', label: 'Matriz de Requisitos Legales', soloCoordinador: false },
  { href: '/pnc', label: 'Producto y Equipo No Conforme', soloCoordinador: false },
  { href: '/pendientes', label: 'Ver lista de pendientes', soloCoordinador: false },
  { href: '/usuarios', label: 'Usuarios', soloCoordinador: true },
  { href: '/asesor', label: 'Tu Asesor Bonyard', soloCoordinador: false, siempre: true },
]

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase()
}

export default async function AppShell({
  nombre,
  rol,
  usuarioId,
  activo,
  children,
}: {
  nombre: string
  rol: string
  usuarioId: string
  activo: string
  children: React.ReactNode
}) {
  const esCoordinador = rol === 'coordinador_sgi'

  const supabase = await createClient()
  const { count: noLeidas } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('leido', false)

  const { data: datosUsuario } = await supabase
    .from('usuarios')
    .select('puesto')
    .eq('id', usuarioId)
    .maybeSingle()
  const puesto = datosUsuario?.puesto?.trim()

  const itemsVisibles = NAV.filter((item) => !item.soloCoordinador || esCoordinador)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between bg-by-primary px-4 py-2 pl-14 md:pl-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-md bg-white/95 px-1.5 py-1 md:gap-2 md:px-2">
            <Image src="/logo-bonyard.png" alt="Bon Yard" width={72} height={24} className="h-5 w-auto md:h-6" />
            <span className="hidden h-5 w-px bg-black/10 sm:block" />
            <Image src="/logo-sqf.png" alt="SQF" width={40} height={20} className="hidden h-5 w-auto sm:block" />
            <Image src="/logo-iso.png" alt="ISO 9001:2015" width={20} height={20} className="hidden h-5 w-auto sm:block" />
          </div>
          <span className="hidden text-[13px] font-medium text-white md:inline">
            SGD Bonyard <span className="text-by-accent">v1.0</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notificaciones" className="relative flex h-6 w-6 items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="h-[18px] w-[18px]">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!!noLeidas && noLeidas > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] font-medium text-white">
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-by-accent text-[11px] font-medium text-by-primary">
              {iniciales(nombre)}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-[12px] text-white">{nombre}</p>
              <p className="text-[10.5px] text-by-accent">
                {puesto || ROL_LABEL[rol] || rol}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <MenuLateral items={itemsVisibles} activo={activo} />

        <main className="min-w-0 flex-1 p-3 md:p-4">
          <div className="mb-3">
            <BotonesAtrasActualizar />
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
