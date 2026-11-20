'use client'

import { useActionState, useState, useTransition } from 'react'
import { actualizarPunto, crearPunto, registrarResultado, type EstadoMonitoreo } from './actions'
import { AvisoError, AvisoOk, BotonPrincipal, Campo, FormaTarjeta, ResumenFrase, Seccion, EstadoVacio, inputCls, textareaCls } from '@/components/ui/forma'
import { FRECUENCIA_SUGERIDA, RIESGO_CLASE, RIESGO_LABEL, TIPO_LABEL, type EstadoMuestreo } from '@/lib/monitoreo'
import { fechaMX } from '@/lib/capacitacion'

export type PuntoVista = {
  id: string; codigo: string; nombre: string; nave: string; zona: string | null; tipo: string
  indicador: string | null; riesgo: string; frecuencia_dias: number; limite: string | null; activo: boolean
  estado: EstadoMuestreo; proxima: string | null; ultimaFecha: string | null; ultimoResultado: string | null
}
export type ResultadoVista = { id: string; punto_id: string; fecha: string; resultado: string; valor: string | null; laboratorio: string | null; observaciones: string | null; accion_id: string | null }

const ESTADO_TXT: Record<EstadoMuestreo, { t: string; c: string }> = {
  sin_muestra: { t: 'Nunca se ha muestreado', c: 'bg-gray-100 text-gray-700' },
  vencido: { t: 'Ya tocaba muestrear', c: 'bg-red-100 text-red-800' },
  proximo: { t: 'Toca pronto', c: 'bg-amber-100 text-amber-800' },
  al_dia: { t: 'Al día', c: 'bg-emerald-100 text-emerald-800' },
}

function FormResultado({ punto, usuarios, hoy, onCerrar }: { punto: PuntoVista; usuarios: { id: string; nombre: string }[]; hoy: string; onCerrar: () => void }) {
  const [estado, accion, pendiente] = useActionState(registrarResultado, {} as EstadoMonitoreo)
  const [res, setRes] = useState('')
  if (estado.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-[13.5px] font-medium text-emerald-800">{estado.mensaje}</p>
        <button onClick={onCerrar} className="mt-3 h-9 rounded-lg bg-emerald-700 px-4 text-[13px] font-medium text-white">Cerrar</button>
      </div>
    )
  }
  return (
    <FormaTarjeta titulo={`Registrar resultado: ${punto.codigo} ${punto.nombre}`} intro={`Qué se mide: ${punto.indicador ?? 'indicador del punto'}. ${punto.limite ? 'Límite: ' + punto.limite + '.' : ''}`}>
      <form action={accion} className="flex flex-col gap-4">
        <input type="hidden" name="punto_id" value={punto.id} />
        <input type="hidden" name="resultado" value={res} />
        <Seccion numero={1} titulo="¿Cuándo se tomó la muestra?">
          <Campo label="Fecha de la muestra"><input name="fecha" type="date" required defaultValue={hoy} max={hoy} className={inputCls} /></Campo>
          <Campo label="Laboratorio" opcional><input name="laboratorio" className={inputCls} /></Campo>
        </Seccion>
        <Seccion numero={2} titulo="¿Cómo salió el resultado?" ayuda="Compáralo con el límite del laboratorio o del cliente.">
          <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-2">
            {([['conforme', 'Dentro de límite', 'El resultado es aceptable'], ['fuera_de_limite', 'Fuera de límite', 'Se abre una acción correctiva automáticamente']] as const).map(([v, t, d]) => (
              <button type="button" key={v} onClick={() => setRes(v)} className={'rounded-xl border-2 px-4 py-3 text-left ' + (res === v ? (v === 'conforme' ? 'border-emerald-600 bg-emerald-50' : 'border-red-600 bg-red-50') : 'border-black/10 hover:border-by-accent')}>
                <span className="block text-[14px] font-medium text-by-gray-dark">{t}</span>
                <span className="block text-[12.5px] text-by-gray">{d}</span>
              </button>
            ))}
          </div>
          <Campo label="Valor del resultado" opcional ayuda="Ej. 120 UFC/cm²"><input name="valor" className={inputCls} /></Campo>
          <Campo label="Comentarios" opcional><input name="observaciones" className={inputCls} /></Campo>
        </Seccion>
        {res === 'fuera_de_limite' && (
          <Seccion numero={3} titulo="¿Quién le da seguimiento?" ayuda="Se crea la acción correctiva con esta persona como responsable. Puedes asignarla después.">
            <Campo label="Responsable" opcional>
              <select name="responsable_id" defaultValue="" className={inputCls}>
                <option value="">Asignar después</option>
                {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </Campo>
          </Seccion>
        )}
        {estado.error && <AvisoError>{estado.error}</AvisoError>}
        <div className="flex items-center gap-4">
          <BotonPrincipal pendiente={pendiente || !res}>{res ? 'Guardar resultado' : 'Elige cómo salió'}</BotonPrincipal>
          <button type="button" onClick={onCerrar} className="text-[13px] text-by-gray hover:underline">Cancelar</button>
        </div>
      </form>
    </FormaTarjeta>
  )
}

