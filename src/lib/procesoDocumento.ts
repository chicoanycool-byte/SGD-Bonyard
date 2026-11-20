// El proceso de un documento sale de su código: [letra(s) de tipo] + [código del proceso] + número.
// Ej.: FSG-01 → SG (Sistema de gestión integral), PBAL-01 → BAL (Almacenes), DRH-03 → RH (Recursos humanos).
const PROCESOS: { sufijo: string; nombre: string }[] = [
  { sufijo: 'KTL', nombre: 'Tráfico y logística' },
  { sufijo: 'BAL', nombre: 'Almacenes' },
  { sufijo: 'DI', nombre: 'Dirección' },
  { sufijo: 'CV', nombre: 'Comercial' },
  { sufijo: 'SH', nombre: 'EHS' },
  { sufijo: 'MT', nombre: 'Mantenimiento' },
  { sufijo: 'SP', nombre: 'Seguridad patrimonial' },
  { sufijo: 'AF', nombre: 'Administración y finanzas' },
  { sufijo: 'SG', nombre: 'Sistema de gestión integral' },
  { sufijo: 'RH', nombre: 'Recursos humanos' },
  { sufijo: 'TI', nombre: 'TI' },
  { sufijo: 'CO', nombre: 'Compras' },
]

export function procesoPorCodigo(codigo: string): string | null {
  const prefijo = codigo.trim().toUpperCase().split('-')[0]
  return PROCESOS.find((p) => prefijo.endsWith(p.sufijo))?.nombre ?? null
}
