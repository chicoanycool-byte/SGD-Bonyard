export type ItemCierre = {
  creado_en: string
  fecha_cierre: string | null
  fecha_limite: string | null // fecha compromiso o fecha límite, según el módulo
  cerrada: boolean
}

export type PuntoIndicador = {
  etiqueta: string
  total: number
  enTiempo: number
  porcentaje: number | null
  semaforo: 'verde' | 'amarillo' | 'rojo' | 'sin_dato'
}

function trimestreDe(fecha: Date) {
  return Math.floor(fecha.getMonth() / 3) + 1
}

export function calcularIndicadorTrimestral(
  items: ItemCierre[],
  meta: number
): PuntoIndicador[] {
  const ahora = new Date()
  const trimestres: { etiqueta: string; anio: number; q: number }[] = []
  for (let i = 3; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i * 3, 1)
    const q = trimestreDe(fecha)
    const etiqueta = `Q${q} ${fecha.getFullYear()}`
    if (!trimestres.some((t) => t.etiqueta === etiqueta)) {
      trimestres.push({ etiqueta, anio: fecha.getFullYear(), q })
    }
  }

  return trimestres.map(({ etiqueta, anio, q }) => {
    const delTrimestre = items.filter((it) => {
      const f = new Date(it.creado_en)
      return f.getFullYear() === anio && trimestreDe(f) === q
    })

    const total = delTrimestre.length
    const enTiempo = delTrimestre.filter(
      (it) =>
        it.cerrada &&
        it.fecha_cierre &&
        it.fecha_limite &&
        new Date(it.fecha_cierre) <= new Date(it.fecha_limite + 'T23:59:59')
    ).length

    const porcentaje = total > 0 ? Math.round((enTiempo / total) * 100) : null
    let semaforo: PuntoIndicador['semaforo'] = 'sin_dato'
    if (porcentaje !== null) {
      semaforo = porcentaje >= meta ? 'verde' : porcentaje >= meta - 20 ? 'amarillo' : 'rojo'
    }

    return { etiqueta, total, enTiempo, porcentaje, semaforo }
  })
}