function FilaPunto({ p }: { p: PuntoVista }) {
  const [riesgo, setRiesgo] = useState(p.riesgo)
  const [frec, setFrec] = useState(String(p.frecuencia_dias))
  const [activo, setActivo] = useState(p.activo)
  const [pend, inicio] = useTransition()
  const guardar = (r: string, f: string, a: boolean) => Number(f) > 0 && inicio(() => actualizarPunto(p.id, r, Number(f), a))
  return (
    <tr className="border-b border-black/5 last:border-0">
      <td className="px-3 py-2"><span className="font-medium">{p.codigo}</span> {p.nombre}<span className="block text-[11.5px] text-by-gray">{TIPO_LABEL[p.tipo]} · {p.zona ?? '—'}</span></td>
      <td className="px-3 py-2">
        <select value={riesgo} disabled={pend} onChange={(e) => { setRiesgo(e.target.value); setFrec(String(FRECUENCIA_SUGERIDA[e.target.value])); guardar(e.target.value, String(FRECUENCIA_SUGERIDA[e.target.value]), activo) }} className="h-9 rounded-lg border border-black/15 px-2 text-[13px]">
          <option value="alto">Alto</option><option value="medio">Medio</option><option value="bajo">Bajo</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <input value={frec} disabled={pend} onChange={(e) => setFrec(e.target.value.replace(/\D/g, ''))} onBlur={() => guardar(riesgo, frec, activo)} className="h-9 w-20 rounded-lg border border-black/15 px-2 text-[13px]" /> días
      </td>
      <td className="px-3 py-2"><label className="flex items-center gap-1.5 text-[12.5px]"><input type="checkbox" checked={activo} onChange={(e) => { setActivo(e.target.checked); guardar(riesgo, frec, e.target.checked) }} /> En uso</label></td>
    </tr>
  )
}

