'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SubirDocumentoForm from './SubirDocumentoForm'
import SubidaMasiva from './SubidaMasiva'

export default function PanelCarga() {
  const [modo, setModo] = useState<'individual' | 'masiva'>('individual')
  const router = useRouter()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 text-[12px]">
        <button
          onClick={() => setModo('individual')}
          className={
            'rounded-md px-3 py-1 ' +
            (modo === 'individual'
              ? 'bg-by-primary text-white'
              : 'bg-[#f4f6f6] text-by-gray-dark')
          }
        >
          Carga individual
        </button>
        <button
          onClick={() => setModo('masiva')}
          className={
            'rounded-md px-3 py-1 ' +
            (modo === 'masiva'
              ? 'bg-by-primary text-white'
              : 'bg-[#f4f6f6] text-by-gray-dark')
          }
        >
          Carga masiva
        </button>
      </div>

      {modo === 'individual' ? (
        <SubirDocumentoForm />
      ) : (
        <SubidaMasiva onTerminado={() => router.refresh()} />
      )}
    </div>
  )
}
