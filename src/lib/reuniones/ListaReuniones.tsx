'use client'

import Link from 'next/link'

type Reunion = {
  id: string
  fecha: string
  hora: string | null
  lugar: string | null
  estatus: string
  convocante_nombre: string | null
}

export default function ListaReuniones({ reuniones, ruta }: { reuniones: Reunion[]; ruta: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-black/5 text-[11px] uppercase text-by-gray-light">
            <th className="px-4 py-2 font-normal">Fecha</th>
            <th className="px-4 py-2 font-normal">Hora</th>
            <th className="px-4 py-2 font-normal">Lugar</th>
            <th className="px-4 py-2 font-normal">Convocante</th>
            <th className="px-4 py-2 font-normal">Estatus</th>
          </tr>
        </thead>
        <tbody>
          {reuniones.map((r) => (
            <tr key={r.id} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-2 text-by-gray-dark">
                <Link href={`${ruta}/${r.id}`} className="hover:underline">
                  {new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-MX')}
                </Link>
              </td>
              <td className="px-4 py-2 text-by-gray-light">{r.hora ?? '—'}</td>
              <td className="px-4 py-2 text-by-gray-light">{r.lugar ?? '—'}</td>
              <td className="px-4 py-2 text-by-gray-light">{r.convocante_nombre ?? '—'}</td>
              <td className="px-4 py-2">
                <span
                  className={
                    'rounded-full px-2 py-0.5 text-[11px] ' +
                    (r.estatus === 'realizada'
                      ? 'bg-[#eaf5f0] text-[#3d6b53]'
                      : 'bg-[#e6f0fa] text-[#2d5f8a]')
                  }
                >
                  {r.estatus === 'realizada' ? 'Realizada' : 'Programada'}
                </span>
              </td>
            </tr>
          ))}
          {reuniones.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-[12px] text-by-gray-light">
                No hay reuniones registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
