// Ayuda en lenguaje normal para cada pantalla: qué es, y los pasos para usarla.
// La clave es el valor "activo" que cada página le pasa a AppShell.
export type AyudaPantalla = { sirve: string; pasos: string[] }

export const AYUDA_PANTALLAS: Record<string, AyudaPantalla> = {
  '/direccion/contexto': {
    sirve: 'Aquí está el panorama de Bonyard: qué factores internos y externos pueden afectar al sistema, y quiénes son las partes interesadas.',
    pasos: ['Elige la pestaña que quieres revisar.', 'Para agregar algo, usa el botón de agregar de esa pestaña.', 'Revisa que siga vigente al menos una vez al año.'],
  },
  '/direccion/objetivos': {
    sirve: 'Las metas del año de la Dirección, con las actividades para lograrlas y su avance.',
    pasos: ['Abre un objetivo para ver sus actividades.', 'Registra el avance de cada actividad cuando se cumpla.', 'El semáforo te dice si vas bien, atrasado o en riesgo.'],
  },
  '/direccion/riesgos': {
    sirve: 'Los riesgos que podrían afectar al sistema y las oportunidades de mejora, con lo que se hace para atenderlos.',
    pasos: ['Revisa cada riesgo y su nivel.', 'Agrega uno nuevo con el botón de agregar.', 'Anota qué acción lo controla y quién la lleva.'],
  },
  '/indicadores': {
    sirve: 'Los números que miden cómo va el sistema, mes a mes, contra su meta (FSG-06 Tablero de indicadores).',
    pasos: ['Captura el resultado del mes en cada indicador.', 'Verde cumple la meta; rojo no la cumple.', 'Si un indicador queda en rojo, abre una acción correctiva.'],
  },
  '/revision-direccion': {
    sirve: 'Las reuniones donde la Dirección revisa cómo va el sistema y decide qué hacer.',
    pasos: ['Abre una revisión para ver sus temas y acuerdos.', 'Los acuerdos quedan con responsable y fecha.'],
  },
  '/reunion-haccp': {
    sirve: 'Las reuniones del equipo HACCP, con sus acuerdos y asistentes.',
    pasos: ['Abre una reunión para ver el detalle.', 'Revisa los acuerdos pendientes.'],
  },
  '/verificacion-sgi': {
    sirve: 'Revisiones periódicas para comprobar que el sistema se sigue cumpliendo en el día a día.',
    pasos: ['Abre una verificación y responde punto por punto.', 'Lo que no cumple genera una acción para corregirlo.'],
  },
  '/verificacion-sgi/programa': {
    sirve: 'El calendario de las verificaciones del sistema: cuáles toca hacer y cuándo.',
    pasos: ['Revisa qué verificaciones están pendientes.', 'Entra a la que toca y complétala.'],
  },
  '/proveedores/evaluacion-inicial': {
    sirve: 'Para decidir si un proveedor nuevo puede trabajar con Bonyard (PCO-02 Procedimiento de selección y evaluación de proveedores críticos).',
    pasos: ['Elige el proveedor.', 'Responde las preguntas de la evaluación.', 'El resultado dice si se aprueba o no.'],
  },
  '/proveedores/permisos-trabajo': {
    sirve: 'Permisos para que un proveedor haga trabajos dentro de las instalaciones con seguridad.',
    pasos: ['Crea el permiso con el trabajo y la fecha.', 'Revisa que se cumplan las condiciones de seguridad.', 'Al terminar, ciérralo.'],
  },
  '/matriz-legal': {
    sirve: 'La lista de leyes y reglas que Bonyard debe cumplir, y si ya se cumplen (FSG-19 Matriz de requisitos legales).',
    pasos: ['Busca el requisito que te interesa.', 'Revisa su estatus de cumplimiento.', 'Lo que no se cumple pasa al plan de acción.'],
  },
  '/matriz-legal/plan-accion': {
    sirve: 'Lo que se va a hacer para cumplir los requisitos legales que todavía no se cumplen.',
    pasos: ['Revisa cada acción, su responsable y su fecha.', 'Marca cuando esté completada.'],
  },
  '/mantenimiento/programa': {
    sirve: 'El calendario de mantenimiento preventivo de equipos e instalaciones.',
    pasos: ['Revisa qué toca este mes.', 'Marca cada actividad cuando se haga.'],
  },
  '/mantenimiento/limpieza': {
    sirve: 'La lista diaria de limpieza: qué se limpió, cuándo y quién.',
    pasos: ['Marca cada punto que ya se limpió.', 'Anota si algo no se pudo hacer y por qué.'],
  },
  '/mantenimiento/metricas': {
    sirve: 'Cómo va el mantenimiento: cuánto se cumple del programa y qué falla más.',
    pasos: ['Elige el periodo.', 'Revisa los equipos con más fallas.'],
  },
  '/inocuidad-alimentaria/cultura': {
    sirve: 'Cómo hacemos que la inocuidad sea parte del día a día de todos, con objetivos y encuestas.',
    pasos: ['Revisa los objetivos y su avance.', 'Actualiza el avance cuando haya algo nuevo.', 'Registra la encuesta cuando se aplique.'],
  },
  '/inocuidad-alimentaria/defensa-alimentaria': {
    sirve: 'Cómo protegemos el alimento contra daños intencionales (sabotaje o contaminación).',
    pasos: ['Revisa los puntos vulnerables.', 'Anota las medidas de control.', 'Actualízalo al menos una vez al año.'],
  },
  '/inocuidad-alimentaria/fraude-alimentario': {
    sirve: 'Cómo evitamos que nos vendan o entreguen producto adulterado o falso.',
    pasos: ['Revisa los productos y proveedores con más riesgo.', 'Anota las medidas para prevenirlo.', 'Actualízalo cuando cambie algo.'],
  },
  '/inocuidad-alimentaria/vidrio-plastico': {
    sirve: 'El control de vidrio y plástico quebradizo, para que no caiga en el producto.',
    pasos: ['Registra los elementos que hay en cada área.', 'Revisa su estado en cada inspección.', 'Si algo se rompe, anótalo y avisa.'],
  },
  '/inocuidad-alimentaria/alergenos': {
    sirve: 'Cómo manejamos los alérgenos para que no se mezclen con otros productos.',
    pasos: ['Consulta el documento vigente.', 'Pide cambios al Coordinador del SGI si hace falta.'],
  },
  '/inocuidad-alimentaria/retirada-producto': {
    sirve: 'Qué hacemos si hay que sacar un producto del mercado o de nuestro almacén.',
    pasos: ['Consulta el procedimiento vigente.', 'Úsalo en simulacros y en casos reales.'],
  },
  '/inocuidad-alimentaria/simulacros-trazabilidad': {
    sirve: 'Pruebas para comprobar que podemos rastrear un producto de principio a fin.',
    pasos: ['Consulta el procedimiento.', 'Haz el simulacro y guarda el resultado.'],
  },
  '/inocuidad-alimentaria/gestion-crisis': {
    sirve: 'Qué hacer, y a quién avisar, ante una emergencia que afecte la inocuidad.',
    pasos: ['Consulta el procedimiento vigente.', 'Ten a la mano los contactos de emergencia.'],
  },
  '/inocuidad-alimentaria/control-plagas': {
    sirve: 'Cómo prevenimos y controlamos las plagas en las instalaciones.',
    pasos: ['Consulta el documento vigente.', 'Reporta cualquier plaga que veas.'],
  },
  '/inocuidad-alimentaria/manejo-residuos': {
    sirve: 'Cómo manejamos los residuos para que no contaminen el producto.',
    pasos: ['Consulta el procedimiento vigente.'],
  },
  '/plan-haccp/equipo': {
    sirve: 'Las personas que forman el equipo HACCP y su función.',
    pasos: ['Revisa quiénes son y qué hacen.', 'Actualiza si cambia el equipo.'],
  },
  '/plan-haccp/procesos': {
    sirve: 'Revisión de cada proceso del almacén para encontrar peligros a la inocuidad.',
    pasos: ['Elige el proceso.', 'Anota los peligros posibles y su control.'],
  },
  '/plan-haccp/productos': {
    sirve: 'Revisión de los productos que manejamos para identificar sus peligros.',
    pasos: ['Elige el producto.', 'Anota los peligros posibles y su control.'],
  },
  '/plan-haccp/plan': {
    sirve: 'El Plan HACCP: los puntos críticos de control y qué se hace en cada uno.',
    pasos: ['Revisa cada punto crítico.', 'Verifica límites, monitoreo y acciones correctivas.'],
  },
  '/plan-haccp/diagramas': {
    sirve: 'Los diagramas de flujo de los procesos, paso a paso.',
    pasos: ['Elige el diagrama que quieres ver.', 'Súbelo de nuevo si cambia el proceso.'],
  },
  '/ti/incidentes': {
    sirve: 'Registro de fallas en computadoras, redes o sistemas, y cómo se resolvieron.',
    pasos: ['Registra la falla con fecha y descripción.', 'Cuando se resuelva, ciérrala con la solución.'],
  },
  '/ti/dashboard': {
    sirve: 'Qué tanto tiempo estuvieron funcionando los sistemas.',
    pasos: ['Elige el periodo.', 'Revisa los días con más fallas.'],
  },
  '/seguridad-patrimonial/manual': {
    sirve: 'Los manuales de seguridad patrimonial de Nave 1 y Nave 2.',
    pasos: ['Elige el manual de tu nave y consúltalo.'],
  },
  '/seguridad-patrimonial/sellos': {
    sirve: 'El control de los sellos de seguridad de los embarques.',
    pasos: ['Registra el sello al cargar o recibir.', 'Revisa que coincida con el documento.'],
  },
  '/documentos': {
    sirve: 'Todos los procedimientos, manuales y formatos vigentes del sistema.',
    pasos: ['Busca por nombre o código.', 'Abre el documento para verlo o descargarlo.', 'Usa solo la versión vigente.'],
  },
  '/documentos-alta': {
    sirve: 'Para subir un documento nuevo o una nueva versión al sistema.',
    pasos: ['Elige si es nuevo o actualización.', 'Sube el archivo.', 'Revisa el código y la versión antes de guardar.'],
  },
  '/solicitudes': {
    sirve: 'Para pedir que se cree, cambie o elimine un documento del sistema.',
    pasos: ['Escribe qué documento y qué quieres cambiar.', 'El Coordinador del SGI lo revisa y te avisa.'],
  },
  '/recursos-humanos/descriptivo': {
    sirve: 'La descripción de cada puesto: para qué existe, qué hace y qué necesita.',
    pasos: ['Busca el puesto.', 'Ábrelo para ver el detalle.'],
  },
  '/recursos-humanos/organigrama': {
    sirve: 'Cómo está organizada la empresa: quién reporta a quién.',
    pasos: ['Mira la estructura.', 'Toca un puesto para ver quién lo ocupa.'],
  },
  '/recursos-humanos/cargar': {
    sirve: 'Para subir los documentos de recursos humanos, como los descriptivos de puesto.',
    pasos: ['Elige el tipo de documento.', 'Sube el archivo y guarda.'],
  },
  '/pendientes': {
    sirve: 'Todo lo que tienes por hacer en un solo lugar.',
    pasos: ['Empieza por lo más atrasado.', 'Toca un pendiente para atenderlo.'],
  },
  '/notificaciones': {
    sirve: 'Los avisos que te manda el sistema: acciones, auditorías, vencimientos y más.',
    pasos: ['Toca un aviso para ir a lo que te pide.', 'Los avisos leídos desaparecen del contador.'],
  },
  '/usuarios': {
    sirve: 'Para dar de alta o modificar a las personas que usan el sistema.',
    pasos: ['Agrega a la persona con su puesto.', 'El puesto define qué ve y qué puede hacer.'],
  },
  '/metricas-acceso': {
    sirve: 'Cuánta gente entra al sistema y qué pantallas usa más.',
    pasos: ['Elige el periodo.', 'Úsalo para saber qué módulos hay que reforzar.'],
  },
  '/politica-calidad': {
    sirve: 'La política de calidad e inocuidad de Bonyard, el compromiso de la empresa con sus clientes.',
    pasos: ['Léela completa.', 'Todo el personal debe conocerla.'],
  },
  '/reglamento-higiene': {
    sirve: 'Las reglas de higiene y bienestar que aplican a todo el personal y visitantes.',
    pasos: ['Léelo completo.', 'Aplica en piso desde el primer día.'],
  },
  '/asesor': {
    sirve: 'Un asistente al que puedes preguntarle dudas del sistema, las normas o cómo hacer algo.',
    pasos: ['Escribe tu duda como se la preguntarías a un compañero.', 'Revisa siempre el documento vigente antes de actuar.'],
  },
}
