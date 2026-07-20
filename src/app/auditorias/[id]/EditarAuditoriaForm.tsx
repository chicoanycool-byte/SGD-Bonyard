'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { editarAuditoria } from './actions'

type Usuario = { id: string; nombre: string }

export default function EditarAuditoriaForm({
  auditoria,
  usuarios,
}: {
  auditoria: {
    id: string
    fecha: string
    norma: string
    tipo: string
    proceso: string | null
    cliente_nombre: string | null
    nave: string | null
    auditor_lider_id: string | null
    auditor_auxiliar_id: string | null
    observaciones: string | null
  }
  usuarios: Usuario[]
}) {
  const [editando, setEditando] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const [campos, setCampos] = useState({
    fecha: auditoria.fecha,
    norma: auditoria.norma,
    tipo: auditoria.tipo,
    proceso: auditoria.proceso ?? '',
    cliente_nombre: auditoria.cliente_nombre ?? '',
    nave: auditoria.nave ?? '',
    auditor_lider_id: auditoria.auditor_lider_id ?? '',
    auditor_auxiliar_id: auditoria.auditor_auxiliar_id ?? '',
    observaciones: auditoria.observaciones ?? '',
  })

  const inputCls = 'h-8 w-full rounded-md border border-black/10 px-2.5 text-[13px]'

  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        className="h-8 rounded-md border border-black/10 px-3 text-[12.5px] font-medium text-by-gray-dark hover:bg-black/5"
      >
        Editar
      </button>
    )
  }

  return (
    <div className="mt-3 rounded-md bg-[#f4f6f6] p-3">
      <p className="mb-2 text-[12.5px] font-medium text-by-gray-dark">Editar auditoría</p>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Fecha</label>
          <input
            type="date"
            value={campos.fecha}
            onChange={(e) => setCampos({ ...campos, fecha: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Norma</label>
          <select
            value={campos.norma}
            onChange={(e) => setCampos({ ...campos, norma: e.target.value })}
            className={inputCls}
          >
            <option value="iso_9001">ISO 9001:2015</option>
            <option value="sqf">SQF</option>
            <option value="ambas">Ambas</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Tipo</label>
          <select
            value={campos.tipo}
            onChange={(e) => setCampos({ ...campos, tipo: e.target.value })}
            className={inputCls}
          >
            <option value="interna">Interna</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Proceso / Área</label>
          <select
            value={campos.proceso}
            onChange={(e) => setCampos({ ...campos, proceso: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            <option value="Almacén">Almacén</option>
            <option value="Transporte">Transporte</option>
            <option value="Ambas">Ambas</option>
          </select>
        </div>
        {campos.tipo === 'cliente' && (
          <div>
            <label className="mb-1 block text-[11px] text-by-gray-dark">Nombre del cliente</label>
            <input
              value={campos.cliente_nombre}
              onChange={(e) => setCampos({ ...campos, cliente_nombre: e.target.value })}
              className={inputCls}
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Nave auditada</label>
          <select
            value={campos.nave}
            onChange={(e) => setCampos({ ...campos, nave: e.target.value })}
            className={inputCls}
          >
            <option value="">—</option>
            <option value="Nave 1">Nave 1</option>
            <option value="Nave 2">Nave 2</option>
            <option value="Nave 3">Nave 3</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Auditor líder</label>
          <select
            value={campos.auditor_lider_id}
            onChange={(e) => setCampos({ ...campos, auditor_lider_id: e.target.value })}
            className={inputCls}
          >
            <option value="">— Sin asignar —</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-by-gray-dark">Auditor auxiliar</label>
          <select
            value={campos.auditor_auxiliar_id}
            onChange={(e) => setCampos({ ...campos, auditor_auxiliar_id: e.target.value })}
            className={inputCls}
          >
            <option value="">— Sin asignar —</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-span-4">
          <label className="mb-1 block text-[11px] text-by-gray-dark">Comentarios</label>
          <input
            value={campos.observaciones}
            onChange={(e) => setCampos({ ...campos, observaciones: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await editarAuditoria(auditoria.id, {
                ...campos,
                proceso: campos.proceso || null,
                cliente_nombre: campos.tipo === 'cliente' ? campos.cliente_nombre || null : null,
                nave: campos.nave || null,
                auditor_lider_id: campos.auditor_lider_id || null,
                auditor_auxiliar_id: campos.auditor_auxiliar_id || null,
                observaciones: campos.observaciones || null,
              })
              setEditando(false)
              router.refresh()
            })
          }
          className="h-8 w-fit rounded-md bg-by-primary px-4 text-[12.5px] font-medium text-white disabled:opacity-60"
        >
          Guardar cambios
        </button>
        <button
          onClick={() => setEditando(false)}
          className="h-8 w-fit rounded-md border border-black/10 px-4 text-[12.5px] text-by-gray-dark hover:bg-white"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
