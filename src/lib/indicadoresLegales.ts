export type RequisitoLegalSimple = { numero: number; evidencia: string | null }

export type IndicadorLegal = {
  numero: number
  nombre: string
  objetivo: string
  unidad: string
  frecuencia: string
  meta: string
  resultado: number | null // 0-1 para %, o cantidad para "Cant."
  resultadoTexto: string
  semaforo: 'verde' | 'amarillo' | 'rojo' | 'sin_dato'
  fuente: string
  interpretacion: string
}

function ev(reqs: RequisitoLegalSimple[], numero: number): string | null {
  return reqs.find((r) => r.numero === numero)?.evidencia ?? null
}

function esSI(reqs: RequisitoLegalSimple[], numero: number) {
  return ev(reqs, numero) === 'SI'
}
function esNO(reqs: RequisitoLegalSimple[], numero: number) {
  return ev(reqs, numero) === 'NO'
}
function esNA(reqs: RequisitoLegalSimple[], numero: number) {
  return ev(reqs, numero) === 'NA'
}

export function calcularIndicadoresLegales(reqs: RequisitoLegalSimple[]): IndicadorLegal[] {
  const totalReq = 78

  const totalSI = reqs.filter((r) => r.evidencia === 'SI').length
  const totalNA = reqs.filter((r) => r.evidencia === 'NA').length
  const totalVacio = reqs.filter((r) => !r.evidencia).length

  // 1) % Cumplimiento Legal Global
  const denom1 = totalReq - totalNA - totalVacio
  const g1 = denom1 > 0 ? totalSI / denom1 : null
  const ind1: IndicadorLegal = {
    numero: 1,
    nombre: 'Porcentaje de Cumplimiento Legal Global',
    objetivo: 'Medir el nivel global de cumplimiento con todos los requisitos legales aplicables.',
    unidad: '%',
    frecuencia: 'Mensual',
    meta: '≥ 85%',
    resultado: g1,
    resultadoTexto: g1 !== null ? `${Math.round(g1 * 100)}%` : 'Sin dato',
    semaforo: g1 === null ? 'sin_dato' : g1 >= 0.85 ? 'verde' : g1 >= 0.68 ? 'amarillo' : 'rojo',
    fuente: 'Matriz FSG-19 col. Evidencia',
    interpretacion: `Resultado actual: ${g1 !== null ? Math.round(g1 * 100) + '%' : 'sin dato'}. Si baja de 85%: emitir acciones correctivas.`,
  }

  // 2) Requisitos sin evidencia
  const g2 = totalVacio
  const ind2: IndicadorLegal = {
    numero: 2,
    nombre: 'Requisitos Sin Evidencia Capturada',
    objetivo: 'Asegurar que todos los requisitos tengan evidencia clasificada (SI/NO/NA).',
    unidad: 'Cant.',
    frecuencia: 'Mensual',
    meta: '= 0',
    resultado: g2,
    resultadoTexto: String(g2),
    semaforo: g2 <= 0 ? 'verde' : g2 <= 2 ? 'amarillo' : 'rojo',
    fuente: 'Matriz FSG-19 celdas vacías',
    interpretacion: 'Cada requisito vacío = brecha desconocida. Plazo: 30 días.',
  }

  // 3) Hallazgos críticos abiertos (filas específicas)
  const criticos = [50, 63, 64, 65, 69, 70, 81].filter((n) => esNO(reqs, n)).length
  const ind3: IndicadorLegal = {
    numero: 3,
    nombre: 'Hallazgos Críticos Abiertos',
    objetivo: 'Controlar y eliminar incumplimientos de mayor riesgo legal.',
    unidad: 'Cant.',
    frecuencia: 'Mensual',
    meta: '= 0',
    resultado: criticos,
    resultadoTexto: String(criticos),
    semaforo: criticos <= 0 ? 'verde' : criticos <= 2 ? 'amarillo' : 'rojo',
    fuente: 'Matriz FSG-19 filas con NO (normas críticas)',
    interpretacion: `Actual: ${criticos} críticos. Cada uno requiere AC en ≤ 30 días.`,
  }

  // 4) Hallazgos mayores abiertos (fijo en 0 en el archivo original)
  const ind4: IndicadorLegal = {
    numero: 4,
    nombre: 'Hallazgos Mayores Abiertos',
    objetivo: 'Reducir incumplimientos de riesgo alto.',
    unidad: 'Cant.',
    frecuencia: 'Mensual',
    meta: '= 0',
    resultado: 0,
    resultadoTexto: '0',
    semaforo: 'verde',
    fuente: 'Matriz FSG-19 filas con NO (normas mayores)',
    interpretacion: 'Actual: 0 mayores. Cerrar en ≤ 60 días.',
  }

  // 5) NOM-001-STPS Edificios (numero 13-31, 19 requisitos)
  const rango5 = Array.from({ length: 19 }, (_, i) => i + 13)
  const si5 = rango5.filter((n) => esSI(reqs, n)).length
  const na5 = rango5.filter((n) => esNA(reqs, n)).length
  const denom5 = 19 - na5
  const g5 = denom5 > 0 ? si5 / denom5 : null
  const ind5: IndicadorLegal = {
    numero: 5,
    nombre: 'Cumplimiento NOM-001-STPS (Edificios)',
    objetivo: 'Seguridad estructural del almacén.',
    unidad: '%',
    frecuencia: 'Semestral',
    meta: '≥ 90%',
    resultado: g5,
    resultadoTexto: g5 !== null ? `${Math.round(g5 * 100)}%` : 'Sin dato',
    semaforo: g5 === null ? 'sin_dato' : g5 >= 0.9 ? 'verde' : g5 >= 0.72 ? 'amarillo' : 'rojo',
    fuente: 'NOM-001-STPS (19 req.)',
    interpretacion: 'Hallazgos físicos cierran con registro de mantenimiento PMT-01.',
  }

  // 6) NOM-019-STPS Comisión S&H (numerador fijo 0, denominador según NA de numero 50)
  const denom6 = 1 - (esNA(reqs, 50) ? 1 : 0)
  const g6 = denom6 !== 0 ? 0 / denom6 : null
  const ind6: IndicadorLegal = {
    numero: 6,
    nombre: 'Cumplimiento NOM-019-STPS (Comisión S&H)',
    objetivo: 'Constitución y operación de la Comisión Mixta de S&H.',
    unidad: '%',
    frecuencia: 'Mensual',
    meta: '= 100%',
    resultado: g6,
    resultadoTexto: g6 !== null ? `${Math.round(g6 * 100)}%` : 'Sin dato',
    semaforo: g6 === null ? 'sin_dato' : g6 >= 1 ? 'verde' : g6 >= 0.8 ? 'amarillo' : 'rojo',
    fuente: 'NOM-019-STPS (1 req.)',
    interpretacion: 'INCUMPLIMIENTO = sin comisión. Multa directa en inspección STPS. PRIORIDAD 1.',
  }

  // 7) NOM-035 Psicosociales
  const denom7 = 1 - (esNA(reqs, 64) ? 1 : 0)
  const g7 = denom7 !== 0 ? 0 / denom7 : null
  const ind7: IndicadorLegal = {
    numero: 7,
    nombre: 'Cumplimiento NOM-035-STPS (Psicosociales)',
    objetivo: 'Evaluación y control de factores de riesgo psicosocial.',
    unidad: '%',
    frecuencia: 'Anual',
    meta: '= 100%',
    resultado: g7,
    resultadoTexto: g7 !== null ? `${Math.round(g7 * 100)}%` : 'Sin dato',
    semaforo: g7 === null ? 'sin_dato' : g7 >= 1 ? 'verde' : g7 >= 0.8 ? 'amarillo' : 'rojo',
    fuente: 'NOM-035-STPS (1 req.)',
    interpretacion: 'Evidencia: cuestionario GPC-NOM-035 + resultados + medidas.',
  }

  // 8) NOM-251 BPH/Inocuidad (numero 74,75,76)
  const rango8 = [74, 75, 76]
  const si8 = rango8.filter((n) => esSI(reqs, n)).length
  const na8 = rango8.filter((n) => esNA(reqs, n)).length
  const denom8 = 3 - na8
  const g8 = denom8 > 0 ? si8 / denom8 : null
  const ind8: IndicadorLegal = {
    numero: 8,
    nombre: 'Cumplimiento NOM-251-SSA1 (BPH/Inocuidad)',
    objetivo: 'Buenas Prácticas de Higiene para almacén grado alimenticio.',
    unidad: '%',
    frecuencia: 'Semestral',
    meta: '≥ 90%',
    resultado: g8,
    resultadoTexto: g8 !== null ? `${Math.round(g8 * 100)}%` : 'Sin dato',
    semaforo: g8 === null ? 'sin_dato' : g8 >= 0.9 ? 'verde' : g8 >= 0.72 ? 'amarillo' : 'rojo',
    fuente: 'NOM-251-SSA1 (3 req.)',
    interpretacion: 'Norma base para SQF y auditorías de clientes de grado alimenticio.',
  }

  // 9) NOM-002 Incendios
  const si9 = esSI(reqs, 68) ? 1 : 0
  const na9 = [68, 69, 70].filter((n) => esNA(reqs, n)).length
  const denom9 = 3 - na9
  const g9 = denom9 > 0 ? si9 / denom9 : null
  const ind9: IndicadorLegal = {
    numero: 9,
    nombre: 'Cumplimiento NOM-002-STPS (Incendios)',
    objetivo: 'Medios de extinción, brigada y señalización contra incendio.',
    unidad: '%',
    frecuencia: 'Semestral',
    meta: '= 100%',
    resultado: g9,
    resultadoTexto: g9 !== null ? `${Math.round(g9 * 100)}%` : 'Sin dato',
    semaforo: g9 === null ? 'sin_dato' : g9 >= 1 ? 'verde' : g9 >= 0.8 ? 'amarillo' : 'rojo',
    fuente: 'NOM-002-STPS (3 req.)',
    interpretacion: 'Extintores y brigada son requisito crítico en SQF y Protección Civil.',
  }

  // 10) Protección Civil (PIPC)
  const denom10 = 1 - (esNA(reqs, 81) ? 1 : 0)
  const g10 = denom10 !== 0 ? 0 / denom10 : null
  const ind10: IndicadorLegal = {
    numero: 10,
    nombre: 'Cumplimiento Ley Protección Civil',
    objetivo: 'Programa Interno de Protección Civil (PIPC) registrado ante autoridad.',
    unidad: '%',
    frecuencia: 'Anual',
    meta: '= 100%',
    resultado: g10,
    resultadoTexto: g10 !== null ? `${Math.round(g10 * 100)}%` : 'Sin dato',
    semaforo: g10 === null ? 'sin_dato' : g10 >= 1 ? 'verde' : g10 >= 0.8 ? 'amarillo' : 'rojo',
    fuente: 'Ley Protección Civil (1 req.)',
    interpretacion: 'PIPC vencido = riesgo legal. Simulacros: mínimo 2/año con acta y fotografías.',
  }

  return [ind1, ind2, ind3, ind4, ind5, ind6, ind7, ind8, ind9, ind10]
}

export function resumenDashboard(reqs: RequisitoLegalSimple[]) {
  return {
    cumplen: reqs.filter((r) => r.evidencia === 'SI').length,
    incumplen: reqs.filter((r) => r.evidencia === 'NO').length,
    na: reqs.filter((r) => r.evidencia === 'NA').length,
    sinCapturar: reqs.filter((r) => !r.evidencia).length,
    criticos: [50, 63, 64, 65, 69, 70, 81].filter((n) => esNO(reqs, n)).length,
  }
}
