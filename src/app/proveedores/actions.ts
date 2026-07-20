'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requerirUsuario } from '@/lib/auth'
import { enviarCorreo } from '@/lib/email'
import { criteriosDe, mesesPorPeriodicidad, CATEGORIA_LABEL } from '@/lib/criteriosProveedores'

const ROLES_GESTION = ['coordinador_sgi']

export type EstadoProveedor = { error?: string; ok?: boolean }

export async function crearProveedor(
  _prevState: EstadoProveedor,
  formData: FormData
): Promise<EstadoProveedor> {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) return { error: 'No autorizado.' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const correo = String(formData.get('correo') ?? '').trim()
  const categoria = String(formData.get('categoria') ?? '')
  const productoServicio = String(formData.get('producto_servicio') ?? '').trim()
  const periodicidad = String(formData.get('periodicidad') ?? '')

  if (!nombre || !categoria || !periodicidad) {
    return { error: 'Nombre, categoría y periodicidad son obligatorios.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('proveedores').insert({
    nombre,
    correo: correo || null,
    categoria,
    producto_servicio: productoServicio || null,
    periodicidad,
    creado_por: quien.id,
  })

  if (error) return { error: 'No se pudo dar de alta. ' + error.message }

  revalidatePath('/proveedores')
  return { ok: true }
}

export async function editarCorreoProveedor(proveedorId: string, correo: string) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()
  await supabase.from('proveedores').update({ correo: correo || null }).eq('id', proveedorId)
  revalidatePath(`/proveedores/${proveedorId}`)
}

export async function enviarNotificacionDesempeno(proveedorId: string) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()

  const { data: proveedor } = await supabase
    .from('proveedores')
    .select('nombre, correo, categoria')
    .eq('id', proveedorId)
    .single()

  if (!proveedor) throw new Error('Proveedor no encontrado.')
  if (!proveedor.correo) throw new Error('Este proveedor no tiene correo registrado.')

  const anio = new Date().getFullYear()
  const { data: evaluaciones } = await supabase
    .from('evaluaciones_proveedor')
    .select('fecha_evaluacion, calificacion_pct, clasificacion, es_na, observaciones')
    .eq('proveedor_id', proveedorId)
    .gte('fecha_evaluacion', `${anio}-01-01`)
    .lte('fecha_evaluacion', `${anio}-12-31`)
    .order('fecha_evaluacion')

  const validas = (evaluaciones ?? []).filter((e) => !e.es_na && e.calificacion_pct !== null)
  const promedio =
    validas.length > 0
      ? Math.round(
          (validas.reduce((acc, e) => acc + Number(e.calificacion_pct), 0) / validas.length) * 100
        )
      : null
  const clasificacionFinal = promedio !== null ? (promedio >= 81 ? 'TIPO A' : 'TIPO B') : 'Sin evaluaciones suficientes'

  const filasHtml = (evaluaciones ?? [])
    .map(
      (e) =>
        `<tr><td>${new Date(e.fecha_evaluacion).toLocaleDateString('es-MX')}</td><td>${
          e.es_na ? 'N/A' : Math.round(Number(e.calificacion_pct) * 100) + '%'
        }</td><td>${e.observaciones ?? '—'}</td></tr>`
    )
    .join('')

  const html = `
    <p>Estimado proveedor <strong>${proveedor.nombre}</strong>,</p>
    <p>De acuerdo con nuestro Procedimiento de Selección y Evaluación de Proveedores Críticos (PCO-02), les compartimos el resumen cuantitativo de su desempeño durante ${anio}:</p>
    <p><strong>Calificación promedio anual: ${promedio !== null ? promedio + '%' : 'N/D'} — Clasificación: ${clasificacionFinal}</strong></p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><th>Fecha</th><th>Calificación</th><th>Observaciones</th></tr>
      ${filasHtml || '<tr><td colspan="3">Sin evaluaciones registradas en el periodo.</td></tr>'}
    </table>
    <p>${
      clasificacionFinal === 'TIPO A'
        ? 'Reconocemos su desempeño consistente como proveedor crítico aprobado. Le invitamos a mantener estos estándares.'
        : clasificacionFinal === 'TIPO B'
          ? 'Le solicitamos revisar las áreas de oportunidad señaladas en las observaciones, ya que su calificación se encuentra por debajo del umbral requerido (81%). Quedamos atentos a su plan de mejora.'
          : 'Aún no contamos con evaluaciones suficientes en el periodo para emitir una clasificación definitiva.'
    }</p>
    <p>Saludos,<br/>Coordinación del SGI — BONYARD Servicios</p>
  `

  await enviarCorreo([proveedor.correo], `Resumen anual de desempeño ${anio} — BONYARD Servicios`, html)

  revalidatePath(`/proveedores/${proveedorId}`)
}

