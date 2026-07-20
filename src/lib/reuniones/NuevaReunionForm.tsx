'use client'

import { useTransition, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearReunion } from './actions'

type Usuario = { id: string; nombre: string }

export default function NuevaReunionForm({
  tipo,
  ruta,
  titulo,
  usuarios,
}: {
  tipo: string
  ruta: string
  titulo: string
  usuarios: Usuario[]
}) {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const [esVirtual, setEsVirtual] = useState(false)
  const [invitados, setInvitados] = useState<string[]>([])

  function alternarInvitado(id: string) {
    setInvitados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function onSubmit(formData: FormData) {
    invitados.forEach((id) => formData.append('invitados', id))
    startTransition(async () => {
      const resultado = await crearReunion(tipo, ruta, {}, formData)
      if (resultado.reunionId) {
        router.push(`${ruta}/${resultado.reunionId}`)
      } else if (resultado.error) {
        alert(resultado.error)
      }
    })
  }

  return (
    <form ref={formRef} action={onSubmit} className="rounded-xl border border-black/5 bg-white p-4">
      <p className="mb-3 text-[13px] font-medium text-by-gray-dark">{titulo}</p>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha</label>
          <input
            name="fecha"
            type="date"
            required
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Hora</label>
          <input
            name="hora"
            type="time"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Lugar</label>
          <input
            name="lugar"
            placeholder="Sala de juntas"
            className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-[12px] text-by-gray-dark">
            <input type="checkbox" checked={esVirtual} onChange={(e) => setEsVirtual(e.target.checked)} />
            Reunión virtual
          </label>
        </div>
        {esVirtual && (
          <div className="col-span-4">
            <label className="mb-1 block text-[11px] text-by-gray-dark">Link de la reunión virtual</label>
            <input
              name="link_virtual"
              placeholder="https://meet.google.com/..."
              className="h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
            />
          </div>
        )}
        <div className="col-span-4">
          <label className="mb-1 block text-[11px] text-by-gray-dark">Agenda (opcional)</label>
          <textarea
            name="agenda"
            rows={2}
            className="w-full rounded-md border border-black/10 px-2.5 py-1.5 text-[13px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30"
          />
        </div>
        <div className="col-span-4">
          <label className="mb-1 block text-[11px] text-by-gray-dark">Invitar a</label>
          <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-md border border-black/10 p-2">
            {usuarios.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-1.5 rounded-full border border-black/10 px-2.5 py-1 text-[12px] text-by-gray-dark"
              >
                <input
                  type="checkbox"
                  checked={invitados.includes(u.id)}
                  onChange={() => alternarInvitado(u.id)}
                />
                {u.nombre}
              </label>
            ))}
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-3 h-8 w-fit rounded-md bg-by-primary px-4 text-[13px] font-medium text-white transition hover:bg-by-primary-dark disabled:opacity-60"
      >
        {pending ? 'Programando…' : 'Programar reunión'}
      </button>
    </form>
  )
}
