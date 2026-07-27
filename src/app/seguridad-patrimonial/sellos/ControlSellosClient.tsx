'use client'

import { useMemo, useState, useTransition } from 'react'
import { crearControlSello, verificarSello, eliminarControlSello } from '../actions'

type Sello = {
  id: string
  folio: string | null
  fecha: string
  nave: string
  unidad_transporte: string
  operador: string | null
  cliente: string | null
  numero_sello_colocado: string
  numero_sello_verificado: string | null
  estatus: string
  observaciones: string | null
  coloca_nombre: string | null
  verifica_nombre: string | null
}

const ESTATUS_STYLE: Record<string, string> = {
  colocado: 'bg-[#e6f0fa] text-[#2d5f8a]',
  correcto: 'bg-[#eaf5f0] text-[#3d6b53]',
  no_coincide: 'bg-[#fdecea] text-[#a13c33]',
  roto: 'bg-[#fdecea] text-[#a13c33]',
  faltante: 'bg-[#fdecea] text-[#a13c33]',
}
const ESTATUS_LABEL: Record<string, string> = {
  colocado: 'Colocado (pendiente verificar)',
  correcto: 'Correcto',
  no_coincide: 'No coincide',
  roto: 'Roto',
  faltante: 'Faltante',
}

export default function ControlSellosClient({
  puedeGestionar,
  sellos,
}: {
  puedeGestionar: boolean
  sellos: Sello[]
}) {
  const [pendiente, startTransition] = useTransition()
  const [filtro, setFiltro] = useState('')
  const [verificando, setVerificando] = useState<string | null>(null)

  const colocados = sellos.filter((s) => s.estatus === 'colocado').length
  const correctos = sellos.filter((s) => s.estatus === 'correcto').length
  const incidencias = sellos.filter((s) => ['no_coincide', 'roto', 'faltante'].includes(s.estatus)).length

  const filtrados = useMemo(() => {
    if (!filtro) return sellos
    if (filtro === 'incidencia') return sellos.filter((s) => ['no_coincide', 'roto', 'faltante'].includes(s.estatus))
    return sellos.filter((s) => s.estatus === filtro)
  }, [sellos, filtro])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] font-medium text-by-gray-dark">Control de sellos de seguridad</p>

      <div className="grid grid-cols-4 gap-3">
        <button
          onClick={() => setFiltro('')}
          className={
            'rounded-lg px-4 py-3 text-left text-by-primary transition ' +
            (!filtro ? 'bg-[#e4e9e8] ring-2 ring-by-primary/40' : 'bg-[#f4f6f6] hover:bg-[#e9ecec]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Total</p>
          <p className="text-[22px] font-medium">{sellos.length}</p>
        </button>
        <button
          onClick={() => setFiltro(filtro === 'colocado' ? '' : 'colocado')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#2d5f8a] transition ' +
            (filtro === 'colocado' ? 'bg-[#c9dff2] ring-2 ring-[#2d5f8a]/40' : 'bg-[#e6f0fa] hover:bg-[#d9e9f7]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Pendientes de verificar</p>
          <p className="text-[22px] font-medium">{colocados}</p>
        </button>
        <button
          onClick={() => setFiltro(filtro === 'correcto' ? '' : 'correcto')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#3d6b53] transition ' +
            (filtro === 'correcto' ? 'bg-[#d3ecdf] ring-2 ring-[#3d6b53]/40' : 'bg-[#eaf5f0] hover:bg-[#dff0e7]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Correctos</p>
          <p className="text-[22px] font-medium">{correctos}</p>
        </button>
        <button
          onClick={() => setFiltro(filtro === 'incidencia' ? '' : 'incidencia')}
          className={
            'rounded-lg px-4 py-3 text-left text-[#a13c33] transition ' +
            (filtro === 'incidencia' ? 'bg-[#f9d9d5] ring-2 ring-[#a13c33]/40' : 'bg-[#fdecea] hover:bg-[#fbe1de]')
          }
        >
          <p className="mb-1 text-[11px] opacity-80">Incidencias</p>
          <p className="text-[22px] font-medium">{incidencias}</p>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-black/5 text-[10.5px] uppercase text-by-gray-light">
              <th className="px-3 py-2 font-normal">Folio</th>
              <th className="px-3 py-2 font-normal">Fecha</th>
              <th className="px-3 py-2 font-normal">Nave</th>
              <th className="px-3 py-2 font-normal">Unidad</th>
              <th className="px-3 py-2 font-normal">Cliente</th>
              <th className="px-3 py-2 font-normal">Sello colocado</th>
              <th className="px-3 py-2 font-normal">Sello verificado</th>
              <th className="px-3 py-2 font-normal">Estatus</th>
              {puedeGestionar && <th className="px-3 py-2 font-normal"></th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((s) => (
              <tr key={s.id} className="border-b border-black/5 last:border-0 align-top">
                <td className="px-3 py-2 text-by-gray-light">{s.folio}</td>
                <td className="px-3 py-2 text-by-gray-light">{new Date(s.fecha).toLocaleDateString('es-MX')}</td>
                <td className="px-3 py-2 text-by-gray-light">{s.nave}</td>
                <td className="px-3 py-2 text-by-gray-dark">
                  {s.unidad_transporte}
                  {s.operador && <span className="block text-[10.5px] text-by-gray-light">{s.operador}</span>}
                </td>
                <td className="px-3 py-2 text-by-gray-light">{s.cliente ?? '—'}</td>
                <td className="px-3 py-2 text-by-gray-light">{s.numero_sello_colocado}</td>
                <td className="px-3 py-2 text-by-gray-light">{s.numero_sello_verificado ?? '—'}</td>
                <td className="px-3 py-2">
                  <span className={'rounded-full px-2 py-0.5 text-[11px] ' + (ESTATUS_STYLE[s.estatus] ?? '')}>
                    {ESTATUS_LABEL[s.estatus] ?? s.estatus}
                  </span>
                </td>
                {puedeGestionar && (
                  <td className="px-3 py-2">
                    {s.estatus === 'colocado' ? (
                      verificando === s.id ? (
                        <form
                          action={(fd) =>
                            startTransition(async () => {
                              await verificarSello(fd)
                              setVerificando(null)
                            })
                          }
                          className="flex flex-col gap-1"
                        >
                          <input type="hidden" name="id" value={s.id} />
                          <input
                            name="numero_sello_verificado"
                            placeholder="Sello encontrado"
                            required
                            className="h-7 w-32 rounded-md border border-black/10 px-1.5 text-[11px]"
                          />
                          <select name="estatus" defaultValue="correcto" className="h-7 rounded-md border border-black/10 px-1.5 text-[11px]">
                            <option value="correcto">Correcto</option>
                            <option value="no_coincide">No coincide</option>
                            <option value="roto">Roto</option>
                            <option value="faltante">Faltante</option>
                          </select>
                          <button className="text-[11px] text-by-accent hover:underline">Guardar</button>
                        </form>
                      ) : (
                        <button onClick={() => setVerificando(s.id)} className="text-[11px] text-by-accent hover:underline">
                          Verificar
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => startTransition(() => eliminarControlSello(s.id))}
                        disabled={pendiente}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-[12px] text-by-gray-light">
                  Sin registros que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {puedeGestionar && (
        <form action={(fd) => startTransition(() => crearControlSello(fd))} className="rounded-xl border border-black/5 bg-white p-4">
          <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Registrar sello colocado</p>
          <div className="grid grid-cols-4 gap-2">
            <select name="nave" defaultValue="Nave 1" className="h-8 rounded-md border border-black/10 px-2 text-[12px]">
              <option value="Nave 1">Nave 1</option>
              <option value="Nave 2">Nave 2</option>
            </select>
            <input name="fecha" type="date" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="unidad_transporte" placeholder="Unidad / placas" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="operador" placeholder="Operador" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="cliente" placeholder="Cliente" className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="numero_sello_colocado" placeholder="Número de sello" required className="h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <input name="observaciones" placeholder="Observaciones" className="col-span-2 h-8 rounded-md border border-black/10 px-2 text-[12px]" />
            <button className="col-span-4 h-8 w-fit rounded-md border border-by-accent px-3 text-[12px] text-by-accent">
              Registrar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
