'use client'

import { useEffect, useRef } from 'react'

// Agrega, bajo los títulos de cada tabla de listado, un filtro por columna
// (lista desplegable si la columna tiene pocos valores distintos; texto si no).
// Para excluir una tabla: <table data-sin-filtros>.

const MIN_FILAS = 4
const MAX_OPCIONES = 15

const norm = (t: string) =>
  t.replace(/\s+/g, ' ').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const limpio = (t: string) => t.replace(/\s+/g, ' ').trim()

const CLASE_CONTROL =
  'h-7 w-full min-w-[70px] rounded-md border border-black/10 bg-white px-1.5 text-[11.5px] font-normal normal-case text-by-gray-dark outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

function filasDatos(tabla: HTMLTableElement): HTMLTableRowElement[] {
  const filas: HTMLTableRowElement[] = []
  for (const tb of Array.from(tabla.tBodies)) {
    for (const tr of Array.from(tb.rows)) {
      if (Array.from(tr.cells).some((c) => c.colSpan > 1)) continue
      filas.push(tr)
    }
  }
  return filas
}

function elegible(tabla: HTMLTableElement): boolean {
  if (tabla.closest('[data-sin-filtros]')) return false
  const thead = tabla.tHead
  if (!thead || thead.rows.length !== 1) return false
  const ths = Array.from(thead.rows[0].cells)
  if (ths.length < 3 || ths.some((c) => c.colSpan > 1 || c.rowSpan > 1)) return false
  const filas = filasDatos(tabla)
  if (filas.length < MIN_FILAS) return false
  // Tablas de captura (con campos editables) no se filtran: las filas se esconderían mientras se llenan.
  const editables = filas.filter((f) => f.querySelector('input, textarea, select')).length
  if (editables > filas.length / 2) return false
  return true
}

function textoCelda(fila: HTMLTableRowElement, i: number) {
  return limpio(fila.cells[i]?.textContent ?? '')
}

function procesar(tabla: HTMLTableElement) {
  const thead = tabla.tHead!
  const ths = Array.from(thead.rows[0].cells)
  const filas = filasDatos(tabla)

  let filaFiltros = thead.querySelector<HTMLTableRowElement>('tr[data-filtros-fila]')
  if (!filaFiltros) {
    filaFiltros = document.createElement('tr')
    filaFiltros.setAttribute('data-filtros-fila', '1')
    ths.forEach((th, i) => {
      const celda = document.createElement('th')
      celda.className = 'px-2 pb-2 pt-0 font-normal'
      const titulo = limpio(th.textContent ?? '')
      if (!titulo || /^acciones?$/i.test(titulo)) {
        filaFiltros!.appendChild(celda)
        return
      }
      celda.setAttribute('data-col', String(i))
      filaFiltros!.appendChild(celda)
    })
    thead.appendChild(filaFiltros)
    filaFiltros.addEventListener('input', () => aplicar(tabla))
    filaFiltros.addEventListener('change', () => aplicar(tabla))
  }

  // Controles (se crean una vez; las opciones de las listas se mantienen al día)
  filaFiltros.querySelectorAll<HTMLTableCellElement>('th[data-col]').forEach((celda) => {
    const i = Number(celda.getAttribute('data-col'))
    const valores = Array.from(new Set(filas.map((f) => textoCelda(f, i)).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'es')
    )
    const usaLista = valores.length >= 2 &&
      valores.length <= MAX_OPCIONES &&
      valores.length <= filas.length * 0.6 &&
      valores.every((v) => v.length <= 40)
    let control = celda.firstElementChild as HTMLInputElement | HTMLSelectElement | null

    if (usaLista) {
      if (!control || control.tagName !== 'SELECT') {
        celda.innerHTML = ''
        control = document.createElement('select')
        control.className = CLASE_CONTROL
        celda.appendChild(control)
      }
      const select = control as HTMLSelectElement
      const actuales = Array.from(select.options).slice(1).map((o) => o.value)
      const igual = actuales.length === valores.length && actuales.every((v, k) => v === valores[k])
      if (select.options.length === 0 || !igual) {
        const previo = select.value
        select.innerHTML = ''
        const todos = document.createElement('option')
        todos.value = ''
        todos.textContent = 'Todos'
        select.appendChild(todos)
        valores.forEach((v) => {
          const op = document.createElement('option')
          op.value = v
          op.textContent = v
          select.appendChild(op)
        })
        select.value = valores.includes(previo) ? previo : ''
      }
    } else if (!control || control.tagName !== 'INPUT') {
      celda.innerHTML = ''
      control = document.createElement('input')
      control.type = 'text'
      control.placeholder = 'Filtrar…'
      control.className = CLASE_CONTROL
      celda.appendChild(control)
    }
  })

  aplicar(tabla)
}

function aplicar(tabla: HTMLTableElement) {
  const filaFiltros = tabla.tHead?.querySelector<HTMLTableRowElement>('tr[data-filtros-fila]')
  if (!filaFiltros) return
  const criterios: { i: number; valor: string; exacto: boolean }[] = []
  filaFiltros.querySelectorAll<HTMLTableCellElement>('th[data-col]').forEach((celda) => {
    const control = celda.firstElementChild as HTMLInputElement | HTMLSelectElement | null
    if (!control || !control.value.trim()) return
    criterios.push({
      i: Number(celda.getAttribute('data-col')),
      valor: norm(control.value),
      exacto: control.tagName === 'SELECT',
    })
  })
  for (const fila of filasDatos(tabla)) {
    const visible = criterios.every(({ i, valor, exacto }) => {
      const texto = norm(fila.cells[i]?.textContent ?? '')
      return exacto ? texto === valor : texto.includes(valor)
    })
    const deseado = visible ? '' : 'none'
    if (fila.style.display !== deseado) fila.style.display = deseado
  }
}

export default function FiltrosTablas({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raiz = ref.current
    if (!raiz) return
    let pendiente = false

    const revisar = () => {
      pendiente = false
      raiz.querySelectorAll<HTMLTableElement>('table').forEach((tabla) => {
        if (elegible(tabla)) procesar(tabla)
      })
    }
    const programar = () => {
      if (pendiente) return
      pendiente = true
      requestAnimationFrame(revisar)
    }

    revisar()
    const observador = new MutationObserver(programar)
    observador.observe(raiz, { childList: true, subtree: true, characterData: true })
    return () => observador.disconnect()
  }, [])

  return <div ref={ref}>{children}</div>
}
