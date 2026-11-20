'use client'

import { useEffect, useRef } from 'react'

// Filtros tipo Excel: cada título de columna de una tabla de listado lleva una flecha (▾)
// que abre una lista con casillas para elegir qué valores mostrar, con búsqueda.
// Para excluir una tabla: <table data-sin-filtros>.

const MIN_FILAS = 3
const MAX_VALORES = 400
const VACIO = '(Vacías)'

type Seleccion = Map<number, Set<string>> // columna → valores permitidos
const filtros = new WeakMap<HTMLTableElement, Seleccion>()

const limpio = (t: string) => t.replace(/\s+/g, ' ').trim()
const norm = (t: string) => limpio(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

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
  if (ths.length < 2 || ths.some((c) => c.colSpan > 1 || c.rowSpan > 1)) return false
  const filas = filasDatos(tabla)
  if (filas.length < MIN_FILAS) return false
  // Tablas de captura (campos editables) no se filtran: las filas se esconderían mientras se llenan.
  const editables = filas.filter((f) => f.querySelector('input, textarea, select')).length
  return editables <= filas.length / 2
}

const valorCelda = (fila: HTMLTableRowElement, i: number) => limpio(fila.cells[i]?.textContent ?? '') || VACIO

function aplicar(tabla: HTMLTableElement) {
  const sel = filtros.get(tabla)
  for (const fila of filasDatos(tabla)) {
    let visible = true
    if (sel) {
      for (const [i, permitidos] of sel) {
        if (!permitidos.has(valorCelda(fila, i))) {
          visible = false
          break
        }
      }
    }
    const deseado = visible ? '' : 'none'
    if (fila.style.display !== deseado) fila.style.display = deseado
  }
  // Marca las columnas con filtro activo
  tabla.querySelectorAll<HTMLButtonElement>('button[data-filtro-btn]').forEach((b) => {
    const i = Number(b.getAttribute('data-col'))
    b.className = claseBoton(!!sel?.has(i))
  })
}

const claseBoton = (activo: boolean) =>
  'ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded align-middle text-[10px] leading-none transition ' +
  (activo ? 'bg-by-primary text-white' : 'text-by-gray-light hover:bg-black/10 hover:text-by-gray-dark')

function procesar(tabla: HTMLTableElement) {
  Array.from(tabla.tHead!.rows[0].cells).forEach((th, i) => {
    const titulo = limpio(th.textContent ?? '').replace('▾', '').trim()
    if (!titulo || /^acciones?$/i.test(titulo)) return
    if (th.querySelector('button[data-filtro-btn]')) return
    const boton = document.createElement('button')
    boton.type = 'button'
    boton.setAttribute('data-filtro-btn', '1')
    boton.setAttribute('data-col', String(i))
    boton.setAttribute('aria-label', `Filtrar ${titulo}`)
    boton.title = 'Filtrar'
    boton.textContent = '▾'
    boton.className = claseBoton(false)
    boton.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()
      abrirPanel(tabla, i, boton)
    })
    th.appendChild(boton)
  })
  aplicar(tabla)
}

let panelAbierto: { el: HTMLDivElement; cerrar: () => void; ancla: HTMLElement } | null = null

