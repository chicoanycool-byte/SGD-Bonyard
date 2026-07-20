const MODEL = 'claude-sonnet-5'

async function llamarClaude(prompt: string, maxTokens: number): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!respuesta.ok) return null

    const data = await respuesta.json()
    const texto = data.content
      ?.filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('\n')
    return texto || null
  } catch {
    return null
  }
}

export async function sugerirTipoNC(descripcion: string): Promise<{
  tipo_nc: 'mayor' | 'menor' | 'critica'
  justificacion: string
} | null> {
  const prompt = `Eres el Coordinador del SGI de BONYARD Servicios (3PL de logística de grado alimenticio, SQF/ISO 9001:2015).

Clasifica el siguiente hallazgo/no conformidad según su severidad:

"${descripcion}"

Responde SOLO con un JSON válido (sin markdown):
{"tipo_nc": "critica" | "mayor" | "menor", "justificacion": "una frase breve"}

Reglas: "critica" = riesgo inmediato a inocuidad, seguridad o incumplimiento legal grave. "mayor" = incumplimiento sistémico, repetido, o de alto impacto operativo/al cliente. "menor" = desviación puntual, aislada, bajo impacto.`

  const texto = await llamarClaude(prompt, 200)
  if (!texto) return null

  try {
    const limpio = texto.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
    const json = JSON.parse(limpio)
    if (!['critica', 'mayor', 'menor'].includes(json.tipo_nc)) return null
    return { tipo_nc: json.tipo_nc, justificacion: json.justificacion ?? '' }
  } catch {
    return null
  }
}

export type RevisionAC = {
  recomendacion: 'liberar' | 'no_liberar'
  justificacion: string
  observaciones: string[]
}

export async function revisarAccionCorrectiva(datos: {
  descripcion: string
  definicionProblema: string | null
  causaRaiz: string | null
  medidasContencion: string
  planTrabajo: string
  evidenciaCierre: string | null
}): Promise<RevisionAC | null> {
  const prompt = `Eres el Coordinador del SGI de BONYARD Servicios (3PL de logística de grado alimenticio, SQF/ISO 9001:2015), revisando una Acción Correctiva (FSG-09) antes de autorizar su cierre.

Descripción del hallazgo: ${datos.descripcion}
Definición del problema: ${datos.definicionProblema || 'No capturada'}
Causa raíz identificada: ${datos.causaRaiz || 'No capturada'}
Medidas de contención: ${datos.medidasContencion || 'No capturadas'}
Plan de trabajo (acción correctiva permanente): ${datos.planTrabajo || 'No capturado'}
Evidencia de cierre reportada por el responsable: ${datos.evidenciaCierre || 'No capturada'}

Evalúa si la acción correctiva está bien fundamentada: ¿la causa raíz es específica y no superficial?, ¿las acciones atacan la causa raíz (no solo el síntoma)?, ¿hay evidencia objetiva y suficiente de cierre?

Responde SOLO con un JSON válido (sin markdown) con este formato:
{"recomendacion": "liberar" | "no_liberar", "justificacion": "una frase breve explicando la recomendación", "observaciones": ["observación breve 1", "observación breve 2"]}

Si falta información clave (causa raíz vacía, sin evidencia de cierre, plan de trabajo vacío), recomienda "no_liberar". Máximo 3 observaciones.`

  const texto = await llamarClaude(prompt, 700)
  if (!texto) return null

  try {
    const limpio = texto.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
    return JSON.parse(limpio)
  } catch {
    return null
  }
}

export type SugerenciaLegal = {
  tipo: 'nueva_norma' | 'actualizacion'
  titulo: string
  descripcion: string
  norma_relacionada: string
  articulo: string | null
  requisito_legal: string | null
}

