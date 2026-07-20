'use client'

import { useState, useTransition } from 'react'
import {
  guardarDefinicionProblema,
  guardarMedidasContencion,
  guardarAnalisisCausas,
  guardarPlanTrabajo,
} from '../actions'

type Usuario = { id: string; nombre: string }
type Medida = { accion: string; responsable: string; fecha: string; seguimiento: string }
type PlanItem = {
  actividad: string
  responsable: string
  fecha_termino: string
  seguimiento: string
  resultado_esperado: string
  verificacion_eficacia: string
}
type Causas = Record<
  'metodo' | 'mano_obra' | 'maquinaria' | 'materiales' | 'medio_ambiente' | 'otro',
  { texto: string; impacto: 'alto' | 'medio' | 'bajo' | '' }
>

const CATEGORIAS_CAUSA: { clave: keyof Causas; label: string }[] = [
  { clave: 'metodo', label: 'Método' },
  { clave: 'mano_obra', label: 'Mano de obra' },
  { clave: 'maquinaria', label: 'Maquinaria' },
  { clave: 'materiales', label: 'Materiales' },
  { clave: 'medio_ambiente', label: 'Medio ambiente' },
  { clave: 'otro', label: 'Otro' },
]

const causasVacias: Causas = {
  metodo: { texto: '', impacto: '' },
  mano_obra: { texto: '', impacto: '' },
  maquinaria: { texto: '', impacto: '' },
  materiales: { texto: '', impacto: '' },
  medio_ambiente: { texto: '', impacto: '' },
  otro: { texto: '', impacto: '' },
}