export default function MonitoreoClient({ puntos, resultados, usuarios, esCoord, hoy }: { puntos: PuntoVista[]; resultados: ResultadoVista[]; usuarios: { id: string; nombre: string }[]; esCoord: boolean; hoy: string }) {
  const [tab, setTab] = useState<'toca' | 'puntos' | 'historial'>('toca')
  const [sel, setSel] = useState<PuntoVista | null>(null)
  const [estadoPunto, accionPunto, pendPunto] = useActionState(crearPunto, {} as EstadoMonitoreo)

  const activos = puntos.filter((p) => p.activo)
  const vencidos = activos.filter((p) => p.estado === 'vencido' || p.estado === 'sin_muestra')
  const proximos = activos.filter((p) => p.estado === 'proximo')
  const porAtender = [...vencidos, ...proximos].sort((a, b) => ({ alto: 0, medio: 1, bajo: 2 } as Record<string, number>)[a.riesgo] - ({ alto: 0, medio: 1, bajo: 2 } as Record<string, number>)[b.riesgo])
  const alDia = activos.length - vencidos.length - proximos.length
  const pct = activos.length ? Math.round((alDia / activos.length) * 100) : 100
  const porId = new Map(puntos.map((p) => [p.id, p]))

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[16px] font-medium text-by-gray-dark">Monitoreo ambiental</p>
        <p className="text-[12.5px] text-by-gray">Muestras de superficies, aire o agua para comprobar que las áreas se mantienen limpias. Las zonas de más riesgo se muestrean más seguido.</p>
      </div>

      <ResumenFrase
        frase={<>{alDia} de {activos.length} puntos de muestreo están <span className="font-semibold">al día</span>{vencidos.length > 0 && <>, <span className="font-semibold text-red-700">{vencidos.length} ya tocaba muestrear</span></>}{proximos.length > 0 && <>, {proximos.length} toca pronto</>}.</>}
        detalle="Riesgo alto: cada 30 días. Medio: cada 90. Bajo: cada 180. Puedes cambiarlo en “Puntos de muestreo”."
        porcentaje={pct}
      />

      {esCoord && sel && <FormResultado key={sel.id} punto={sel} usuarios={usuarios} hoy={hoy} onCerrar={() => setSel(null)} />}

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-[12.5px]">
        {([['toca', 'Qué toca muestrear'], ['puntos', 'Puntos de muestreo'], ['historial', 'Historial']] as const).map(([k, t]) => (
          <button key={k} onClick={() => setTab(k)} className={'flex-1 rounded-md px-3 py-1.5 ' + (tab === k ? 'bg-white font-medium text-by-gray-dark shadow-sm' : 'text-by-gray')}>{t}</button>
        ))}
      </div>

      {tab === 'toca' && (
        porAtender.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[13px] text-emerald-800">Todo está al día. No hay muestreos vencidos ni próximos.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {porAtender.map((p) => (
              <div key={p.id} className="rounded-xl border border-black/5 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13.5px] font-medium text-by-gray-dark">{p.codigo} {p.nombre}</p>
                  <span className={'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ' + RIESGO_CLASE[p.riesgo]}>{RIESGO_LABEL[p.riesgo]}</span>
                </div>
                <p className="mt-1 text-[12.5px] text-by-gray">{p.indicador ?? 'Sin indicador definido'}</p>
                <p className="mt-2"><span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + ESTADO_TXT[p.estado].c}>{ESTADO_TXT[p.estado].t}</span></p>
                <p className="mt-1 text-[12px] text-by-gray">{p.ultimaFecha ? `Última muestra: ${fechaMX(p.ultimaFecha)}. Tocaba el ${fechaMX(p.proxima)}.` : 'Todavía no hay ninguna muestra.'}</p>
                {esCoord && (
                  <button onClick={() => { setSel(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="mt-3 h-9 rounded-lg border border-by-primary px-4 text-[13px] font-medium text-by-primary hover:bg-by-primary hover:text-white">Registrar resultado</button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'puntos' && (
        <>
          <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-black/5 text-left text-[11px] uppercase tracking-wide text-by-gray"><th className="px-3 py-2">Punto</th><th className="px-3 py-2">Riesgo</th><th className="px-3 py-2">Se muestrea cada</th><th className="px-3 py-2" /></tr></thead>
              <tbody>
                {puntos.map((p) => esCoord ? <FilaPunto key={p.id} p={p} /> : (
                  <tr key={p.id} className="border-b border-black/5 last:border-0"><td className="px-3 py-2">{p.codigo} {p.nombre}</td><td className="px-3 py-2">{RIESGO_LABEL[p.riesgo]}</td><td className="px-3 py-2">{p.frecuencia_dias} días</td><td className="px-3 py-2">{p.activo ? 'En uso' : 'Sin uso'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          {esCoord && (
            <FormaTarjeta titulo="Agregar un punto de muestreo" intro="Un punto es un lugar concreto donde se toma la muestra. Elige el riesgo y la frecuencia se sugiere sola.">
              <form action={accionPunto} className="flex flex-col gap-4">
                <Seccion numero={1} titulo="¿Dónde y qué se mide?">
                  <Campo ancho label="Nombre del punto" ayuda="Ej. Andén 3, piso junto a la puerta."><input name="nombre" required className={inputCls} /></Campo>
                  <Campo label="Nave"><select name="nave" required defaultValue="" className={inputCls}><option value="" disabled>Elige una opción</option><option>Nave 1</option><option>Nave 2</option></select></Campo>
                  <Campo label="Tipo de muestra"><select name="tipo" defaultValue="superficie" className={inputCls}><option value="superficie">Superficie</option><option value="aire">Aire</option><option value="agua">Agua</option></select></Campo>
                  <Campo label="Zona" opcional><input name="zona" className={inputCls} /></Campo>
                  <Campo label="Qué se analiza" opcional><input name="indicador" className={inputCls} /></Campo>
                  <Campo ancho label="Límite aceptable" opcional><textarea name="limite" rows={2} className={textareaCls} /></Campo>
                </Seccion>
                <Seccion numero={2} titulo="¿Qué tan seguido?" ayuda="Alto: zona de producto o con más riesgo, cada 30 días. Medio: cada 90. Bajo: zonas de apoyo, cada 180.">
                  <Campo label="Riesgo"><select name="riesgo" required defaultValue="" className={inputCls}><option value="" disabled>Elige una opción</option><option value="alto">Alto</option><option value="medio">Medio</option><option value="bajo">Bajo</option></select></Campo>
                  <Campo label="Cada cuántos días se muestrea"><input name="frecuencia_dias" type="number" min={1} required placeholder="Ej. 90" className={inputCls} /></Campo>
                </Seccion>
                {estadoPunto.error && <AvisoError>{estadoPunto.error}</AvisoError>}
                {estadoPunto.ok && <AvisoOk>{estadoPunto.mensaje}</AvisoOk>}
                <div><BotonPrincipal pendiente={pendPunto}>Agregar punto</BotonPrincipal></div>
              </form>
            </FormaTarjeta>
          )}
        </>
      )}

      {tab === 'historial' && (
        resultados.length === 0 ? <EstadoVacio titulo="Todavía no hay resultados registrados" detalle="Cuando registres el primero aparecerá aquí." /> : (
          <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-black/5 text-left text-[11px] uppercase tracking-wide text-by-gray"><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Punto</th><th className="px-3 py-2">Resultado</th><th className="px-3 py-2">Valor</th><th className="px-3 py-2">Laboratorio</th></tr></thead>
              <tbody>
                {resultados.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 last:border-0">
                    <td className="px-3 py-2">{fechaMX(r.fecha)}</td>
                    <td className="px-3 py-2">{porId.get(r.punto_id)?.codigo} {porId.get(r.punto_id)?.nombre}</td>
                    <td className="px-3 py-2"><span className={'rounded-full px-2 py-0.5 text-[11px] font-medium ' + (r.resultado === 'conforme' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800')}>{r.resultado === 'conforme' ? 'Dentro de límite' : 'Fuera de límite'}</span></td>
                    <td className="px-3 py-2">{r.valor ?? '—'}</td>
                    <td className="px-3 py-2">{r.laboratorio ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
