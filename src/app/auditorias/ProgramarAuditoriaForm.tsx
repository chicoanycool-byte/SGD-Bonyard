'use client'

import { useActionState, useRef, useEffect, useState } from 'react'
import { programarAuditoria, type EstadoProgramarAuditoria } from './actions'
import { AvisoError, AvisoOk, BotonPrincipal, Campo, FormaTarjeta, Seccion, inputCls } from '@/components/ui/forma'

type Usuario = { id: string; nombre: string }

const inicial: EstadoProgramarAuditoria = {}

export default function ProgramarAuditoriaForm({
  usuarios,
}: {
  usuarios: Usuario[]
}) {
  const [estado, formAction, pending] = useActionState(programarAuditoria, inicial)
  const formRef = useRef<HTMLFormElement>(null)
  const [tipo, setTipo] = useState('')

  useEffect(() => {
    if (estado.ok) {
      formRef.current?.reset()
      setTipo('')
    }
  }, [estado.ok])

  return (
    <FormaTarjeta
      titulo="Programar una auditoría"
      intro="Elige qué se va a auditar, cuándo y quién la hace. Al guardar se avisa a las personas involucradas."
    >
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <Seccion numero={1} titulo="¿Qué se va a auditar?" ayuda="Norma, tipo de auditoría y dónde.">
          <Campo label="¿Con qué norma?">
            <select name="norma" required defaultValue="" className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              <option value="iso_9001">ISO 9001:2015</option>
              <option value="sqf">SQF</option>
              <option value="ambas">Ambas (ISO 9001:2015 + SQF)</option>
            </select>
          </Campo>
          <Campo label="¿Quién audita?" ayuda="Interna: la hace el equipo de Bonyard. Cliente: la hace un cliente.">
            <select name="tipo" required value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              <option value="interna">Interna</option>
              <option value="cliente">Cliente</option>
            </select>
          </Campo>
          {tipo === 'cliente' && (
            <Campo ancho label="¿Qué cliente la hace?">
              <input name="cliente_nombre" required className={inputCls} />
            </Campo>
          )}
          <Campo label="Nave auditada" opcional>
            <select name="nave" defaultValue="" className={inputCls}>
              <option value="">No aplica</option>
              <option value="Nave 1">Nave 1</option>
              <option value="Nave 2">Nave 2</option>
              <option value="Nave 3">Nave 3</option>
            </select>
          </Campo>
          <Campo label="Proceso o área">
            <select name="proceso" required defaultValue="" className={inputCls}>
              <option value="" disabled>Elige una opción</option>
              <option value="Almacén">Almacén</option>
              <option value="Transporte">Transporte</option>
              <option value="Ambas">Ambas</option>
            </select>
          </Campo>
        </Seccion>

        <Seccion numero={2} titulo="¿Cuándo y quién la hace?" ayuda="Puedes asignar a los auditores después.">
          <Campo label="Fecha de la auditoría">
            <input name="fecha" type="date" required className={inputCls} />
          </Campo>
          <div />
          <Campo label="Auditor líder" opcional>
            <select name="auditor_lider_id" defaultValue="" className={inputCls}>
              <option value="">Asignar después</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Auditor auxiliar" opcional>
            <select name="auditor_auxiliar_id" defaultValue="" className={inputCls}>
              <option value="">Asignar después</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo ancho label="Comentarios" opcional>
            <input name="observaciones" className={inputCls} />
          </Campo>
        </Seccion>

        {estado.error && <AvisoError>{estado.error}</AvisoError>}
        {estado.ok && <AvisoOk>Listo, la auditoría quedó programada y se avisó a los involucrados. La verás en el programa de abajo.</AvisoOk>}
        <div>
          <BotonPrincipal pendiente={pending} textoPendiente="Programando…">Programar auditoría</BotonPrincipal>
        </div>
      </form>
    </FormaTarjeta>
  )
}
