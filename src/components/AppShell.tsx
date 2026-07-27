import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BotonesAtrasActualizar from './BotonesAtrasActualizar'
import MenuLateral from './MenuLateral'
import { ROL_LABEL } from '@/lib/permisos'

type SubItem = { href: string; label: string; soloCoordinador?: boolean }
type NavItem =
  | { href: string; label: string; soloCoordinador?: boolean; siempre?: boolean; destacado?: boolean; children?: undefined }
  | { label: string; soloCoordinador?: boolean; children: SubItem[]; href?: undefined }

const NAV: NavItem[] = [
  { href: '/inicio', label: 'Inicio', siempre: true },
  { href: '/politica-calidad', label: 'Política de Calidad e Inocuidad', destacado: true },
  { href: '/reglamento-higiene', label: 'Reglamento de Higiene y Bienestar del Personal', destacado: true },
  {
    label: 'Recursos Humanos',
    children: [
      { href: '/recursos-humanos/descriptivo', label: 'Ver descriptivo' },
      { href: '/recursos-humanos/organigrama', label: 'Organigrama' },
      { href: '/recursos-humanos/cargar', label: 'Cargar documentos', soloCoordinador: true },
    ],
  },
  {
    label: 'Documentos del Sistema de Gestión',
    children: [
      { href: '/documentos', label: 'Ver Procedimientos y Manuales' },
      { href: '/solicitudes', label: 'Solicitud de cambios' },
      { href: '/documentos-alta', label: 'Alta o actualización', soloCoordinador: true },
    ],
  },
  {
    label: 'Dirección',
    children: [
      { href: '/direccion/contexto', label: 'Contexto de la organización' },
      { href: '/direccion/objetivos', label: 'Objetivos' },
      { href: '/indicadores', label: 'Indicadores' },
      { href: '/revision-direccion', label: 'Revisión por la Dirección' },
      { href: '/direccion/riesgos', label: 'Riesgos y oportunidades' },
    ],
  },
  {
    label: 'Quejas',
    children: [
      { href: '/quejas', label: 'Ver quejas' },
      { href: '/quejas/dashboard', label: 'Métricas' },
    ],
  },
  {
    label: 'Acciones Correctivas y Preventivas',
    children: [
      { href: '/ac-ap', label: 'Ver Acciones' },
      { href: '/ac-ap/dashboard', label: 'Métricas' },
    ],
  },
  {
    label: 'Recorridos BPAs',
    children: [
      { href: '/recorridos-bpa', label: 'Ver Recorridos' },
      { href: '/recorridos-bpa/dashboard', label: 'Métricas' },
    ],
  },
  {
    label: 'Verificación del SGI',
    soloCoordinador: true,
    children: [
      { href: '/verificacion-sgi', label: 'Ver Verificaciones' },
      { href: '/verificacion-sgi/dashboard', label: 'Métricas' },
    ],
  },
  {
    label: 'Producto y Equipo No Conforme',
    children: [
      { href: '/pnc/capturar', label: 'Capturar PNC' },
      { href: '/pnc/registro', label: 'Ver Registros PNC' },
      { href: '/pnc/dashboard', label: 'Métricas' },
    ],
  },
  {
    label: 'Compras',
    soloCoordinador: true,
    children: [
      { href: '/proveedores', label: 'Proveedores (alta y evaluaciones)' },
      { href: '/proveedores/evaluacion-inicial', label: 'Evaluación inicial de proveedor' },
      { href: '/proveedores/permisos-trabajo', label: 'Permiso de trabajo' },
      { href: '/proveedores/dashboard', label: 'Métricas' },
    ],
  },
  {
    label: 'Auditorías',
    children: [{ href: '/auditorias', label: 'Ver Auditorías' }],
  },
  {
    label: 'Plan HACCP',
    children: [
      { href: '/reunion-haccp', label: 'Reunión Equipo HACCP' },
      { href: '/plan-haccp/equipo', label: 'Equipo HACCP' },
      { href: '/plan-haccp/procesos', label: 'Análisis de Procesos' },
      { href: '/plan-haccp/productos', label: 'Análisis de productos' },
      { href: '/plan-haccp/plan', label: 'Plan HACCP' },
      { href: '/plan-haccp/diagramas', label: 'Diagramas de flujo' },
    ],
  },
  {
    label: 'EHS',
    children: [
      { href: '/matriz-legal', label: 'Matriz de Requisitos Legales' },
      { href: '/matriz-legal/plan-accion', label: 'Plan de acción' },
      { href: '/matriz-legal/indicadores', label: 'Métricas', soloCoordinador: true },
    ],
  },
  { href: '/pendientes', label: 'Ver lista de pendientes' },
  { href: '/usuarios', label: 'Usuarios', soloCoordinador: true },
  { href: '/metricas-acceso', label: 'Métricas de acceso', soloCoordinador: true },
  { href: '/asesor', label: 'Tu Asesor Bonyard', siempre: true },
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

  const itemsVisibles = NAV.map((item) => {
    if (item.children) {
      const children = item.children.filter((c) => !c.soloCoordinador || esCoordinador)
      return { ...item, children }
    }
    return item
  }).filter((item) => {
    if (item.soloCoordinador && !esCoordinador) return false
    if (item.children) return item.children.length > 0
    return true
  })

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
        <form action="/documentos" className="hidden max-w-sm flex-1 md:mx-4 md:block">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/50"
            />
            <input
              type="text"
              name="q"
              placeholder="Buscar documentos..."
              className="h-8 w-full rounded-md border border-white/10 bg-white/10 pl-8 pr-3 text-[12.5px] text-white placeholder:text-white/50 outline-none focus:border-by-accent focus:bg-white/15"
            />
          </div>
        </form>

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
