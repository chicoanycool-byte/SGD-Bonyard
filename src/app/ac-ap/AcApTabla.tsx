'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type Accion = {
  id: string
  folio: string | null
  tipo_accion: string
  descripcion: string
  tipo_nc: string | null
  estatus: string
  fecha_compromiso: string | null
  creado_en: string
  fecha_cierre: string | null
  responsable_nombre: string | null
}

const ESTATUS_LABEL: Record<string, string> = {
  abierta: 'Sin plan',
  en_proceso: 'En proceso',
  en_validacion: 'En validación',
  cerrada: 'Cerrada',
  rechazada: 'Rechazada',
}

const ESTATUS_ESTILO: Record<string, string> = {
  abierta: 'bg-[#fdecea] text-[#a13c33]',
  en_proceso: 'bg-[#e6f0fa] text-[#2d5f8a]',
  en_validacion: 'bg-[#f0eafa] text-[#6b4fa0]',
  cerrada: 'bg-[#eaf5f0] text-[#3d6b53]',
  rechazada: 'bg-[#f1efe8] text-[#5f5e5a]',
}

type Filtro = { tipo: 'todas' } | { tipo: 'estatus'; valor: string }

export default function AcApTabla({ acciones, esCoordinador }: { acciones: Accion[]; esCoordinador: boolean }) {
  const [filtro, setFiltro] = useState<Filtro>({ tipo: 'todas' })

  const abiertas = acciones.filter((a) => a.estatus === 'abierta').length
  const enProceso = acciones.filter((a) => a.estatus === 'en_proceso').length
  const enValidacion = acciones.filter((a) => a.estatus === 'en_validacion').length
  const cerradas = acciones.filter((a) => a.estatus === 'cerrada').length

  const cerradasList = acciones.filter((a) => a.fecha_cierre)
  const promedioCierre =
    cerradasList.length > 0
      ? Math.round(
          cerradasList.reduce(
            (acc, a) =>
              acc + (new Date(a.fecha_cierre!).getTime() - new Date(a.creado_en).getTime()) / 86400000,
            0
          ) / cerradasList.length
        )
      : null

  const filtradas = useMemo(() => {
    if (filtro.tipo === 'estatus') return acciones.filter((a) => a.estatus === filtro.valor)
    return acciones
  }, [acciones, filtro])

  const tarjetaCls = 'cursor-pointer text-left transition hover:opacity-80'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-by-gray-dark">Acciones Correctivas</p>
        <div className="flex gap-2">
          {esCoordinador && (
            <Link
              href="/ac-ap/dashboard"
              className="h-8 rounded-md bg-by-primary px-3 text-[12px] font-medium leading-8 text-white transition hover:bg-by-primary-dark"
            >
              Ver Dashboard
            </Link>
          )}
          <a
            href="/ac-ap/exportar/excel"
            className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
          >
            Exportar Excel
          </a>
          <a
            href="/ac-ap/exportar/pdf"
            className="h-8 rounded-md border border-black/10 px-3 text-[12px] font-medium leading-8 text-by-gray-dark transition hover:bg-black/5"
          >
            Exportar PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <button
          onClick={() => setFiltro({ tipo: 'todas' })}
          className={`rounded-lg bg-[#f4f6f6] px-4 py-3 text-by-primary ${tarjetaCls} ${filtro.tipo === 'todas' ? 'ring-2 ring-by-accent' : ''}`}
        >
          <p className="mb-1 text-[11px] opacity-80">Total</p>
          <p className="text-[22px] font-medium">{acciones.length}</p>
        </button>
        <button
          onClick={() => setFiltro({ tipo: 'estatus', valor: 'abierta' })}
          className={`rounded-lg bg-[#fdecea] px-4 py-3 text-[#a13c33] ${tarjetaCls} ${filtro.tipo === 'estatus' && filtro.valor === 'abierta' ? 'ring-2 ring-by-accent' : ''}`}
        >
          <p className="mb-1 text-[11px] opacity-80">Sin plan</p>
          <p className="text-[22px] font-medium">{abiertas}</p>
        </button>
        <button
          onClick={() => setFiltro({ tipo: 'estatus', valor: 'en_proceso' })}
          className={`rounded-lg bg-[#e6f0fa] px-4 py-3 text-[#2d5f8a] ${tarjetaCls} ${filtro.tipo === 'estatus' && filtro.valor === 'en_proceso' ? 'ring-2 ring-by-accent' : ''}`}
        >
          <p className="mb-1 text-[11px] opacity-80">En proceso</p>
          <p className="text-[22px] font-medium">{enProceso}</p>
        </button>
        <button
          onClick={() => setFiltro({ tipo: 'estatus', valor: 'en_validacion' })}
          className={`rounded-lg bg-[#f0eafa] px-4 py-3 text-[#6b4fa0] ${tarjetaCls} ${filtro.tipo === 'estatus' && filtro.valor === 'en_validacion' ? 'ring-2 ring-by-accent' : ''}`}
        >
          <p className="mb-1 text-[11px] opacity-80">En validación</p>
          <p className="text-[22px] font-medium">{enValidacion}</p>
        </button>
        <button
          onClick={() => setFiltro({ tipo: 'estatus', valor: 'cerrada' })}
          className={`rounded-lg bg-[#eaf5f0] px-4 py-3 text-[#3d6b53] ${tarjetaCls} ${filtro.tipo === 'estatus' && filtro.valor === 'cerrada' ? 'ring-2 ring-by-accent' : ''}`}
        >
          <p className="mb-1 text-[11px] opacity-80">Cerradas</p>
          <p className="text-[22px] font-medium">{cerradas}</p>
        </button>
      </div>
      {promedioCierre !== null && (
        <p className="text-[11px] text-by-gray-light">
          Días promedio de cierre (todas las cerradas): {promedioCierre}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
              <th className="whitespace-nowrap px-4 py-2 font-normal">No.</th>
              <th className="whitespace-nowrap px-4 py-2 font-normal">Tipo</th>
              <th className="whitespace-nowrap px-4 py-2 font-normal">Folio</th>
              <th className="min-w-[280px] px-4 py-2 font-normal">Descripción</th>
              <th className="whitespace-nowrap px-4 py-2 font-normal">Responsable</th>
              <th className="whitespace-nowrap px-4 py-2 font-normal">Fecha de inicio</th>
              <th className="whitespace-nowrap px-4 py-2 font-normal">Fecha programada de cierre</th>
              <th className="whitespace-nowrap px-4 py-2 font-normal">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((a, i) => (
              <tr key={a.id} className="border-b border-black/5 last:border-0">
                <td className="whitespace-nowrap px-4 py-2 text-by-gray-light">{i + 1}</td>
                <td className="whitespace-nowrap px-4 py-2 capitalize text-by-gray-light">
                  {a.tipo_accion}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-by-gray-light">{a.folio ?? '—'}</td>
                <td className="min-w-[280px] px-4 py-2 text-by-gray-dark">
                  <Link href={`/ac-ap/${a.id}`} className="hover:underline">
                    {a.descripcion}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-by-gray-light">
                  {a.responsable_nombre ?? '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-by-gray-light">
                  {new Date(a.creado_en).toLocaleDateString('es-MX')}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-by-gray-light">
                  {a.fecha_compromiso
                    ? new Date(a.fecha_compromiso + 'T00:00:00').toLocaleDateString('es-MX')
                    : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-[11px] ' + (ESTATUS_ESTILO[a.estatus] ?? '')
                    }
                  >
                    {ESTATUS_LABEL[a.estatus] ?? a.estatus}
                  </span>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                  No hay acciones que coincidan con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
