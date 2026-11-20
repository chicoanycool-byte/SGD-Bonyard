export const TIPOS_CAMBIO: Record<string, string> = {
  proceso: 'Proceso u operación',
  producto: 'Producto o servicio',
  ingrediente_empaque_etiqueta: 'Materia prima, empaque o etiqueta del cliente',
  equipo_instalaciones: 'Equipo o instalaciones',
  proveedor: 'Proveedor o servicio contratado',
  sgi_documentos: 'Documentos del SGI',
  personal_organizacion: 'Personal u organización',
  otro: 'Otro',
}

export const ESTATUS_CAMBIO: Record<string, { label: string; clase: string }> = {
  solicitado: { label: 'Solicitado', clase: 'bg-amber-100 text-amber-800' },
  aprobado: { label: 'Aprobado', clase: 'bg-sky-100 text-sky-800' },
  rechazado: { label: 'Rechazado', clase: 'bg-red-100 text-red-800' },
  implementado: { label: 'Implementado', clase: 'bg-violet-100 text-violet-800' },
  cerrado: { label: 'Cerrado', clase: 'bg-emerald-100 text-emerald-800' },
}

export const RIESGO_CAMBIO: Record<string, string> = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }
