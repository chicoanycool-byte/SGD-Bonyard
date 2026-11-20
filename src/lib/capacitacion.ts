export type EstadoCap = 'vigente' | 'por_vencer' | 'vencido' | 'pendiente' | 'sin_vencimiento'

export const ESTADO_CAP: Record<EstadoCap, { label: string; clase: string }> = {
  vigente: { label: 'Vigente', clase: 'bg-emerald-100 text-emerald-800' },
  sin_vencimiento: { label: 'Cumplido', clase: 'bg-emerald-100 text-emerald-800' },
  por_vencer: { label: 'Por vencer', clase: 'bg-amber-100 text-amber-800' },
  vencido: { label: 'Vencido', clase: 'bg-red-100 text-red-800' },
  pendiente: { label: 'Sin registro', clase: 'bg-gray-100 text-gray-600' },
}

// hoy en formato YYYY-MM-DD (se recibe para no llamar Date.now() en componentes)
export function estadoCapacitacion(vigenteHasta: string | null | undefined, tieneRegistro: boolean, hoy: string): EstadoCap {
  if (!tieneRegistro) return 'pendiente'
  if (!vigenteHasta) return 'sin_vencimiento'
  if (vigenteHasta < hoy) return 'vencido'
  const limite = new Date(hoy + 'T12:00:00')
  limite.setDate(limite.getDate() + 30)
  if (vigenteHasta <= limite.toISOString().slice(0, 10)) return 'por_vencer'
  return 'vigente'
}

export function sumarMeses(fecha: string, meses: number) {
  const d = new Date(fecha + 'T12:00:00')
  d.setMonth(d.getMonth() + meses)
  return d.toISOString().slice(0, 10)
}

export const fechaMX = (f: string | null | undefined) =>
  f ? new Date(f + 'T12:00:00').toLocaleDateString('es-MX') : '—'

export function hoyMX() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}
