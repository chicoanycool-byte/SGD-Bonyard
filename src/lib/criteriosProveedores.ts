export type CriterioConfig = { nombre: string; peso: number }

export const CATEGORIA_LABEL: Record<string, string> = {
  transporte: 'Transporte',
  fumigacion: 'Fumigación',
  limpieza: 'Limpieza',
  empaque: 'Empaque',
  mantenimiento: 'Mantenimiento',
  seguros: 'Seguros',
  seguridad: 'Seguridad',
  montacargas: 'Montacargas',
}

export const CRITERIOS_POR_CATEGORIA: Record<string, CriterioConfig[]> = {
  transporte: [
    { nombre: 'Costos y condiciones de pago', peso: 0.05 },
    { nombre: 'Servicio y atención al cliente', peso: 0.1 },
    { nombre: 'Cumplimiento documental / legal-fiscal', peso: 0.15 },
    { nombre: 'Seguridad en el traslado (Food Defense)', peso: 0.3 },
    { nombre: 'Puntualidad y cumplimiento de entrega', peso: 0.25 },
    { nombre: 'Disponibilidad de flota', peso: 0.15 },
  ],
  fumigacion: [
    { nombre: 'Costos y condiciones de pago', peso: 0.05 },
    { nombre: 'Servicio y atención al cliente', peso: 0.1 },
    { nombre: 'Cumplimiento documental / legal-fiscal', peso: 0.2 },
    { nombre: 'Eficacia del servicio (SQF Pest Control)', peso: 0.35 },
    { nombre: 'Puntualidad y cumplimiento de programa', peso: 0.2 },
    { nombre: 'Disponibilidad de servicio', peso: 0.1 },
  ],
  limpieza: [
    { nombre: 'Costos y condiciones de pago', peso: 0.05 },
    { nombre: 'Servicio y atención al cliente', peso: 0.1 },
    { nombre: 'Cumplimiento documental / legal-fiscal', peso: 0.2 },
    { nombre: 'Calidad productos / inocuidad (SQF)', peso: 0.35 },
    { nombre: 'Puntualidad y cumplimiento de entregas', peso: 0.2 },
    { nombre: 'Disponibilidad de producto', peso: 0.1 },
  ],
  empaque: [
    { nombre: 'Costos y condiciones de pago', peso: 0.05 },
    { nombre: 'Servicio y atención al cliente', peso: 0.1 },
    { nombre: 'Cumplimiento documental / legal-fiscal', peso: 0.1 },
    { nombre: 'Calidad del producto / inocuidad (SQF)', peso: 0.35 },
    { nombre: 'Puntualidad y cumplimiento de entrega', peso: 0.2 },
    { nombre: 'Disponibilidad de producto / capacidad', peso: 0.2 },
  ],
  mantenimiento: [
    { nombre: 'Costos y condiciones de pago', peso: 0.05 },
    { nombre: 'Servicio y atención al cliente', peso: 0.1 },
    { nombre: 'Cumplimiento documental / legal-fiscal', peso: 0.15 },
    { nombre: 'Calidad del servicio técnico', peso: 0.3 },
    { nombre: 'Puntualidad y cumplimiento de programa', peso: 0.25 },
    { nombre: 'Disponibilidad de servicio', peso: 0.15 },
  ],
  seguros: [
    { nombre: 'Costos y condiciones de pago', peso: 0.1 },
    { nombre: 'Servicio y atención al cliente', peso: 0.15 },
    { nombre: 'Cumplimiento documental / legal-fiscal', peso: 0.3 },
    { nombre: 'Cobertura y condiciones de la póliza', peso: 0.25 },
    { nombre: 'Tiempo de respuesta ante siniestros', peso: 0.15 },
    { nombre: 'Disponibilidad de servicio', peso: 0.05 },
  ],
  seguridad: [
    { nombre: 'Costos y condiciones de pago', peso: 0.05 },
    { nombre: 'Servicio y atención al cliente', peso: 0.1 },
    { nombre: 'Cumplimiento documental / legal-fiscal', peso: 0.2 },
    { nombre: 'Eficacia operativa (Food Defense SQF)', peso: 0.35 },
    { nombre: 'Puntualidad y cobertura del servicio', peso: 0.2 },
    { nombre: 'Disponibilidad de personal', peso: 0.1 },
  ],
  montacargas: [
    { nombre: 'Costos y condiciones de pago', peso: 0.1 },
    { nombre: 'Servicio y atención al cliente', peso: 0.15 },
    { nombre: 'Cumplimiento documental / legal-fiscal', peso: 0.15 },
    { nombre: 'Estado y calidad del equipo', peso: 0.3 },
    { nombre: 'Puntualidad y cumplimiento de entrega', peso: 0.2 },
    { nombre: 'Disponibilidad de equipo / flota', peso: 0.1 },
  ],
}

export function criteriosDe(categoria: string): CriterioConfig[] {
  return CRITERIOS_POR_CATEGORIA[categoria] ?? CRITERIOS_POR_CATEGORIA.transporte
}

export function mesesPorPeriodicidad(periodicidad: string): number {
  if (periodicidad === 'bimestral') return 2
  if (periodicidad === 'trimestral') return 3
  if (periodicidad === 'semestral') return 6
  return 3
}
