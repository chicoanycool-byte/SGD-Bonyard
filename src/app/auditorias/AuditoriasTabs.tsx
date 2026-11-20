'use client'

import { useState, type ReactNode } from 'react'

export default function AuditoriasTabs({
  ver,
  programar,
}: {
  ver: ReactNode
  programar: ReactNode | null
}) {
  const [tab, setTab] = useState<'ver' | 'programar'>('ver')
  const tabs = [
    { id: 'ver' as const, label: 'Ver auditorías' },
    ...(programar ? [{ id: 'programar' as const, label: 'Programar auditorías' }] : []),
  ]

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex gap-1 border-b border-black/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={
              '-mb-px border-b-2 px-4 py-2 text-[13px] font-medium transition ' +
              (tab === t.id
                ? 'border-by-primary text-by-primary'
                : 'border-transparent text-by-gray-light hover:text-by-gray-dark')
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div hidden={tab !== 'ver'}>{ver}</div>
      {programar && <div hidden={tab !== 'programar'}>{programar}</div>}
    </div>
  )
}