function abrirPanel(tabla: HTMLTableElement, col: number, ancla: HTMLElement) {
  const yaAbierto = panelAbierto
  panelAbierto?.cerrar()
  if (yaAbierto && yaAbierto.ancla === ancla) return

  const filas = filasDatos(tabla)
  const conteo = new Map<string, number>()
  for (const f of filas) {
    const v = valorCelda(f, col)
    conteo.set(v, (conteo.get(v) ?? 0) + 1)
  }
  const valores = Array.from(conteo.keys()).sort((a, b) => {
    if (a === VACIO) return 1
    if (b === VACIO) return -1
    return a.localeCompare(b, 'es', { numeric: true })
  })

  const sel = filtros.get(tabla) ?? new Map<number, Set<string>>()
  filtros.set(tabla, sel)
  const permitidos = new Set<string>(sel.get(col) ?? valores)

  const el = document.createElement('div')
  el.dataset.col = String(col)
  el.className =
    'fixed z-[100] flex w-64 flex-col gap-2 rounded-lg border border-black/10 bg-white p-2.5 text-[12px] text-by-gray-dark shadow-xl'

  const buscador = document.createElement('input')
  buscador.type = 'text'
  buscador.placeholder = 'Buscar…'
  buscador.className =
    'h-7 w-full rounded-md border border-black/10 px-2 text-[12px] outline-none focus:border-by-accent focus:ring-2 focus:ring-by-accent/30'

  const lista = document.createElement('div')
  lista.className = 'max-h-56 overflow-y-auto rounded-md border border-black/5 py-1'

  const info = document.createElement('p')
  info.className = 'text-[11px] text-by-gray-light'

  const guardar = () => {
    if (permitidos.size === valores.length) sel.delete(col)
    else sel.set(col, new Set(permitidos))
    if (sel.size === 0) filtros.delete(tabla)
    else filtros.set(tabla, sel)
    aplicar(tabla)
    const visibles = filasDatos(tabla).filter((f) => f.style.display !== 'none').length
    info.textContent = `${visibles} de ${filas.length} filas`
  }

  let marcaTodo: HTMLInputElement

  const fila = (texto: string, marcado: boolean, alCambiar: (v: boolean) => void, extra?: string) => {
    const etiqueta = document.createElement('label')
    etiqueta.className = 'flex cursor-pointer items-center gap-2 px-2 py-1 hover:bg-black/[0.04]'
    const caja = document.createElement('input')
    caja.type = 'checkbox'
    caja.checked = marcado
    caja.addEventListener('change', () => alCambiar(caja.checked))
    const t = document.createElement('span')
    t.className = 'min-w-0 flex-1 truncate'
    t.textContent = texto
    t.title = texto
    etiqueta.append(caja, t)
    if (extra) {
      const n = document.createElement('span')
      n.className = 'text-[10.5px] text-by-gray-light'
      n.textContent = extra
      etiqueta.appendChild(n)
    }
    return { etiqueta, caja }
  }

  const dibujar = () => {
    lista.innerHTML = ''
    const q = norm(buscador.value)
    const visibles = valores.filter((v) => !q || norm(v).includes(q)).slice(0, MAX_VALORES)

    const todo = fila(q ? '(Seleccionar resultados)' : '(Seleccionar todo)', visibles.every((v) => permitidos.has(v)), (m) => {
      visibles.forEach((v) => (m ? permitidos.add(v) : permitidos.delete(v)))
      guardar()
      dibujar()
    })
    marcaTodo = todo.caja
    marcaTodo.indeterminate = !marcaTodo.checked && visibles.some((v) => permitidos.has(v))
    todo.etiqueta.classList.add('font-medium')
    lista.appendChild(todo.etiqueta)

    visibles.forEach((v) => {
      const item = fila(
        v,
        permitidos.has(v),
        (m) => {
          if (m) permitidos.add(v)
          else permitidos.delete(v)
          guardar()
          const todosVisibles = visibles.every((x) => permitidos.has(x))
          marcaTodo.checked = todosVisibles
          marcaTodo.indeterminate = !todosVisibles && visibles.some((x) => permitidos.has(x))
        },
        String(conteo.get(v))
      )
      lista.appendChild(item.etiqueta)
    })
    if (visibles.length === 0) {
      const vacio = document.createElement('p')
      vacio.className = 'px-2 py-2 text-by-gray-light'
      vacio.textContent = 'Sin coincidencias'
      lista.appendChild(vacio)
    }
  }

  buscador.addEventListener('input', dibujar)

  const botones = document.createElement('div')
  botones.className = 'flex items-center justify-between gap-2'
  const borrar = document.createElement('button')
  borrar.type = 'button'
  borrar.textContent = 'Borrar filtro'
  borrar.className = 'text-[11.5px] text-by-accent hover:underline'
  borrar.addEventListener('click', () => {
    valores.forEach((v) => permitidos.add(v))
    buscador.value = ''
    guardar()
    dibujar()
  })
  const cerrarBtn = document.createElement('button')
  cerrarBtn.type = 'button'
  cerrarBtn.textContent = 'Cerrar'
  cerrarBtn.className = 'h-7 rounded-md bg-by-primary px-3 text-[12px] font-medium text-white hover:bg-by-primary-dark'
  botones.append(borrar, cerrarBtn)

  el.append(buscador, lista, info, botones)
  document.body.appendChild(el)

  // Posición: bajo el título, sin salirse de la pantalla
  const r = ancla.getBoundingClientRect()
  const ancho = 256
  el.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - ancho - 8))}px`
  el.style.top = `${Math.min(r.bottom + 4, Math.max(8, window.innerHeight - 380))}px`

  const fueraClick = (e: MouseEvent) => {
    if (!el.contains(e.target as Node) && e.target !== ancla) cerrar()
  }
  const tecla = (e: KeyboardEvent) => {
    if (e.key === 'Escape') cerrar()
  }
  const cerrar = () => {
    document.removeEventListener('mousedown', fueraClick)
    document.removeEventListener('keydown', tecla)
    el.remove()
    if (panelAbierto?.el === el) panelAbierto = null
  }
  cerrarBtn.addEventListener('click', cerrar)
  document.addEventListener('mousedown', fueraClick)
  document.addEventListener('keydown', tecla)
  panelAbierto = { el, cerrar, ancla }

  dibujar()
  guardar()
  buscador.focus()
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
    return () => {
      observador.disconnect()
      panelAbierto?.cerrar()
    }
  }, [])

  return <div ref={ref}>{children}</div>
}