export async function analizarMatrizLegal(
  normasActuales: string[]
): Promise<SugerenciaLegal[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []

  const prompt = `Eres un abogado corporativo experto en cumplimiento normativo para empresas 3PL de logística de grado alimenticio en México (Querétaro), certificadas bajo SQF e ISO 9001:2015.

Estas son las normas/leyes/reglamentos actualmente contempladas en la Matriz de Requisitos Legales (FSG-19) de la empresa:
${normasActuales.map((n) => `- ${n}`).join('\n')}

Investiga (usa búsqueda web si es necesario) si:
1. Alguna de estas normas ha sido actualizada, sustituida o cancelada recientemente (nueva versión NOM, cambio de referencia, etc.)
2. Existe alguna norma, NOM, ley o reglamento mexicano aplicable a almacenes/3PL de grado alimenticio en México que NO esté en la lista y debería considerarse

Responde SOLO con un JSON válido (sin markdown, sin texto adicional) con este formato exacto, un array de sugerencias (máximo 8, prioriza las más relevantes y con mayor certeza):
[{"tipo": "nueva_norma" | "actualizacion", "titulo": "nombre corto de la norma o cambio", "descripcion": "explicación breve de por qué se sugiere (2-3 líneas)", "norma_relacionada": "norma actual que reemplaza o se relaciona, o vacío si es nueva", "articulo": "artículo relevante si aplica o null", "requisito_legal": "redacción breve del requisito legal a cumplir, o null"}]

Si no encuentras nada relevante, responde con un array vacío [].`

  try {
    const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }),
    })

    if (!respuesta.ok) return []

    const data = await respuesta.json()
    const texto = data.content
      ?.filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('\n')

    if (!texto) return []

    const limpio = texto.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
    const inicio = limpio.indexOf('[')
    const fin = limpio.lastIndexOf(']')
    if (inicio === -1 || fin === -1) return []

    const json = JSON.parse(limpio.slice(inicio, fin + 1))
    if (!Array.isArray(json)) return []
    return json
  } catch {
    return []
  }
}

export type MensajeChat = { role: 'user' | 'assistant'; content: string }

export async function chatAsesorSGI(
  historial: MensajeChat[],
  catalogoDocumentos: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return 'El asesor todavía no está disponible: falta configurar la conexión con la IA. Pide al Coordinador SGI que agregue la API key de Anthropic.'
  }

  const systemPrompt = `Eres "Tu Asesor", el asistente interno del Sistema de Gestión Documental (SGD) de BONYARD Servicios, una empresa 3PL de logística de grado alimenticio certificada bajo SQF e ISO 9001:2015 (casa certificadora Global Standard).

Actúas como el Gerente del Sistema de Gestión Integral (SGI) senior de la empresa: más de 15 años de experiencia en implementación, auditoría y certificación bajo SQF e ISO 9001:2015, especialista en gestión documental, auditorías, análisis de riesgos, KPIs y mejora continua.

Estás disponible para TODO el personal de la organización, desde el Coordinador SGI hasta operadores de piso. Ajusta tu lenguaje según quien pregunte: técnico y normativo si la pregunta lo amerita, sencillo y claro si es personal operativo.

Ayudas con:
- Dudas sobre requisitos de SQF e ISO 9001:2015
- Procedimientos, formatos y documentos internos del SGI (catálogo abajo)
- Buenas Prácticas de Almacenamiento (BPA) e inocuidad alimentaria
- Cómo usar los módulos del sistema SGD Bonyard (Documentos, Solicitudes, Auditorías, Quejas, AC/AP, Indicadores, Proveedores, Recorridos BPA, Verificación del SGI)
- Orientación general de calidad, mejora continua y cultura de inocuidad

Si preguntan algo fuera de tu ámbito (nómina, temas personales, IT no relacionado a SGI), redirige amablemente al área correspondiente.

Sé breve y directo salvo que la pregunta requiera una explicación más completa. No inventes números de cláusula o contenido de documentos que no conozcas con certeza; si no estás seguro del contenido exacto de un documento, dilo y sugiere consultarlo en el módulo Documentos.

Catálogo actual de documentos del SGI (código — nombre):
${catalogoDocumentos || 'Sin documentos cargados todavía.'}`

  try {
    const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system: systemPrompt,
        messages: historial,
      }),
    })

    if (!respuesta.ok) {
      return 'Tu Asesor no pudo responder en este momento. Intenta de nuevo en unos segundos.'
    }

    const data = await respuesta.json()
    const texto = data.content
      ?.filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('\n')

    return texto || 'No pude generar una respuesta. Intenta reformular tu pregunta.'
  } catch {
    return 'Tu Asesor no pudo responder por un error de conexión. Intenta de nuevo.'
  }
}

