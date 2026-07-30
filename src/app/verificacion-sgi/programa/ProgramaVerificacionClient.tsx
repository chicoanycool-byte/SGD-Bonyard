'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  crearItemPrograma,
  editarItemPrograma,
  eliminarItemPrograma,
  alternarProgramado,
  alternarRealizado,
} from './actions'

type Mensual = { item_id: string; anio: number; mes: number; programado: boolean; realizado: boolean }
type ItemCatalogo = {
  id: string
  enfoque: string | null
  periodicidad: string | null
  lista_verificacion: string
  responsable_realiza: string | null
  puesto_responsable_atiende: string | null
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function ProgramaVerificacionClient({
  esCoordinador,
  catalogo,
  mensual,
  anioInicial,
}: {
  esCoordinador: boolean
  catalogo: ItemCatalogo[]
  mensual: Mensual[]
  anioInicial: number
}) {
  const [pendiente, startTransition] = useTransition()
  const [anio, setAnio] = useState(anioInicial)
  const [editando, setEditando] = useState<string | null>(null)

  const hoy = new Date()
  const mesActual = hoy.getMonth() + 1
  const anioActual = hoy.getFullYear()

  const mensualPorItem = useMemo(() => {
    const map = new Map<string, Map<string, Mensual>>()
    for (const m of mensual) {
      if (!map.has(m.item_id)) map.set(m.item_id, new Map())
      map.get(m.item_id)!.set(`${m.anio}-${m.mes}`, m)
    }
    return map
  }, [mensual])

  function celda(itemId: string, a: number, mes: number): Mensual {
    return mensualPorItem.get(itemId)?.get(`${a}-${mes}`) ?? { item_id: itemId, anio: a, mes, programado: false, realizado: false }
  }

  // ---------- Alertas: verificaciones programadas este mes que aún no se realizan ----------
  const alertasMes = catalogo
    .map((it) => ({ item: it, celda: celda(it.id, anioActual, mesActual) }))
    .filter((x) => x.celda.programado && !x.celda.realizado)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">
        Programa de Verificación del SGI <span className="text-[11px] font-normal text-by-gray-light">(FSG-43)</span>
      </p>

      {alertasMes.length > 0 && (
        <div className="rounded-xl border border-[#f0c94a] bg-[#fdf3e3] p-4">
          <p className="mb-2 text-[13px] font-medium text-[#9a6b1c]">
            ⚠ {alertasMes.length} verificación{alertasMes.length > 1 ? 'es' : ''} programada{alertasMes.length > 1 ? 's' : ''} para {MESES_LARGO[mesActual - 1]} {anioActual} que aún no se {alertasMes.length > 1 ? 'realizan' : 'realiza'}
          </p>
          <ul className="flex flex-col gap-1">
            {alertasMes.map(({ item }) => (
              <li key={item.id} className="text-[12px] text-[#9a6b1c]">
                • {item.lista_verificacion}
                {item.puesto_responsable_atiende && <span className="text-[#9a6b1c]/70"> — atiende: {item.puesto_responsable_atiende}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-by-gray-light">
          Haz clic en un mes: primer clic programa (azul), segundo clic marca realizado (verde), tercer clic limpia.
        </p>
        <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
          {[anioInicial - 1, anioInicial, anioInicial + 1].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[11.5px]">
          <thead>
            <tr className="border-b border-black/5 bg-[#14302B] text-[10px] uppercase text-white">
              <th className="px-2 py-2 font-normal">Enfoque</th>
              <th className="px-2 py-2 font-normal">Periodicidad</th>
              <th className="min-w-[220px] px-3 py-2 font-normal">Lista de verificación</th>
              <th className="w-[130px] px-2 py-2 font-normal">Responsable de realizar</th>
              <th className="w-[130px] px-2 py-2 font-normal">Puesto responsable de atender</th>
              {MESES.map((m, i) => (
                <th key={i} className="w-9 px-1 py-2 text-center font-normal">{m}</th>
              ))}
              {esCoordinador && <th className="px-2 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {catalogo.map((it) => {
              const enEdicion = editando === it.id
              if (enEdicion) {
                return (
                  <tr key={it.id} className="border-b border-black/5 bg-[#fafbfa] align-top last:border-0">
                    <td colSpan={5 + 12 + (esCoordinador ? 1 : 0)} className="px-3 py-3">
                      <form
                        action={(fd) =>
                          startTransition(async () => {
                            await editarItemPrograma(fd)
                            setEditando(null)
                          })
                        }
                        className="grid grid-cols-5 gap-2"
                      >
                        <input type="hidden" name="id" value={it.id} />
                        <input name="enfoque" placeholder="Enfoque (9001/SQF/BP)" defaultValue={it.enfoque ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                        <input name="periodicidad" placeholder="Periodicidad" defaultValue={it.periodicidad ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                        <input name="lista_verificacion" placeholder="Lista de verificación" defaultValue={it.lista_verificacion} required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                        <input name="responsable_realiza" placeholder="Responsable de realizar" defaultValue={it.responsable_realiza ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                        <input name="puesto_responsable_atiende" placeholder="Puesto responsable de atender" defaultValue={it.puesto_responsable_atiende ?? ''} className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
                        <div className="col-span-5 flex gap-2">
                          <button disabled={pendiente} className="h-8 rounded-md bg-by-primary px-3 text-[12px] font-medium text-white disabled:opacity-50">Guardar</button>
                          <button type="button" onClick={() => setEditando(null)} className="h-8 rounded-md border border-black/10 px-3 text-[12px] text-by-gray-light">Cancelar</button>
                        </div>
                      </form>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={it.id} className="border-b border-black/5 last:border-0">
                  <td className="px-2 py-1.5 text-by-gray-light">{it.enfoque ?? '—'}</td>
                  <td className="px-2 py-1.5 text-by-gray-light">{it.periodicidad ?? '—'}</td>
                  <td className="px-3 py-1.5 text-by-gray-dark">{it.lista_verificacion}</td>
                  <td className="px-2 py-1.5 text-by-gray-light">{it.responsable_realiza ?? '—'}</td>
                  <td className="px-2 py-1.5 text-by-gray-light">{it.puesto_responsable_atiende ?? '—'}</td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
                    const c = celda(it.id, anio, mes)
                    const esMesActual = anio === anioActual && mes === mesActual
                    const estilo = c.realizado
                      ? 'bg-[#3d6b53] text-white'
                      : c.programado
                      ? 'bg-[#e6f0fa] text-[#2d5f8a]'
                      : 'bg-[#f4f6f6] text-transparent'
                    return (
                      <td key={mes} className="px-1 py-1.5 text-center">
                        <button
                          disabled={!esCoordinador || pendiente}
                          onClick={() => {
                            if (!c.programado) startTransition(() => alternarProgramado(it.id, anio, mes))
                            else if (c.programado && !c.realizado) startTransition(() => alternarRealizado(it.id, anio, mes))
                            else startTransition(() => alternarProgramado(it.id, anio, mes))
                          }}
                          className={'h-6 w-6 rounded text-[10px] font-medium ' + estilo + (esMesActual ? ' ring-2 ring-[#9a6b1c]/50' : '')}
                          title={MESES_LARGO[mes - 1]}
                        >
                          {c.realizado ? '✓' : c.programado ? '•' : ''}
                        </button>
                      </td>
                    )
                  })}
                  {esCoordinador && (
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => setEditando(it.id)} className="text-[10.5px] text-by-accent hover:underline">Editar</button>
                        <button onClick={() => startTransition(() => eliminarItemPrograma(it.id))} disabled={pendiente} className="text-[10.5px] text-red-500 hover:underline">Eliminar</button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
            {catalogo.length === 0 && (
              <tr>
                <td colSpan={18} className="px-3 py-6 text-center text-[12px] text-by-gray-light">Sin elementos capturados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {esCoordinador && (
        <form action={(fd) => startTransition(() => crearItemPrograma(fd))} className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Agregar tema de verificación</p>
          <div className="grid grid-cols-5 gap-2">
            <input name="enfoque" placeholder="Enfoque (9001/SQF/BP)" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="periodicidad" placeholder="Periodicidad" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="lista_verificacion" placeholder="Lista de verificación" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="responsable_realiza" placeholder="Responsable de realizar" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="puesto_responsable_atiende" placeholder="Puesto responsable de atender" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="col-span-5 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">Agregar</button>
          </div>
        </form>
      )}
    </div>
  )
}
