export type EstadoMuestreo = 'sin_muestra' | 'vencido' | 'proximo' | 'al_dia'

export const RIESGO_LABEL: Record<string, string> = { alto: 'Riesgo alto', medio: 'Riesgo medio', bajo: 'Riesgo bajo' }
export const RIESGO_CLASE: Record<string, string> = {
  alto: 'bg-red-100 text-red-800',
  medio: 'bg-amber-100 text-amber-800',
  bajo: 'bg-emerald-100 text-emerald-800',
}
export const FRECUENCIA_SUGERIDA: Record<string, number> = { alto: 30, medio: 90, bajo: 180 }
export const TIPO_LABEL: Record<string, string> = { superficie: 'Superficie', aire: 'Aire', agua: 'Agua' }

export function sumarDias(fecha: string, dias: number) {
  const d = new Date(fecha + 'T12:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function estadoMuestreo(ultimaFecha: string | null, frecuenciaDias: number, hoy: string): { estado: EstadoMuestreo; proxima: string | null } {
  if (!ultimaFecha) return { estado: 'sin_muestra', proxima: null }
  const proxima = sumarDias(ultimaFecha, frecuenciaDias)
  if (proxima < hoy) return { estado: 'vencido', proxima }
  if (proxima <= sumarDias(hoy, 15)) return { estado: 'proximo', proxima }
  return { estado: 'al_dia', proxima }
}