export type ClasificacionHallazgo = {
  conformidad: 'conforme' | 'no_conforme' | 'oportunidad_mejora'
  tipo_nc: 'mayor' | 'menor' | 'oportunidad_mejora' | null
  justificacion: string
}

export async function clasificarHallazgo(
  requisito: string,
  evidencia: string
): Promise<ClasificacionHallazgo | null> {
  const prompt = `Eres un auditor experto en ISO 9001:2015 y SQF para una empresa 3PL de logística.

Analiza el siguiente hallazgo de auditoría y clasifícalo.

Requisito auditado: ${requisito}
Evidencia observada: ${evidencia}

Responde SOLO con un JSON válido (sin markdown, sin texto adicional) con este formato exacto:
{"conformidad": "conforme" | "no_conforme" | "oportunidad_mejora", "tipo_nc": "mayor" | "menor" | "oportunidad_mejora" | null, "justificacion": "una frase breve explicando por qué"}

Reglas:
- "conforme": la evidencia cumple el requisito sin desviaciones. tipo_nc debe ser null.
- "no_conforme": hay incumplimiento real del requisito. Clasifica tipo_nc como "mayor" (incumplimiento sistémico, repetido, o ausencia total de evidencia/control) o "menor" (desviación puntual, aislada, de bajo impacto).
- "oportunidad_mejora": cumple el requisito pero hay margen de mejora, sin ser una no conformidad. En este caso usa conformidad="oportunidad_mejora" y tipo_nc="oportunidad_mejora".`

  const texto = await llamarClaude(prompt, 300)
  if (!texto) return null

  try {
    const limpio = texto.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
    const json = JSON.parse(limpio)
    return {
      conformidad: json.conformidad,
      tipo_nc: json.tipo_nc ?? null,
      justificacion: json.justificacion ?? '',
    }
  } catch {
    return null
  }
}

export type ClasificacionQueja = {
  escala_ac: boolean
  criticidad: 'alta' | 'media' | 'baja' | null
  justificacion: string
}

export async function clasificarQueja(
  descripcion: string,
  tipoQueja: string,
  servicio: string
): Promise<ClasificacionQueja | null> {
  const prompt = `Eres el Coordinador del SGI de BONYARD Servicios, una empresa 3PL de logística, y debes decidir si una queja de cliente requiere escalarse a Acción Correctiva, según el procedimiento PSG-03, y clasificar su criticidad.

Queja recibida:
- Servicio: ${servicio}
- Tipo de queja: ${tipoQueja}
- Descripción: ${descripcion}

Matriz de decisión del PSG-03 (aplica exactamente estos criterios):
REQUIERE ACCIÓN CORRECTIVA si la queja evidencia: reincidencia de la misma queja, queja repetitiva del mismo proceso, impacto a inocuidad, riesgo regulatorio o legal, reclamo formal del cliente (evaluar caso), falla del proceso documentada, corrección previa no eficaz, tendencia negativa identificada, o queja clasificada como mayor/crítica.

SOLO CORRECCIÓN (no requiere AC) si es: evento aislado, error administrativo menor, error humano puntual sin recurrencia, o impacto menor sin afectación al cliente.

Para la criticidad usa: "alta" (impacto a inocuidad, riesgo regulatorio, o afectación grave al cliente/embarque), "media" (afecta el servicio pero es corregible sin mayor impacto), "baja" (evento menor, administrativo, sin impacto real).

Responde SOLO con un JSON válido (sin markdown) con este formato:
{"escala_ac": true | false, "criticidad": "alta" | "media" | "baja", "justificacion": "una frase breve citando el criterio del PSG-03 que aplica"}`

  const texto = await llamarClaude(prompt, 300)
  if (!texto) return null

  try {
    const limpio = texto.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
    const json = JSON.parse(limpio)
    return {
      escala_ac: !!json.escala_ac,
      criticidad: ['alta', 'media', 'baja'].includes(json.criticidad) ? json.criticidad : null,
      justificacion: json.justificacion ?? '',
    }
  } catch {
    return null
  }
}