export async function registrarEvaluacion(proveedorId: string, formData: FormData) {
  const quien = await requerirUsuario()
  if (!ROLES_GESTION.includes(quien.rol)) throw new Error('No autorizado.')

  const supabase = await createClient()

  const { data: proveedor } = await supabase
    .from('proveedores')
    .select('categoria, nombre')
    .eq('id', proveedorId)
    .single()
  if (!proveedor) throw new Error('Proveedor no encontrado.')

  const fecha = String(formData.get('fecha_evaluacion') ?? '')
  const esNa = formData.get('es_na') === 'on'
  const observaciones = String(formData.get('observaciones') ?? '').trim()

  if (!fecha) throw new Error('La fecha de evaluación es obligatoria.')

  const criterios = criteriosDe(proveedor.categoria)
  const valores = criterios.map((_, i) => {
    const v = formData.get(`criterio_${i + 1}`)
    return v === null || v === '' ? null : Number(v)
  })

  let puntajePonderado: number | null = null
  let calificacionPct: number | null = null
  let clasificacion: 'tipo_a' | 'tipo_b' | null = null

  if (!esNa && valores.every((v) => v !== null)) {
    puntajePonderado = criterios.reduce(
      (acc, c, i) => acc + (valores[i] as number) * c.peso,
      0
    )
    calificacionPct = Math.round((puntajePonderado / 10) * 10000) / 10000
    clasificacion = calificacionPct >= 0.81 ? 'tipo_a' : 'tipo_b'
  }

  const { error } = await supabase.from('evaluaciones_proveedor').insert({
    proveedor_id: proveedorId,
    fecha_evaluacion: fecha,
    es_na: esNa,
    criterio_1: valores[0],
    criterio_2: valores[1],
    criterio_3: valores[2],
    criterio_4: valores[3],
    criterio_5: valores[4],
    criterio_6: valores[5],
    puntaje_ponderado: puntajePonderado,
    calificacion_pct: calificacionPct,
    clasificacion,
    requiere_reevaluacion: clasificacion === 'tipo_b',
    observaciones: observaciones || null,
    evaluado_por: quien.id,
  })

  if (error) throw new Error('No se pudo guardar la evaluación: ' + error.message)

  if (clasificacion === 'tipo_b') {
    const { data: coordinadores } = await supabase
      .from('usuarios')
      .select('id, correo')
      .eq('rol', 'coordinador_sgi')
      .eq('estatus', 'activo')

    if (coordinadores && coordinadores.length > 0) {
      const mensaje = `El proveedor "${proveedor.nombre}" (${CATEGORIA_LABEL[proveedor.categoria]}) obtuvo TIPO B en su evaluación y requiere plan de mejora.`
      await supabase.from('notificaciones').insert(
        coordinadores.map((c) => ({ usuario_id: c.id, tipo: 'proveedor' as const, mensaje }))
      )
      await enviarCorreo(
        coordinadores.map((c) => c.correo),
        'Proveedor requiere plan de mejora — SGD Bonyard',
        `<p>${mensaje}</p>`
      )
    }
  }

  revalidatePath(`/proveedores/${proveedorId}`)
  revalidatePath('/proveedores')
}

export async function generarAccionDesdeEvaluacion(evaluacionId: string) {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()
  const { data: evaluacion } = await supabase
    .from('evaluaciones_proveedor')
    .select('id, calificacion_pct, observaciones, proveedor:proveedores(nombre, categoria)')
    .eq('id', evaluacionId)
    .single()

  if (!evaluacion) throw new Error('No encontrada.')
  const proveedor = evaluacion.proveedor as unknown as { nombre: string; categoria: string } | null

  const { data: accion } = await supabase
    .from('acciones_correctivas')
    .insert({
      origen: 'manual',
      descripcion: `Plan de mejora — proveedor "${proveedor?.nombre}" (${CATEGORIA_LABEL[proveedor?.categoria ?? ''] ?? ''}), calificación ${Math.round((evaluacion.calificacion_pct ?? 0) * 100)}%.${evaluacion.observaciones ? ' ' + evaluacion.observaciones : ''}`,
      estatus: 'abierta',
      creado_por: quien.id,
    })
    .select('id')
    .single()

  if (accion) {
    await supabase
      .from('evaluaciones_proveedor')
      .update({ accion_correctiva_id: accion.id })
      .eq('id', evaluacionId)
  }

  revalidatePath('/proveedores')
  revalidatePath('/ac-ap')
}

export async function enviarRecordatoriosEvaluacion() {
  const quien = await requerirUsuario()
  if (quien.rol !== 'coordinador_sgi') throw new Error('No autorizado.')

  const supabase = await createClient()

  const { data: proveedores } = await supabase
    .from('proveedores')
    .select('id, nombre, periodicidad')
    .eq('estatus', 'activo')

  const { data: coordinadores } = await supabase
    .from('usuarios')
    .select('id')
    .eq('rol', 'coordinador_sgi')
    .eq('estatus', 'activo')

  let enviados = 0
  for (const prov of proveedores ?? []) {
    const { data: ultima } = await supabase
      .from('evaluaciones_proveedor')
      .select('fecha_evaluacion')
      .eq('proveedor_id', prov.id)
      .order('fecha_evaluacion', { ascending: false })
      .limit(1)
      .maybeSingle()

    const meses = mesesPorPeriodicidad(prov.periodicidad)
    const proximaFecha = ultima
      ? new Date(ultima.fecha_evaluacion)
      : new Date(0)
    proximaFecha.setMonth(proximaFecha.getMonth() + meses)

    if (proximaFecha <= new Date()) {
      const mensaje = `Toca evaluar al proveedor "${prov.nombre}" (periodicidad ${prov.periodicidad}).`
      if (coordinadores && coordinadores.length > 0) {
        await supabase.from('notificaciones').insert(
          coordinadores.map((c) => ({ usuario_id: c.id, tipo: 'proveedor' as const, mensaje }))
        )
        await supabase.from('pendientes').insert(
          coordinadores.map((c) => ({ usuario_id: c.id, modulo: 'proveedores', descripcion: mensaje }))
        )
      }
      enviados++
    }
  }

  revalidatePath('/proveedores')
  revalidatePath('/pendientes')
  return enviados
}
