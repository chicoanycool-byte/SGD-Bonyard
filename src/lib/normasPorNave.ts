// Normas de certificación vigentes por nave (nov 2026):
// Nave 1 solo ISO 9001:2015; Nave 2 ISO 9001:2015 y SQF.
export const NORMAS_NAVE_1 = ['iso_9001']

export function normaPermitida(nave: string | null | undefined, norma: string) {
  if (nave === 'Nave 1') return NORMAS_NAVE_1.includes(norma)
  return true
}

export const MENSAJE_NAVE_1_SOLO_ISO =
  'Nave 1 solo se certifica en ISO 9001:2015. Para SQF elige Nave 2.'