export async function comentarIndicador(
  nombre: string,
  metaTexto: string,
  valor: number,
  cumple: boolean
): Promise<string | null> {
  if (cumple) return null
  const prompt = `Eres el Coordinador del SGI de BONYARD Servicios (empresa 3PL de logística).

El indicador "${nombre}" tiene meta ${metaTexto} y el valor capturado este período es ${valor}, por lo que NO cumple la meta.

Redacta en una sola frase breve (máximo 25 palabras) una recomendación de seguimiento o acción a tomar. Responde solo con la frase, sin comillas ni formato.`

  return await llamarClaude(prompt, 100)
}

export type ResumenInforme = {
  resumen: string
  conclusiones: string
}

export async function generarResumenInforme(
  datos: {
    fecha: string
    norma: string
    tipo: string
    proceso: string | null
    auditorLider: string | null
    auditado: string | null
    observaciones: string | null
  },
  hallazgos: {
    requisito: string
    evidencia: string | null
    conformidad: string
    tipo_nc: string | null
    comentario: string | null
  }[]
): Promise<ResumenInforme> {
  const conformes = hallazgos.filter((h) => h.conformidad === 'conforme').length
  const noConformes = hallazgos.filter((h) => h.conformidad === 'no_conforme').length
  const oportunidades = hallazgos.filter((h) => h.conformidad === 'oportunidad_mejora').length

  const prompt = `Eres un auditor experto en sistemas de gestión de calidad (ISO 9001:2015 y SQF) para BONYARD Servicios, empresa 3PL de logística.

Con base en estos datos de auditoría, redacta dos textos breves y profesionales en español (sin markdown, texto plano):

Datos:
- Fecha: ${datos.fecha}
- Norma: ${datos.norma}
- Tipo: ${datos.tipo}
- Proceso auditado: ${datos.proceso ?? 'N/A'}
- Auditor líder: ${datos.auditorLider ?? 'N/A'}
- Auditado: ${datos.auditado ?? 'N/A'}
- Observaciones previas: ${datos.observaciones ?? 'Ninguna'}
- Total hallazgos: ${hallazgos.length} (${conformes} conformes, ${noConformes} no conformes, ${oportunidades} oportunidades de mejora)

Hallazgos:
${hallazgos.map((h, i) => `${i + 1}. [${h.conformidad}${h.tipo_nc ? '/' + h.tipo_nc : ''}] ${h.requisito} — ${h.evidencia ?? 'N/A'}${h.comentario ? ' (' + h.comentario + ')' : ''}`).join('\n')}

Responde SOLO con un JSON válido (sin markdown) con este formato:
{"resumen": "párrafo de 3-5 líneas resumiendo el desarrollo y hallazgos generales de la auditoría", "conclusiones": "párrafo de 2-4 líneas con la conclusión general y siguiente paso recomendado"}`

  const texto = await llamarClaude(prompt, 800)

  if (!texto) {
    return {
      resumen: `Se auditaron ${hallazgos.length} puntos del proceso ${datos.proceso ?? ''}, de los cuales ${conformes} resultaron conformes, ${noConformes} no conformes y ${oportunidades} se identificaron como oportunidades de mejora.`,
      conclusiones: noConformes > 0
        ? 'Se requiere dar seguimiento a las no conformidades identificadas mediante el plan de reacción correspondiente.'
        : 'No se identificaron no conformidades. Se recomienda dar seguimiento a las oportunidades de mejora detectadas.',
    }
  }

  try {
    const limpio = texto.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '')
    const json = JSON.parse(limpio)
    return {
      resumen: json.resumen ?? '',
      conclusiones: json.conclusiones ?? '',
    }
  } catch {
    return { resumen: texto, conclusiones: '' }
  }
}
