// Roles vigentes: coordinador_sgi, director, gerente, jefe, supervisor,
// auxiliar, montacarguista (auxiliar_sgi y ejecutivo quedaron descontinuados
// como roles de sistema, aunque "Auxiliar del SGI" sigue existiendo como puesto)

export const ROLES_LIMITADOS = ['director', 'gerente', 'jefe', 'supervisor', 'auxiliar', 'montacarguista']

export function esCoordinador(rol: string) {
  return rol === 'coordinador_sgi'
}

export function esRolLimitado(rol: string) {
  return ROLES_LIMITADOS.includes(rol)
}

export const ROL_LABEL: Record<string, string> = {
  coordinador_sgi: 'Coordinador SGI',
  director: 'Director',
  gerente: 'Gerente',
  jefe: 'Jefe',
  supervisor: 'Supervisor',
  auxiliar: 'Auxiliar',
  montacarguista: 'Montacarguista',
}