export default function FormularioFSG09({
  accionId,
  esResponsable,
  esCoordinador,
  bloqueado,
  usuarios,
  inicial,
}: {
  accionId: string
  esResponsable: boolean
  esCoordinador: boolean
  bloqueado: boolean
  usuarios: Usuario[]
  inicial: {
    definicion_problema: string | null
    equipo_lider: string | null
    equipo_miembros: string | null
    medidas_contencion: Medida[]
    analisis_causas: Partial<Causas>
    causa_raiz: string | null
    plan_trabajo: PlanItem[]
  }
}) {
  const [pending, startTransition] = useTransition()
  const [guardado, setGuardado] = useState<string | null>(null)

  const [medidas, setMedidas] = useState<Medida[]>(
    inicial.medidas_contencion.length > 0
      ? inicial.medidas_contencion
      : [{ accion: '', responsable: '', fecha: '', seguimiento: '' }]
  )
  const [causas, setCausas] = useState<Causas>({ ...causasVacias, ...inicial.analisis_causas })
  const [causaRaiz, setCausaRaiz] = useState(inicial.causa_raiz ?? '')
  const [plan, setPlan] = useState<PlanItem[]>(
    inicial.plan_trabajo.length > 0
      ? inicial.plan_trabajo
      : [
          {
            actividad: '',
            responsable: '',
            fecha_termino: '',
            seguimiento: '',
            resultado_esperado: '',
            verificacion_eficacia: '',
          },
        ]
  )

  function avisar(seccion: string) {
    setGuardado(seccion)
    setTimeout(() => setGuardado(null), 2500)
  }

  const inputCls =
    'w-full rounded-md border border-black/10 px-2 py-1 text-[12.5px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'
  const inputBloqCls = inputCls + ' disabled:bg-black/5'

  const puedeEditar = esResponsable || esCoordinador
  if (!puedeEditar) return null

  return (
    <div className="flex flex-col gap-4">
      {/* Sección 1: Definición del problema y equipo */}
      <form
        action={(fd) =>
          startTransition(async () => {
            await guardarDefinicionProblema(accionId, fd)
            avisar('definicion')
          })
        }
        className="rounded-xl border border-black/5 bg-white p-4"
      >
        <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
          FSG-09 · Definición del problema y equipo de mejora
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1 block text-[11px] text-by-gray-dark">
              Definición del problema
            </label>
            <textarea
              name="definicion_problema"
              disabled={bloqueado}
              defaultValue={inicial.definicion_problema ?? ''}
              rows={2}
              className={inputBloqCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">
              Líder del equipo
            </label>
            <input
              name="equipo_lider"
              disabled={bloqueado}
              defaultValue={inicial.equipo_lider ?? ''}
              className={inputBloqCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">
              Miembros del equipo
            </label>
            <input
              name="equipo_miembros"
              disabled={bloqueado}
              defaultValue={inicial.equipo_miembros ?? ''}
              className={inputBloqCls}
            />
          </div>
        </div>
        {!bloqueado && (
          <button
            type="submit"
            disabled={pending}
            className="mt-3 h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-60"
          >
            Guardar
          </button>
        )}
        {guardado === 'definicion' && (
          <span className="ml-3 text-[12px] text-[#3d6b53]">✓ Guardado</span>
        )}
      </form>

      {/* Sección 2: Medidas de contención / corrección */}
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-1 text-[13px] font-medium text-by-gray-dark">
          Medidas de contención / corrección
        </p>
        <p className="mb-3 text-[10.5px] text-by-gray-light">
          El "Seguimiento y cierre" solo lo llena el Coordinador SGI.
        </p>
        <div className="flex flex-col gap-2">
          {medidas.map((m, i) => (
            <div key={i} className="grid grid-cols-4 gap-2">
              <input
                placeholder="Acción"
                disabled={bloqueado || !(esResponsable || esCoordinador)}
                value={m.accion}
                onChange={(e) => {
                  const c = [...medidas]
                  c[i] = { ...c[i], accion: e.target.value }
                  setMedidas(c)
                }}
                className={inputBloqCls}
              />
              <input
                placeholder="Responsable"
                disabled={bloqueado || !(esResponsable || esCoordinador)}
                value={m.responsable}
                onChange={(e) => {
                  const c = [...medidas]
                  c[i] = { ...c[i], responsable: e.target.value }
                  setMedidas(c)
                }}
                className={inputBloqCls}
              />
              <input
                type="date"
                disabled={bloqueado || !(esResponsable || esCoordinador)}
                value={m.fecha}
                onChange={(e) => {
                  const c = [...medidas]
                  c[i] = { ...c[i], fecha: e.target.value }
                  setMedidas(c)
                }}
                className={inputBloqCls}
              />
              <input
                placeholder="Seguimiento y cierre (Coordinador)"
                disabled={bloqueado || !esCoordinador}
                value={m.seguimiento}
                onChange={(e) => {
                  const c = [...medidas]
                  c[i] = { ...c[i], seguimiento: e.target.value }
                  setMedidas(c)
                }}
                className={inputBloqCls}
              />
            </div>
          ))}
        </div>
        {!bloqueado && (
          <div className="mt-2 flex items-center gap-3">
            {(esResponsable || esCoordinador) && (
              <button
                type="button"
                onClick={() =>
                  setMedidas([...medidas, { accion: '', responsable: '', fecha: '', seguimiento: '' }])
                }
                className="text-[12px] text-by-accent hover:underline"
              >
                + Agregar fila
              </button>
            )}
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await guardarMedidasContencion(accionId, medidas)
                  avisar('medidas')
                })
              }
              className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-60"
            >
              Guardar
            </button>
            {guardado === 'medidas' && (
              <span className="text-[12px] text-[#3d6b53]">✓ Guardado</span>
            )}
          </div>
        )}
      </div>

      {/* Sección 3: Análisis causa-efecto */}
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-3 text-[13px] font-medium text-by-gray-dark">
          Análisis causa - efecto (Ishikawa)
        </p>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIAS_CAUSA.map(({ clave, label }) => (
            <div key={clave} className="rounded-md border border-black/5 p-2">
              <p className="mb-1 text-[11px] font-medium text-by-gray-dark">{label}</p>
              <textarea
                disabled={bloqueado}
                value={causas[clave].texto}
                onChange={(e) =>
                  setCausas({ ...causas, [clave]: { ...causas[clave], texto: e.target.value } })
                }
                rows={2}
                className={inputBloqCls + ' mb-1'}
              />
              <select
                disabled={bloqueado}
                value={causas[clave].impacto}
                onChange={(e) =>
                  setCausas({
                    ...causas,
                    [clave]: { ...causas[clave], impacto: e.target.value as 'alto' | 'medio' | 'bajo' | '' },
                  })
                }
                className={inputBloqCls}
              >
                <option value="">Impacto…</option>
                <option value="alto">Alto</option>
                <option value="medio">Medio</option>
                <option value="bajo">Bajo</option>
              </select>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-[11px] text-by-gray-dark">
            Causas raíz (causas con impacto alto)
          </label>
          <textarea
            disabled={bloqueado}
            value={causaRaiz}
            onChange={(e) => setCausaRaiz(e.target.value)}
            rows={2}
            className={inputBloqCls}
          />
        </div>
        {!bloqueado && (
          <div className="mt-2 flex items-center gap-3">
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await guardarAnalisisCausas(accionId, causas, causaRaiz)
                  avisar('causas')
                })
              }
              className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-60"
            >
              Guardar
            </button>
            {guardado === 'causas' && (
              <span className="text-[12px] text-[#3d6b53]">✓ Guardado</span>
            )}
          </div>
        )}
      </div>

      {/* Sección 4: Plan de trabajo */}
      <div className="rounded-xl border border-black/5 bg-white p-4">
        <p className="mb-1 text-[13px] font-medium text-by-gray-dark">
          Plan de trabajo (acción correctiva permanente)
        </p>
        <p className="mb-3 text-[10.5px] text-by-gray-light">
          "Seguimiento" y "Verificación de eficacia" solo los llena el Coordinador SGI.
        </p>
        <div className="flex flex-col gap-2">
          {plan.map((p, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 rounded-md border border-black/5 p-2">
              <textarea
                placeholder="Actividad"
                disabled={bloqueado || !(esResponsable || esCoordinador)}
                value={p.actividad}
                onChange={(e) => {
                  const c = [...plan]
                  c[i] = { ...c[i], actividad: e.target.value }
                  setPlan(c)
                }}
                className={inputBloqCls}
              />
              <select
                disabled={bloqueado || !(esResponsable || esCoordinador)}
                value={p.responsable}
                onChange={(e) => {
                  const c = [...plan]
                  c[i] = { ...c[i], responsable: e.target.value }
                  setPlan(c)
                }}
                className={inputBloqCls}
              >
                <option value="">— Responsable —</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.nombre}>{u.nombre}</option>
                ))}
              </select>
              <input
                type="date"
                disabled={bloqueado || !(esResponsable || esCoordinador)}
                value={p.fecha_termino}
                onChange={(e) => {
                  const c = [...plan]
                  c[i] = { ...c[i], fecha_termino: e.target.value }
                  setPlan(c)
                }}
                className={inputBloqCls}
              />
              <input
                placeholder="Seguimiento (Coordinador)"
                disabled={bloqueado || !esCoordinador}
                value={p.seguimiento}
                onChange={(e) => {
                  const c = [...plan]
                  c[i] = { ...c[i], seguimiento: e.target.value }
                  setPlan(c)
                }}
                className={inputBloqCls}
              />
              <input
                placeholder="Resultado esperado"
                disabled={bloqueado || !(esResponsable || esCoordinador)}
                value={p.resultado_esperado}
                onChange={(e) => {
                  const c = [...plan]
                  c[i] = { ...c[i], resultado_esperado: e.target.value }
                  setPlan(c)
                }}
                className={inputBloqCls}
              />
              <input
                placeholder="Verificación de eficacia (Coordinador)"
                disabled={bloqueado || !esCoordinador}
                value={p.verificacion_eficacia}
                onChange={(e) => {
                  const c = [...plan]
                  c[i] = { ...c[i], verificacion_eficacia: e.target.value }
                  setPlan(c)
                }}
                className={inputBloqCls}
              />
            </div>
          ))}
        </div>
        {!bloqueado && (
          <div className="mt-2 flex items-center gap-3">
            {(esResponsable || esCoordinador) && (
              <button
                type="button"
                onClick={() =>
                  setPlan([
                    ...plan,
                    {
                      actividad: '',
                      responsable: '',
                      fecha_termino: '',
                      seguimiento: '',
                      resultado_esperado: '',
                      verificacion_eficacia: '',
                    },
                  ])
                }
                className="text-[12px] text-by-accent hover:underline"
              >
                + Agregar fila
              </button>
            )}
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await guardarPlanTrabajo(accionId, plan)
                  avisar('plan')
                })
              }
              className="h-8 rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-60"
            >
              Guardar
            </button>
            {guardado === 'plan' && (
              <span className="text-[12px] text-[#3d6b53]">✓ Guardado</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
