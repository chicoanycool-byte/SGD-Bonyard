'use client'

import { useRouter } from 'next/navigation'

export default function BotonesAtrasActualizar({ rutaAtras }: { rutaAtras?: string }) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => (rutaAtras ? router.push(rutaAtras) : router.back())}
        className="flex h-8 items-center gap-1 rounded-md border border-black/10 px-3 text-[12.5px] font-medium text-by-gray-dark transition hover:bg-black/5"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Atrás
      </button>
      <button
        onClick={() => router.refresh()}
        className="flex h-8 items-center gap-1 rounded-md border border-black/10 px-3 text-[12.5px] font-medium text-by-gray-dark transition hover:bg-black/5"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
          <path
            d="M4 4v5h5M20 20v-5h-5M4.5 9a8 8 0 0 1 14.5-3M19.5 15a8 8 0 0 1-14.5 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Actualizar
      </button>
    </div>
  )
}
