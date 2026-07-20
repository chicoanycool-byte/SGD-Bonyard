import type { PuntoIndicador } from '@/lib/indicadores'

const SEMAFORO_COLOR: Record<string, string> = {
  verde: 'bg-[#eaf5f0] text-[#3d6b53]',
  amarillo: 'bg-[#fdf3e3] text-[#9a6b1c]',
  rojo: 'bg-[#fdecea] text-[#a13c33]',
  sin_dato: 'bg-[#f1efe8] text-[#5f5e5a]',
}

export default function IndicadorCierre({
  titulo,
  meta,
  puntos,
}: {
  titulo: string
  meta: number
  puntos: PuntoIndicador[]
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-medium text-by-gray-dark">{titulo}</p>
        <p className="text-[11px] text-by-gray-light">Meta: ≥ {meta}%</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {puntos.map((p) => (
          <div
            key={p.etiqueta}
            className={`rounded-lg px-3 py-2.5 ${SEMAFORO_COLOR[p.semaforo]}`}
          >
            <p className="mb-1 text-[11px] opacity-80">{p.etiqueta}</p>
            <p className="text-[20px] font-medium">
              {p.porcentaje !== null ? `${p.porcentaje}%` : '—'}
            </p>
            <p className="text-[10.5px] opacity-70">
              {p.enTiempo}/{p.total} en tiempo
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
