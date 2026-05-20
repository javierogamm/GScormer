## v1.73.6 - Alertas por etiqueta_codigo y selector con lupa en modal

### Cambios consolidados
- En el modal **Generar alertas**, el criterio de coincidencia se mantiene estrictamente por **código de etiqueta** (`etiqueta_codigo`), aunque el usuario pegue textos en formato `Codigo-Nombre` desde SCORM; el parseo ignora el nombre para el match.
- Se actualiza el texto de ayuda del campo para dejar explícito que la generación cruza solo por código de etiqueta.
- Se añade un selector con **lupa** dentro del modal para buscar etiquetas por **Código-Nombre** y seleccionarlas con comportamiento multiselección.
- Las etiquetas seleccionadas en el selector se muestran en verde, se pueden desmarcar pulsándolas, y se pueden volcar al textarea con el botón **Usar seleccionadas**.
- Se limpian los estados del selector (abierto, búsqueda y seleccionadas) al cerrar el modal o al completar la generación.
- Se actualiza versión visible de APP y `package.json` a `1.73.6`.

### Versionado
- Versión anterior: `1.73.5`
- Nueva versión consolidada: `1.73.6`

## v1.73.5 - Alertas por etiquetas pegadas en SCORM Master

- En **Generar alertas**, el copypaste de etiquetas ahora se aplica contra la columna `scorm_etiquetas` de `scorms_master` (intersección por código de etiqueta), sin depender de la clasificación SCORM.
- Se mantiene el parseo flexible del pegado (espacios, comas, saltos de línea y `;`) para compatibilidad con los formatos de copia actuales.
- Se actualiza el mensaje funcional cuando no hay coincidencias para reflejar el nuevo criterio de búsqueda por etiquetas en master.
- Se actualiza versión visible de APP y `package.json` a `1.73.5`.
- Nueva versión consolidada: `1.73.5`

## v1.73.3 - Gestión completa de etiquetas y búsqueda por nombre

### Cambios consolidados
- En el modal individual de etiquetas del SCORM, el botón pasa a **Gestionar etiquetas** y al abrirlo carga como selección inicial las etiquetas actuales del SCORM para poder quitarlas y no solo añadir nuevas.
- La acción de guardado del modal individual ahora persiste exactamente la selección activa (incluyendo dejarla vacía), habilitando la eliminación real de etiquetas ya asignadas.
- En los filtros tipo lookup de la columna **Etiquetas**, la búsqueda ahora también contempla `etiqueta_nombre` además del código, de modo que se pueden encontrar etiquetas escribiendo por nombre.
- Se mantiene la persistencia de filtros por código de etiqueta, pero con enriquecimiento de búsqueda para resolver descubrimiento por nombre.
- Se actualiza versión visible de APP y `package.json` a `1.73.3`.

### Versionado
- Versión anterior: `1.73.2`
- Nueva versión consolidada: `1.73.3`

---

## v1.73.2 - Modal de etiquetas sugeridas por clasificación SCORM

### Cambios consolidados
- En el modal individual **Etiquetas del SCORM** se añade el botón **Etiquetas sugeridas** (solo en edición individual, no en edición masiva).
- El botón abre un segundo modal sin buscador que muestra, con scroll vertical, las etiquetas cuya `clasificacion_scorm` coincide con la `scorm_categoria` del SCORM en edición.
- En el segundo modal se permite selección contextual por clic sobre cada etiqueta: seleccionar/quitar individualmente, **Seleccionar todas** y **Borrar todas**.
- El botón **Añadir seleccionadas** incorpora esas etiquetas al selector de **+ Añadir etiquetas** del modal principal, dejándolas marcadas como seleccionadas para su guardado.
- Se actualiza versión visible de APP y `package.json` a `1.73.2`.

### Versionado
- Versión anterior: `1.73.1`
- Nueva versión consolidada: `1.73.2`

---

## v1.73.1 - Etiquetas seleccionadas fijas arriba en pickers

### Cambios consolidados
- En el selector de etiquetas del modal individual de SCORM, las etiquetas que se van seleccionando ahora se muestran en un bloque superior fijo y siempre visible.
- En ese bloque superior se añade acción directa para quitar cada etiqueta seleccionada (toggle de eliminación).
- Se aplica el mismo comportamiento en el selector de etiquetas del modal de edición masiva de SCORMs: seleccionadas arriba + opción de quitarlas.
- Se mantiene el flujo de búsqueda tipo Qlik debajo del bloque de seleccionadas para seguir añadiendo más etiquetas.
- Se actualiza versión visible de APP y `package.json` a `1.73.1`.

### Versionado
- Versión anterior: `1.73.0`
- Nueva versión consolidada: `1.73.1`

---

## v1.73.0 - Alta múltiple de etiquetas en modal individual y edición masiva

### Cambios consolidados
- En el modal de etiquetas de SCORM individual se añade botón **+ Añadir etiquetas**.
- El botón abre un buscador tipo Qlik (búsqueda + selección múltiple) para escoger una o varias etiquetas del catálogo y agregarlas al SCORM en una sola acción.
- En el modal **Editar selección de SCORMs** se añade bloque **+ Añadir etiquetas masivamente** con buscador tipo Qlik y selección múltiple.
- La acción masiva agrega (merge sin duplicados) las etiquetas seleccionadas a todos los SCORMs chequeados.
- Se renombra el botón superior de acción masiva a **Editar Selección (n)** mostrando `n` como número de SCORMs seleccionados.
- Se actualiza versión visible de APP y `package.json` a `1.73.0`.

### Versionado
- Versión anterior: `1.72.9`
- Nueva versión consolidada: `1.73.0`

---

## v1.72.9 - Corrección de build por JSX residual en modal de etiquetas

### Cambios consolidados
- Se elimina un bloque JSX residual/huérfano que quedó tras el cierre del modal de etiquetas en `ScormsTable.js` y que rompía el parseo del archivo durante el deploy.
- Se corrige el error de compilación reportado por Vercel (`Expression expected` / `Unterminated regexp literal`) al dejar el árbol JSX balanceado y sin fragmentos fuera de contexto.
- Se mantiene la funcionalidad de modal de etiquetas y el resto de vistas sin alterar la lógica de negocio.
- Se actualiza versión visible de APP y `package.json` a `1.72.9`.

### Versionado
- Versión anterior: `1.72.8`
- Nueva versión consolidada: `1.72.9`

---

## v1.72.8 - Gestión avanzada de etiquetas SCORM

### Cambios consolidados
- La columna de SCORM `scorm_etiquetas` pasa a mostrarse como **Etiquetas** y ahora presenta un botón tipo bullet para abrir un modal con las etiquetas asociadas al SCORM.
- Las etiquetas se interpretan con soporte multivalor separadas por `;` y se muestran en formato **`etiqueta_codigo - etiqueta_nombre`**.
- Se aplica color por etiqueta en base a `clasificacion_scorm`, reutilizando la gama cromática de clasificación SCORM para homogeneidad visual.
- El filtro por etiquetas del panel usa cada etiqueta individual (descomponiendo valores compuestos) para permitir filtrado tipo Qlik por código de etiqueta.
- Se añade un nuevo **Gestor etiquetas** para admin, con búsqueda, listado editable, carga de borrador al pulsar una fila y guardado (alta/edición) por `upsert` en `scorms_etiquetas`.
- En edición masiva de SCORMs se mantiene el soporte de campos actuales y se deja preparada la estructura para evolución de edición masiva de etiquetas.
- Se actualiza versión visible de APP y `package.json` a `1.72.8`.

### Versionado
- Versión anterior: `1.72.7`
- Nueva versión consolidada: `1.72.8`

---

## v1.72.7 - Edición masiva de SCORMs y Cursos para ADMIN

### Cambios consolidados
- En **SCORMs** se añade el botón **EDITAR SELECCIÓN** a la derecha de **Actualizar selección**, habilitado solo para perfiles `admin: true` cuando hay más de un SCORM checado.
- El botón abre un modal de edición masiva con los campos **Responsable**, **Tipo**, **Categoría**, **Subcategoría** y **Test**, aplicando los valores elegidos a todos los SCORMs seleccionados.
- En **Cursos · Vista general** se incorpora selección por checkbox (individual y seleccionar todos los visibles) para habilitar edición masiva.
- En **Cursos** se añade un modal **EDITAR SELECCIÓN** (solo `admin: true` y más de un curso checado) para actualizar en bloque **Curso instructor**, **Materia** e **Inscripción**.
- Se actualiza versión visible de APP y `package.json` a `1.72.7`.

### Versionado
- Versión anterior: `1.72.6`
- Nueva versión consolidada: `1.72.7`

---

## v1.72.6 - Aplicación rápida de valores buscados en filtros

### Cambios consolidados
- En los selectores con lupa de **SCORMs**, al pulsar **Enter** dentro del buscador interno se seleccionan todos los valores disponibles que coinciden con el texto escrito y se aplica el filtro automáticamente.
- En los selectores con lupa de **Cursos/PA**, al pulsar **Enter** dentro del buscador interno se seleccionan todos los valores disponibles que coinciden con el texto escrito y se aplica el filtro automáticamente.
- La selección rápida conserva las selecciones temporales existentes del selector y añade los valores coincidentes sin duplicados antes de cerrar el desplegable.
- Se actualiza versión visible de APP y `package.json` a `1.72.6`.

### Versionado
- Versión anterior: `1.72.5`
- Nueva versión consolidada: `1.72.6`

---

## v1.72.5 - Detalles ampliados y SCORMs en PA

### Cambios consolidados
- Se añade en el detalle/edición de **Plan de aprendizaje** un acordeón **SCORMS** que identifica los SCORMs presentes en los cursos asociados al PA y los lista en modo solo lectura.
- El acordeón de SCORMs del PA se recalcula con los cursos seleccionados para el plan, sin permitir editar esas relaciones desde el listado de SCORMs.
- Las vistas de detalle de **SCORM**, **Curso** y **PA** pasan a tener un ancho base un 75% mayor, con límites adaptados al viewport.
- Las vistas de detalle ampliadas se pueden redimensionar manualmente desde el lateral o la esquina mediante el comportamiento nativo de resize.
- Se actualiza versión visible de APP y `package.json` a `1.72.5`.

### Versionado
- Versión anterior: `1.72.4`
- Nueva versión consolidada: `1.72.5`

---

## v1.72.4 - Selectores con lupa en todos los filtros

### Cambios consolidados
- Todos los filtros del panel de **SCORMs** pasan a usar el selector con lupa estilo Qlik Sense, incluyendo código, nombre, tipo, subcategoría, URL, cursos y observaciones.
- Todos los filtros del panel de **Cursos/PA** pasan a usar el selector con lupa estilo Qlik Sense, incluyendo códigos, nombres, descripciones, observaciones, SCORMs y tiempo de certificación.
- El selector de SCORMs asociados en Cursos se alimenta de las referencias del maestro de SCORMs para facilitar la búsqueda por código/idioma desde el panel de filtros.
- Se mantiene la selección múltiple, búsqueda interna, resaltado de valores seleccionados y acciones **Aplicar filtro** / **Limpiar** en todos los campos filtrables.
- Se actualiza versión visible de APP y `package.json` a `1.72.4`.

### Versionado
- Versión anterior: `1.72.3`
- Nueva versión consolidada: `1.72.4`

---

## v1.72.3 - Reagrupación de PA en detalle de curso

### Cambios consolidados
- Se añade debajo del acordeón **SCORMS** un nuevo acordeón **Planes de aprendizaje** en el modal **Detalle del curso**.
- El acordeón de PA incorpora dos botones lado a lado: **Ver PA asociados** y **VINCULAR PLAN DE APRENDIZAJE**.
- **Ver PA asociados** despliega los planes ya vinculados al curso y permite deschecar PA con confirmación previa; los cambios quedan pendientes hasta pulsar **Guardar cambios** en el pie del modal.
- **VINCULAR PLAN DE APRENDIZAJE** despliega un buscador/listado de PA disponibles para checarlos y añadirlos al curso en el guardado consolidado.
- Al guardar el detalle del curso se actualizan los datos del curso, el contenido de SCORMs y las altas/bajas de PA seleccionadas en una única acción de usuario.
- Se actualiza versión visible de APP y `package.json` a `1.72.3`.

### Versionado
- Versión anterior: `1.72.2`
- Nueva versión consolidada: `1.72.3`

---

## v1.72.2 - Reagrupación de SCORMs en detalle de curso

### Cambios consolidados
- Se sustituye el bloque directo de asociación de SCORMs del modal **Detalle del curso** por un acordeón **SCORMS**.
- Dentro del acordeón se añaden dos acciones lado a lado: **Ver scorms asociados** para revisar y deschecar SCORMs ya vinculados, y **VINCULAR SCORMS** para desplegar el buscador de SCORMs disponibles para añadir.
- Los SCORMs deschequeados o vinculados siguen aplicándose únicamente al pulsar **Guardar cambios** en el pie del modal.
- Al deschecar un SCORM asociado se solicita confirmación antes de retirarlo de la selección pendiente.
- Se actualiza versión visible de APP y `package.json` a `1.72.2`.

### Versionado
- Versión anterior: `1.72.1`
- Nueva versión consolidada: `1.72.2`

---

## v1.72.1 - Reordenación de filtros de cursos y PA

### Cambios consolidados
- Se reorganiza el panel de filtros de **Cursos · Vista general** para mostrar por defecto las tres filas solicitadas: estado/instructor/materia/código/nombre, inscripción/descripción/tiempo de certificación/test/observaciones y datos PA.
- Los filtros **Inscripción**, **Test** y **PA Forma parte** usan selector con lupa y búsqueda interna en el panel visible.
- Se añade el filtro numérico desde-hasta de **Tiempo certificación** sobre `tiempo_cert`, con límites inclusivos para buscar desde, hasta o entre ambos valores.
- El resto de campos de cursos queda dentro del bloque **Mostrar más filtros**, incluyendo el filtro de SCORMs.
- En la vista **Planes de aprendizaje (PA)** se añade una línea superior específica con **PA Código** y **PA Nombre** antes del resto de filtros visibles.
- Se actualiza versión visible de APP y `package.json` a `1.72.1`.

### Versionado
- Versión anterior: `1.72.0`
- Nueva versión consolidada: `1.72.1`

---

## v1.72.0 - Selectores de filtros con buscador múltiple

### Cambios consolidados
- Se reemplazan los desplegables simples del panel de filtros de **SCORMs** por el selector con lupa, búsqueda interna, selección múltiple, resaltado visual y acciones **Aplicar filtro** / **Limpiar**, igualando la experiencia de la vista Cursos.
- Los filtros de SCORMs para responsable, clasificación/categoría, estado, test e idioma ahora permiten seleccionar varios valores antes de aplicar el filtro.
- La acción global **Limpiar filtros** de SCORMs también limpia selecciones temporales, búsquedas internas de selectores y cualquier selector abierto.
- Se amplían los selectores múltiples del panel de **Cursos/PA** para incluir **PA Código**, **PA Nombre** e **Idioma curso**, facilitando la búsqueda y selección múltiple en vistas de planes de aprendizaje y cursos relacionados.
- Se actualiza versión visible de APP y `package.json` a `1.72.0`.

### Versionado
- Versión anterior: `1.71.9`
- Nueva versión consolidada: `1.72.0`

---

## v1.71.9 - Limpieza global de filtros

### Cambios consolidados
- Se añade la acción **Limpiar filtros** en el encabezado del panel de filtros de SCORMs para retirar de una sola vez todos los filtros aplicados y vaciar los campos pendientes.
- Se añade la acción **Limpiar filtros** en el encabezado del panel de filtros de Cursos, con limpieza completa de filtros aplicados, búsquedas de lupa, selecciones temporales y selector abierto.
- En las vistas de **Traducciones** de SCORMs y cursos se incorpora el botón **Limpiar filtros de traducción** para volver al preset general, limpiar el idioma pendiente y desmarcar selecciones acumuladas.
- En la bandeja de publicación de SCORMs se añade **Limpiar filtros de publicación** para regresar al preset general.
- La limpieza global queda disponible para las vistas dependientes del panel de filtros compartido, incluyendo Cursos, Planes de aprendizaje, Relaciones, Validación y Publicación.
- Se actualiza versión visible de APP y `package.json` a `1.71.9`.

### Versionado
- Versión anterior: `1.71.8`
- Nueva versión consolidada: `1.71.9`

---

## v1.71.8 - Selector de filtros estilo Qlik en cursos

### Cambios consolidados
- Se rediseña el selector múltiple por lupa de **Cursos** para mostrar cada valor como una línea clicable, sin checks, con estado seleccionado resaltado en verde y estado normal en blanco.
- Se añade búsqueda textual dentro del selector para filtrar los valores disponibles antes de seleccionar, con comportamiento similar a Qlik Sense.
- Los valores largos del selector se mantienen en una sola línea y se recortan visualmente con puntos suspensivos para evitar desbordes de ancho.
- Se incorpora **Curso descripción** al bloque de filtros adicionales para cubrir el filtro secundario de descripción solicitado en la limpieza del panel.
- Se actualiza versión visible de APP y `package.json` a `1.71.8`.

### Versionado
- Versión anterior: `1.71.7`
- Nueva versión consolidada: `1.71.8`

---

## v1.71.7 - Limpieza y selección múltiple en filtros de cursos

### Cambios consolidados
- Se reorganiza el panel de filtros de **Cursos** para dejar visibles los filtros principales y mover campos secundarios a un bloque desplegable con el botón **Mostrar más filtros** situado al final derecho del panel.
- Los filtros **PA Forma parte**, **Instructor**, **Estado curso**, **Tipología**, **Materia** y **Categoría** pasan a usar un selector abierto desde lupa con lista de valores disponibles, selección múltiple y botón **Aplicar filtro**.
- La aplicación de varios valores dentro de un mismo campo de filtro se evalúa como coincidencia con cualquiera de los valores seleccionados, manteniendo combinación acumulativa entre campos distintos.
- Se añaden estilos específicos para el selector de valores, el desplegable de filtros adicionales y sus acciones.
- Se actualiza versión visible de APP y `package.json` a `1.71.7`.

### Versionado
- Versión anterior: `1.71.6`
- Nueva versión consolidada: `1.71.7`

---

## v1.71.6 - Alta admin de categorías y subcategorías SCORM

### Cambios consolidados
- En los selectores del modal **Crear SCORM** se añade para usuarios ADMIN la opción final para crear nuevas categorías y subcategorías.
- La opción de nueva categoría/subcategoría solicita el valor, lo selecciona automáticamente y lo incorpora a las opciones disponibles de la sesión para que aparezca de inmediato en los selectores.
- Se aplica la misma gestión de nuevas categorías y subcategorías al modal **DETALLES** de SCORM, manteniendo la restricción de alta solo para usuarios ADMIN.
- Se mantiene la creación de nuevos valores ya existente en el resto de selectores gestionados y se actualiza el texto de la opción para indicar el campo añadido.
- Se actualiza versión visible de APP y `package.json` a `1.71.6`.

### Versionado
- Versión anterior: `1.71.5`
- Nueva versión consolidada: `1.71.6`

---

## v1.71.5 - Reconexión de sesión desde cookies al entrar

### Cambios consolidados
- Se añade el endpoint `/api/auth/session` para validar la cookie HTTP-only `gscormer_session`, recargar el usuario actual desde `scorms_users` y renovar la cookie antes de cargar datos protegidos.
- Al entrar en el landing, la aplicación muestra un estado de reconexión y no monta las tablas hasta confirmar o descartar la sesión del navegador, evitando cargas con cookies antiguas o no reenganchadas.
- La sesión del frontend se normaliza en una única función para mantener sincronizados permisos, asociaciones de agente y `localStorage` tanto en login manual como en reconexión por cookie.
- Se corrige el reenganche manual de agente para leer permisos desde la respuesta de base de datos en vez de referencias inexistentes del login anterior.
- Se actualiza versión visible de APP y `package.json` a `1.71.5`.

### Versionado
- Versión anterior: `1.71.4`
- Nueva versión consolidada: `1.71.5`

---

## v1.71.4 - MIS VALIDACIONES y edición de rechazos

### Cambios consolidados
- Se renombra la bandeja **MIS SCORMS** a **MIS VALIDACIONES** en la navegación y en los textos del modal de rechazo.
- Los usuarios ADMIN acceden en **MIS VALIDACIONES** a todos los SCORMs pendientes de validación, pendientes de publicación, actualizados pendientes de publicación y rechazados de todos los usuarios.
- Se añade la columna visual **Usuario creador** en **MIS VALIDACIONES** y se guarda el nuevo campo `scorm_creador` en altas manuales, traducciones e importaciones Excel.
- Los SCORMs rechazados permiten editar el motivo de rechazo desde **MIS VALIDACIONES**, precargando el comentario existente antes de confirmar.
- Se consolida la persistencia de metadatos de rechazo (`scorm_rechazo_comentario`, usuario, fecha y estado anterior) al rechazar, y se limpian al reenviar el SCORM.
- Se añade migración para crear la columna `scorm_creador` en `scorms_master`.
- Se actualiza versión visible de APP y `package.json` a `1.71.4`.

### Versionado
- Versión anterior: `1.71.3`
- Nueva versión consolidada: `1.71.4`

---

## v1.71.3 - Rechazo en columna scorm_rechazo y ajuste MIS SCORMS

### Cambios consolidados
- Se añade la columna `scorm_rechazo` a `scorms_master` para registrar directamente el comentario obligatorio cuando se rechaza una validación o una publicación.
- El rechazo actualiza solo el estado a `Rechazado` y el comentario en `scorm_rechazo`, por lo que el SCORM sale de las bandejas **Pendiente validación** y **Pendiente publicación** al no conservar esos estados pendientes.
- La bandeja **MIS SCORMS** lee el comentario desde `scorm_rechazo` y mantiene compatibilidad visual con registros antiguos que tuvieran `scorm_rechazo_comentario`.
- Se ajusta la tabla de **MIS SCORMS** para que envuelva textos y botones dentro del ancho disponible, evitando el scroll lateral de la aplicación.
- Se actualiza versión visible de APP y `package.json` a `1.71.3`.

### Versionado
- Versión anterior: `1.71.2`
- Nueva versión consolidada: `1.71.3`

---

## v1.71.2 - Bandeja MIS SCORMS y rechazo con comentarios

### Cambios consolidados
- Se añade la bandeja **MIS SCORMS** con los SCORMs asociados al usuario por agente que están pendientes de validación, pendientes de publicación, actualizados pendientes de publicación o rechazados.
- Los usuarios validadores pueden rechazar SCORMs en validación y los usuarios ADMIN pueden rechazar SCORMs pendientes de publicación, obligando a registrar un comentario.
- Los SCORMs rechazados se muestran resaltados en rojo en **MIS SCORMS** e incluyen botón **COMENTARIOS** para abrir un modal con el comentario, usuario y fecha del rechazo.
- Desde **MIS SCORMS** el usuario puede reenviar sus SCORMs asociados a **Pendiente de validación** o **Pendiente de publicar**, limpiando los datos del rechazo al reactivar el flujo.
- Se añade migración para guardar comentario, usuario, fecha y estado anterior del rechazo en `scorms_master`.
- Se actualiza versión visible de APP y `package.json` a `1.71.2`.

### Versionado
- Versión anterior: `1.71.1`
- Nueva versión consolidada: `1.71.2`

---

## v1.71.1 - Notas editables sin valor inicial en actualizaciones

### Cambios consolidados
- En el panel de **Notas de la actualización** del modal **DETALLES** el `textarea` queda editable también cuando todavía no existe una fila previa en `scorms_actualizacion`.
- Al guardar un SCORM con notas escritas y sin registro previo de actualización, la aplicación crea automáticamente una nueva fila en `scorms_actualizacion` con `scorm_codigo`, `cambio_notas`, fecha actual y usuario por defecto si está disponible.
- Cuando ya existe una fila previa, el guardado sigue actualizando `cambio_notas` sobre el último registro mostrado, sin alterar el flujo existente.
- Se actualiza versión visible de APP y `package.json` a `1.71.1`.

### Versionado
- Versión anterior: `1.71.0`
- Nueva versión consolidada: `1.71.1`

---

## v1.71.0 - Edición de notas de actualización desde Detalles

### Cambios consolidados
- En el modal de **DETALLES** del SCORM, el campo **Notas de la actualización** pasa de solo lectura a editable sobre la última fila cargada desde `scorms_actualizacion`.
- El botón **Guardar cambios** del modal ahora persiste también la edición de `cambio_notas` en la tabla `scorms_actualizacion`, además de conservar el guardado habitual del registro en `scorms_master`.
- La carga de la última actualización incorpora el `id` del registro para poder actualizar exactamente la fila mostrada en el panel lateral.
- Se ajustan estilos del panel lateral para que la edición de notas use un `textarea` integrado con el diseño existente.
- Se actualiza versión visible de APP y `package.json` a `1.71.0`.

### Versionado
- Versión anterior: `1.70.9`
- Nueva versión consolidada: `1.71.0`

---

## v1.70.9 - Notas de actualización visibles en detalle de SCORM

### Cambios consolidados
- En el modal de **DETALLES** de SCORM se muestra ahora, a la derecha de la tabla principal, un panel destacado con el campo **Notas de la actualización**.
- El panel consulta la última fila registrada en `scorms_actualizacion` para el `scorm_codigo` abierto y muestra el contenido de `cambio_notas`.
- Además de la nota, se muestran como contexto el **tipo de cambio**, la **fecha** y el **usuario** de la última actualización registrada.
- Se añade estilo visual específico para que el bloque sea claramente visible y quede alineado a la derecha de la tabla principal del modal, adaptándose a una sola columna en pantallas más estrechas.
- Se actualiza versión visible de APP y `package.json` a `1.70.9`.

### Versionado
- Versión anterior: `1.70.8`
- Nueva versión consolidada: `1.70.9`

---

## v1.70.8 - Autorrelleno de usuario al actualizar SCORM

### Cambios consolidados
- En el modal **Actualizar SCORM**, el campo `Usuario` se rellena automáticamente con el nombre del usuario autenticado que lanza la actualización.
- El valor sigue siendo editable manualmente por si se necesita ajustar el dato antes de registrar la actualización.
- Se actualiza versión visible de APP y `package.json` a `1.70.8`.

### Versionado
- Versión anterior: `1.70.7`
- Nueva versión consolidada: `1.70.8`

---

## v1.70.7 - Edición de detalle SCORM permitida para no admin sin cambiar estado

### Cambios consolidados
- Se corrige el guardado del modal de **detalle SCORM** para usuarios no admin y no validador cuando el registro ya está en estados restringidos como `Publicado` o `Pendiente de publicar`.
- Hasta ahora, aunque el usuario solo modificara campos de detalle, el guardado se bloqueaba porque la validación interpretaba el estado existente como si fuera un cambio de estado.
- A partir de esta consolidación, los usuarios no admin pueden editar los demás detalles del SCORM **independientemente del estado actual del registro**, siempre que no intenten cambiarlo a un estado restringido.
- Se mantiene la restricción de permisos para las transiciones de estado a `Publicado` (solo `ADMIN`) y a `Pendiente de publicar` (solo `validador`).
- Se actualiza versión visible de APP y `package.json` a `1.70.7`.

### Versionado
- Versión anterior: `1.70.6`
- Nueva versión consolidada: `1.70.7`

---

## v1.70.6 - PA Nombre real en detalle de curso

### Cambios consolidados
- En **Cursos > General** se mantiene la columna `PA Nombre` en formato resumen (`✓/✕`) para el listado principal.
- Al abrir **Ver detalle** de un curso desde la vista general, el campo `PA Nombre` ahora toma el valor real de la fila en base de datos (`scorms_cursos.pa_nombre`) y deja de mostrar el resumen con check/X.
- El ajuste se limita solo al modal de detalle, tal y como se solicitó.
- Se actualiza versión visible de APP y `package.json` a `1.70.6`.

### Versionado
- Versión anterior: `1.70.5`
- Nueva versión consolidada: `1.70.6`

---

## v1.70.4 - Corrección de creación de traducciones con `pr_orden` vacío

### Cambios consolidados
- Se corrige la creación de traducciones en **Cursos > Traducciones** cuando el campo `pr_orden` llega vacío desde el borrador.
- Antes se enviaba `pr_orden: ""` al insertar, lo que provocaba el error de PostgreSQL: `invalid input syntax for type numeric: ""`.
- Ahora, en inserciones de cursos relacionados y traducciones, `pr_orden` se normaliza a `null` cuando está vacío para respetar el tipo `numeric` de la tabla `scorms_cursos`.
- Se actualiza versión visible de APP y `package.json` a `1.70.4`.

### Versionado
- Versión anterior: `1.70.3`
- Nueva versión consolidada: `1.70.4`

---

## v1.70.3 - Edición de PA y asociación de cursos desde la vista PA

### Cambios consolidados
- En la vista **PA** se añadió un botón **Editar** en el nivel 1 del acordeón de cada plan de aprendizaje.
- El botón **Editar** abre un modal de edición del PA con la misma estructura funcional que la creación:
  - edición de `PA Nombre`, `PA Código`, `PA URL` y `Acrónimo PA`.
- En el modal de edición se añadió la opción de **asociar cursos nuevos** al PA existente.
- Se incorporó buscador de cursos en el modal de edición por:
  - **código** de curso,
  - **nombre** del curso.
- Al guardar edición:
  - se actualizan los metadatos del PA en los cursos ya asociados,
  - se insertan nuevas filas para los cursos añadidos al PA (con prefijo por acrónimo en `curso_codigo`).

### Versionado
- Versión anterior: `1.70.2`
- Nueva versión consolidada: `1.70.3`

---

## v1.70.2 - Corrección de filtros check por tipología y listado solo PADRE en Cursos

### Cambios consolidados
- Se corrige la lógica del listado **Cursos > General** para que muestre únicamente cursos con `relacion_tipo = PADRE`, tal como se esperaba en la vista principal.
- Se ajusta la clasificación de checks de tipología para evitar recortes de resultados:
  - **CERTIFICACIÓN** solo incluye `tipologia = Certificación` (normalizado sin acentos).
  - **ESPUBLICO** solo incluye `tipologia = Espublico`.
  - **INTERNO** incluye `tipologia = Interno` (y compatibilidad con `USO INTERNO`).
  - El resto de valores se asignan a **GENERAL**.
- Se mantiene el comportamiento de checks como filtro directo sobre el campo `tipologia` de Supabase y la configuración por defecto: ESPUBLICO desmarcado, resto marcadas.
- Se actualiza versión visible de APP y `package.json` a `1.70.2`.

### Versionado
- Versión anterior: `1.70.1`
- Nueva versión consolidada: `1.70.2`

---

## v1.70.1 - Ajustes PA visuales, modal y filtros por selector en Cursos

### Cambios consolidados
- En la columna **PA Nombre** de la vista **Cursos > General** se elimina el texto `PA` y se muestra únicamente el indicador con formato `✓ (N)` o `✕ (N)`.
- El indicador de PA pasa a ser **clicable** con estilo de color:
  - verde para `✓`,
  - rojo para `✕`.
- Al pulsar el indicador se abre un **modal** con los planes de aprendizaje relacionados al curso (agrupados por `pa_codigo`/`pa_nombre`) mostrando código, nombre y URL.
- En el panel de filtros se priorizan y muestran los campos pedidos al inicio con formato de **selector**:
  - Estado curso,
  - Tipología,
  - Curso instructor,
  - Materia,
  - Categoría.
- Se ajusta la lógica de checks de tipología para filtrar por el valor real de Supabase (`tipologia`) mediante agrupación:
  - `INTERNO` cuando contiene `USO INTERNO` (o `INTERNO`),
  - `ESPUBLICO` cuando contiene `ESPUBLICO`,
  - `CERTIFICACIÓN` cuando contiene `CERTIFICACION`,
  - resto de valores en `GENERAL`.
- Se mantiene la configuración por defecto solicitada: **ESPUBLICO desmarcado** y el resto marcadas.
- Se actualiza versión visible de APP y `package.json` a `1.70.1`.

### Versionado
- Versión anterior: `1.70.0`
- Nueva versión consolidada: `1.70.1`

---

## v1.70.0 - Ajustes en vista Cursos: exclusiones de PA/traducciones y checks de tipología

### Cambios consolidados
- En la vista **Cursos > General** se excluyen los cursos que forman parte de un **Plan de aprendizaje** (`pa_formaparte` afirmativo), ya que se gestionan en su apartado específico.
- En la vista **Cursos > General** también se excluyen los cursos cuyo `relacion_tipo` corresponde a **Traducción**; se mantienen únicamente en la subvista **TRADUCCIONES**.
- La columna **PA Nombre** en la vista general deja de mostrar el nombre del plan y pasa a mostrar un resumen: `PA` con indicador visual (`✓` si tiene PA, `✕` si no) y el número de **PA distintos** asociados al padre por `IDUnico`.
- Se añade un bloque de **checks de tipología** debajo de los filtros en la vista general con estas opciones:
  - Tipología ESPUBLICO
  - Tipología CERTIFICACIÓN
  - Tipología INTERNO
  - Tipología GENERAL
- Configuración por defecto aplicada: **ESPUBLICO desmarcado** (no se muestra inicialmente) y el resto marcadas (sí se muestran).
- Se actualiza versión visible de APP y `package.json` a `1.70.0`.

### Versionado
- Versión anterior: `1.69.5`
- Nueva versión consolidada: `1.70.0`

---

## v1.69.5 - Campos obligatorios al crear SCORM

### Cambios consolidados
- En el alta de SCORM ahora son obligatorios los campos **Nombre**, **URL** y **Test**.
- Se refuerza la validación de creación para impedir el guardado si falta alguno de esos campos (además de Código).
- En el modal de creación se marca visualmente **(obligatorio)** en Nombre, URL y Test.
- Se actualiza versión visible de APP y `package.json` a `1.69.5`.

### Versionado
- Versión anterior: `1.69.4`
- Nueva versión consolidada: `1.69.5`

---

## v1.69.4 - Bandeja de publicación visible para usuarios no admin

### Cambios consolidados
- En SCORMs se habilita la visibilidad de la vista **Publicación pendiente** para usuarios autenticados con `admin: false`.
- Los usuarios no admin pueden consultar la bandeja de pendientes de publicar, aplicar presets y abrir detalles.
- Se bloquean en esa bandeja todas las acciones que cambian estado a **Publicado** para usuarios no admin (publicación individual, selección múltiple y checks de selección).
- Se muestra un aviso explícito en la vista para indicar que solo `ADMIN` puede publicar.
- Se actualiza versión visible de APP y `package.json` a `1.69.4`.

### Versionado
- Versión anterior: `1.69.3`
- Nueva versión consolidada: `1.69.4`

---

## v1.69.3 - Compatibilidad de clave backend sin romper login existente

### Cambios consolidados
- Se corrige el bloqueo de login por falta de `SUPABASE_SERVICE_ROLE_KEY` en entornos donde aún no estaba configurada.
- `lib/supabaseAdmin` mantiene prioridad de `SUPABASE_SERVICE_ROLE_KEY`, pero añade fallback backend a `SUPABASE_ANON_KEY` para preservar la lógica de login anterior mientras se migra la configuración.
- Se mantiene la nueva arquitectura segura (frontend sin acceso directo a Supabase), sin cambios en la lógica funcional de autenticación del usuario.
- Se actualizan `.env.example` y `README.md` para documentar claramente el modo recomendado y el fallback temporal de compatibilidad.
- Se actualiza versión visible de APP y `package.json` a `1.69.3`.

### Versionado
- Versión anterior: `1.69.2`
- Nueva versión consolidada: `1.69.3`

---

## v1.69.2 - Fix de login: manejo robusto de errores API y compatibilidad de URL Supabase

### Cambios consolidados
- Se corrige el fallo de login cuando `/api/auth/login` devolvía 500 sin cuerpo JSON parseable en frontend.
- `app/page.js` ahora maneja de forma segura respuestas no-JSON del login, evitando el error `Unexpected end of JSON input` en consola.
- `app/api/auth/login` se protege con `try/catch` y garantiza respuesta JSON también en errores internos, facilitando diagnóstico en UI.
- `lib/supabaseAdmin` admite `NEXT_PUBLIC_SUPABASE_URL` como fallback de URL (solo URL pública), manteniendo `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en backend.
- Se actualiza versión visible de APP y `package.json` a `1.69.2`.

### Versionado
- Versión anterior: `1.69.1`
- Nueva versión consolidada: `1.69.2`

---

## v1.69.1 - Corrección de build en deploy y rutas backend en JavaScript

### Cambios consolidados
- Se corrige el error de deploy en Vercel causado por el uso de ficheros TypeScript (`.ts`) sin dependencias TS instaladas en el proyecto.
- Se migran a JavaScript (`.js`) los nuevos módulos de seguridad/backend: `lib/supabaseAdmin`, `lib/session` y rutas API creadas en `app/api/*`.
- Se elimina tipado TypeScript residual en `app/api/db` para evitar errores de compilación en `next build`.
- Se ajusta `lib/supabaseAdmin` para inicializar el cliente de forma diferida (lazy) con `getSupabaseAdminClient()`, evitando que el build falle por variables de entorno no definidas durante la fase de compilación.
- Se actualizan importaciones servidoras para usar el nuevo helper lazy de Supabase Admin.
- Se actualiza versión visible de APP y `package.json` a `1.69.1`.

### Versionado
- Versión anterior: `1.69.0`
- Nueva versión consolidada: `1.69.1`

---

## v1.69.0 - Backend Supabase por API Routes y sesión firmada en servidor

### Cambios consolidados
- Se elimina el acceso directo a Supabase desde el frontend para operaciones de datos; ahora las consultas y mutaciones pasan por API Routes de Next.js.
- Se crea `lib/supabaseAdmin.ts` para inicializar Supabase únicamente en backend con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- Se incorpora validación básica de sesión mediante cookie HTTP-only firmada (`gscormer_session`) y utilidades en `lib/session.ts`.
- Se añade login/logout por backend (`/api/auth/login`, `/api/auth/logout`) manteniendo el flujo de autenticación de usuarios sin cambios funcionales en UI.
- Se añade API Route de ejemplo `/api/documentos` con método GET y validación de sesión previa.
- Se implementa un proxy backend `/api/db` para que el cliente use `fetch` y no exponga claves de Supabase.
- Se actualiza configuración y documentación de entorno para usar exclusivamente variables backend (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`).
- Se actualiza versión visible de APP y `package.json` a `1.69.0`.

### Versionado
- Versión anterior: `1.68.0`
- Nueva versión consolidada: `1.69.0`

---

## v1.68.0 - Subcategoría SCORM como selector BDD en alta y edición

### Cambios consolidados
- En la gestión de **SCORMs**, el campo **Subcategoría** se mantiene como selector en los formularios de **creación** y **edición de detalle**, mostrando valores existentes de BDD.
- Se ajusta el comportamiento del selector para `scorm_subcategoria` para que utilice únicamente opciones provenientes de datos existentes, sin alta manual desde el propio desplegable.
- Se actualiza versión visible de APP y `package.json` a `1.68.0`.

### Versionado
- Versión anterior: `1.67.0`
- Nueva versión consolidada: `1.68.0`

---

## v1.67.0 - Persistencia del panel de filtros sin resultados

### Cambios consolidados
- Se corrige un bug en la vista de **SCORMs** donde el panel global de filtros desaparecía cuando una combinación de filtros devolvía 0 resultados.
- El panel de filtros ahora permanece visible mientras la vista no esté cargando datos, permitiendo ajustar o limpiar filtros sin perder acceso al panel.
- Se actualiza versión visible de APP y `package.json` a `1.67.0`.

### Versionado
- Versión anterior: `1.66.0`
- Nueva versión consolidada: `1.67.0`

---

## v1.66.0 - Modal de confirmación previa para importación Excel SCORM

### Cambios consolidados
- Se modifica el flujo de importación de SCORMs desde Excel para que **no inserte directamente** al seleccionar el archivo.
- Tras cargar el fichero, la APP abre un **modal de previsualización** con el listado de SCORMs candidatos a importar.
- En el modal se muestran también contadores de filas omitidas por:
  - duplicados (`Idioma + Código`),
  - estados restringidos por permisos de usuario.
- La inserción en `scorms_master` se realiza **solo al pulsar “Confirmar importación”** dentro del modal.
- Se mantiene el mapeo de cabeceras y soporte de `.xlsx` implementado en consolidaciones previas.
- Se actualiza versión visible de APP y `package.json` a `1.66.0`.

### Versionado
- Versión anterior: `1.65.0`
- Nueva versión consolidada: `1.66.0`

---

## v1.65.0 - Importación real de archivos XLSX para SCORMs

### Cambios consolidados
- Se corrige la importación de SCORMs para soportar **ficheros Excel reales `.xlsx`** (no solo formatos XML/CSV exportados).
- Se implementa lectura nativa de `.xlsx` en cliente:
  - apertura del contenedor ZIP del XLSX,
  - resolución de la primera hoja del libro,
  - lectura de `sharedStrings` y celdas de hoja,
  - transformación de filas a cabeceras funcionales del negocio.
- Se mantiene el mapeo de cabeceras a columnas de `scorms_master` con prioridad de `Categoría Corregida` sobre `Categoría`, normalización de `test` y generación de código/idioma desde `Código Final` cuando aplica.
- Se actualiza el selector de carga para aceptar explícitamente `.xlsx` en la UI de importación.
- Se actualiza versión visible de APP y `package.json` a `1.65.0`.

### Versionado
- Versión anterior: `1.64.0`
- Nueva versión consolidada: `1.65.0`

---

## v1.64.0 - Importación masiva de SCORMs desde Excel (cabeceras negocio)

### Cambios consolidados
- Se incorpora la importación masiva de SCORMs desde fichero Excel compatible (XML Spreadsheet 2003) y ficheros delimitados exportados de Excel (`.csv`, `.tsv`, `.txt`).
- Se añade botón **Importar SCORMs (Excel)** en la vista de tabla de SCORMs para cargar el fichero y crear registros en `scorms_master` en bloque.
- Se implementa el mapeo automático de cabeceras de negocio a columnas de BDD:
  - `Código Final` / `Código SCORM` -> `scorm_code` (con soporte de extracción desde código final).
  - `Idioma` -> `scorm_idioma`.
  - `Nombre del SCORM` -> `scorm_name`.
  - `Tipo` -> `scorm_tipo`.
  - `Responsable` -> `scorm_responsable`.
  - `Categoría Corregida` (prioritaria) o `Categoría` -> `scorm_categoria`.
  - `Subcategoría` -> `scorm_subcategoria`.
  - `URL` -> `scorm_url`.
  - `Observaciones` -> `scorm_observaciones`.
  - `ESTADO` -> `scorm_estado`.
  - `test` -> `scorm_test` (normalizando valores tipo Sí/No).
- La importación evita duplicados por combinación `Idioma + Código`, valida filas mínimas y muestra resumen de importación (creados, duplicados omitidos y omitidos por permisos de estado).
- Se actualiza versión visible de APP y `package.json` a `1.64.0`.

### Versionado
- Versión anterior: `1.63.0`
- Nueva versión consolidada: `1.64.0`

---

## v1.63.0 - Alta de cursos con selectores BDD, ordenación y asociación SCORM en detalle

### Cambios consolidados
- En **Crear Curso**, los campos `tipologia`, `inscripcion`, `materia` e `instructor` pasan a funcionar con desplegables alimentados por valores existentes en BDD (tabla de cursos cargada).
- Solo usuarios **admin** pueden crear nuevos valores para esos cuatro campos desde el alta (toggle de modo lista/valor nuevo).
- En **Crear Curso**, `IDUnico`, `curso_url` y `link_inscripcion` se muestran en gris/no editables; se mantienen editables posteriormente en detalle.
- Se deja un único campo operativo de observaciones en el alta (`observaciones`), sincronizando su contenido también hacia `curso_observaciones` al guardar para mantener compatibilidad.
- `IDUnico` se sigue generando automáticamente con correlativo siguiente al mayor existente con formato `CUNNNN`.
- En **Editar detalle de curso** se añade bloque para asociar/desasociar SCORMs con buscador y checkboxes, persistiendo en `contenido` al guardar.
- En la **vista general de cursos** se añade ordenación por creación, edición o nombre, en ascendente/descendente; por defecto queda creación descendente (más recientes primero).
- Se actualiza versión visible de APP y `package.json` a `1.63.0`.

### Versionado
- Versión anterior: `1.62.0`
- Nueva versión consolidada: `1.63.0`

---

## v1.62.0 - Flujo de validación para SCORMs y cursos

### Cambios consolidados
- Se añade la nueva columna booleana `validador` en `scorms_users` mediante migración para habilitar permisos de validación.
- Se extiende la sesión de usuario para cargar y propagar el flag `validador` desde `scorms_users`.
- En SCORMs se incorpora la nueva vista **Validación pendiente** (acceso: `ADMIN` o `validador: true`) con validación individual y múltiple a estado **Pendiente de publicar**.
- Se añaden restricciones para que solo usuarios con `validador: true` puedan mover SCORMs al estado **Pendiente de publicar** (desde vista, edición o alta).
- En cursos se incorpora la nueva vista **Validación pendiente** (acceso: `ADMIN` o `validador: true`) con validación individual y múltiple a estado **Pendiente de publicar**.
- En cursos, los botones operativos previos pasan el estado a **Pendiente de validación** y la transición a **Pendiente de publicar** queda reservada a `validador: true`.
- Se actualizó la versión visible de la APP a **v1.62.0** y el versionado de `package.json` a `1.62.0`.

### Versionado
- Versión anterior: `1.61.0`
- Nueva versión consolidada: `1.62.0`

---

## v1.61.0 - Selectores SCORM dinámicos y alta de nuevos valores

### Cambios consolidados
- Los selectores de campos tipados de SCORM (Responsable, Tipo, Categoría, Subcategoría, Estado y Test) ahora muestran únicamente los valores existentes en la tabla `scorms_master` en ese momento.
- Se eliminó la inyección de valores fijos en los selectores para que las listas se construyan recorriendo únicamente los datos actuales de la tabla.
- La opción **+ Nuevo valor…** queda disponible en creación y detalle para permitir crear y seleccionar un valor nuevo al vuelo.
- Se actualizó la versión visible de la APP a **v1.61.0** y el versionado de `package.json` a `1.61.0`.

### Versionado
- Versión anterior: `1.60.0`
- Nueva versión consolidada: `1.61.0`

---

## v1.60.0 - Modales solo se cierran con acciones internas

### Cambios consolidados
- Se eliminó el cierre por clic en el fondo (overlay) en todos los modales de la APP para evitar cierres accidentales.
- A partir de esta consolidación, los modales solo se cierran mediante las acciones internas ya existentes (**Cerrar**, **Guardar**, etc.).
- Se actualizó la versión visible de la APP a **v1.60.0** y el versionado de `package.json` a `1.60.0`.

### Versionado
- Versión anterior: `1.59.0`
- Nueva versión consolidada: `1.60.0`

---

## v1.59.0 - Botón Eliminar curso visible en cabecera del modal

### Cambios consolidados
- Se movió la acción **Eliminar curso** a la **cabecera del modal de Detalle del curso**, junto al botón **Cerrar**, para que sea visible sin depender del scroll del formulario.
- Se mantiene la validación de permisos en la acción de borrado (solo `ADMIN` puede eliminar efectivamente).
- Se eliminó el botón duplicado de eliminación en el pie del modal para evitar confusión.
- Se añadieron estilos de `modal-header-actions` para ordenar correctamente las acciones en cabecera.
- Se actualizó la versión visible de la APP a **v1.59.0** y el versionado de `package.json` a `1.59.0`.

### Versionado
- Versión anterior: `1.58.0`
- Nueva versión consolidada: `1.59.0`

---

## v1.58.0 - Botón Eliminar curso visible en detalle de curso

### Cambios consolidados
- Se dejó el botón **Eliminar curso** siempre visible en el modal de **Detalle del curso**.
- Se mantiene la validación de permisos en la acción de borrado: si el usuario no es `ADMIN`, se muestra mensaje de restricción al intentar eliminar.
- Se mantiene el estilo rojo de acción destructiva en el botón de eliminación para cursos y SCORMs.
- Se actualizó la versión visible de la APP a **v1.58.0** y el versionado de `package.json` a `1.58.0`.

### Versionado
- Versión anterior: `1.57.0`
- Nueva versión consolidada: `1.58.0`

---

## v1.57.0 - Eliminación de cursos y acciones de borrado en rojo

### Cambios consolidados
- Se añadió el botón **Eliminar curso** en el modal de **Detalle del curso**.
- La eliminación de cursos se limita a usuarios con rol **ADMIN**, con confirmación previa y mensaje de resultado tras borrar en `scorms_cursos`.
- Se aplicó estilo visual en **rojo** para las acciones destructivas de borrado.
- El botón **Eliminar SCORM** también usa ahora estilo rojo para mantener consistencia visual.
- Se actualizó la versión visible de la APP a **v1.57.0** y el versionado de `package.json` a `1.57.0`.

### Versionado
- Versión anterior: `1.56.0`
- Nueva versión consolidada: `1.57.0`

---

## v1.56.0 - Traducciones por PADRE, creación múltiple y botón de relacionado en nivel 1

### Cambios consolidados
- Se movió el botón **Crear curso relacionado** al **nivel 1 del acordeón** (dentro del `summary`) para usarlo sin necesidad de expandir el grupo.
- En la subvista **Traducciones** se redefinieron los filtros/presets a:
  - **TODOS** (solo cursos con `relacion_tipo = PADRE`),
  - **Solo en español**,
  - **Cursos en todos los idiomas**,
  - **Solo en** (con selector de idioma).
- En la vista **TODOS** de Traducciones se añadió:
  - acción por fila **CREAR TRADUCCIÓN**,
  - selección múltiple y acción masiva **CREAR TRADUCCIÓN (N)**.
- Nueva funcionalidad de creación de traducciones:
  - modal individual: hereda `IDUnico` del padre, fija `relacion_tipo = Traducción`, hereda el resto de campos editables y destaca de forma obligatoria **Idioma** y **Nombre del curso**,
  - modal masivo: idioma común y edición de múltiples nombres (una fila por curso seleccionado).
- Se mantuvo la regla de altas desde cero: `IDUnico` correlativo (`CUNNNN`) y `relacion_tipo = PADRE`.
- Se actualizaron estilos para destacar campos obligatorios en los nuevos modales.
- Se actualizó la versión visible de la APP a **v1.56.0** y el versionado de `package.json` a `1.56.0`.

### Versionado
- Versión anterior: `1.55.0`
- Nueva versión consolidada: `1.56.0`

---

## v1.55.0 - Alta de cursos relacionados y autoasignación de IDUnico PADRE

### Cambios consolidados
- En la subvista **Cursos relacionados** se añadió el botón **Crear curso relacionado** en el **nivel 1 del acordeón** (por cada grupo de `IDUnico`).
- El botón abre un modal de alta que:
  - muestra y fija el `IDUnico` heredado del curso padre,
  - permite indicar/editar el **Tipo de relación**,
  - carga el resto de campos del curso con los valores heredados del padre y los deja editables.
- Al guardar desde ese modal se crea un nuevo curso en `scorms_cursos` conservando el mismo `IDUnico` del padre.
- Se añadió una regla global para la creación de cursos **desde 0** (botón Crear Curso):
  - se calcula automáticamente el próximo `IDUnico` disponible con formato `CUNNNN`,
  - se asigna automáticamente `relacion_tipo = PADRE`.
- Se añadieron estilos para mostrar la acción de creación relacionada dentro del acordeón.
- Se actualizó la versión visible de la APP a **v1.55.0** y el versionado de `package.json` a `1.55.0`.

### Versionado
- Versión anterior: `1.54.0`
- Nueva versión consolidada: `1.55.0`

---

## v1.54.0 - Reorganización de botones en CURSOS y selección visual homogénea

### Cambios consolidados
- En la cabecera de **CURSOS** se separó la botonera en **dos alturas**:
  - Fila superior con botones de **subvistas**: Vista general, Planes de aprendizaje, Cursos relacionados, Traducciones y Publicación pendiente.
  - Fila inferior con botones **específicos de acción**: Mis cursos, Crear Curso, Crear Plan de aprendizaje (en subvista de planes), Refrescar y Exportar Excel (en vista general).
- Se eliminó el botón **← Volver a SCORMs** de la sección CURSOS.
- Se homogeneizaron tamaño mínimo y disposición de botones de cabecera en CURSOS para una alineación visual consistente.
- Se homogeneizó el efecto de selección de vista/subvista en CURSOS usando estilo azul (colores de Cursos) para botones activos.
- Se actualizó la versión visible de la APP a **v1.54.0** y el versionado de `package.json` a `1.54.0`.

### Versionado
- Versión anterior: `1.53.0`
- Nueva versión consolidada: `1.54.0`

---

## v1.53.0 - Simplificación de subvistas de cursos y ajustes de traducciones

### Cambios consolidados
- Se eliminó la subvista **Cursos individuales** de la sección CURSOS para simplificar la navegación de subvistas.
- Se renombró la subvista **Relaciones cursos** a **Cursos relacionados** (botón y título de vista).
- En la subvista **Traducciones**, se cambió la presentación para que **cada curso** aparezca como una fila independiente con las columnas: `IDUnico`, `Curso nombre` e `Idioma`.
- Se mantuvieron los presets de filtrado de traducciones existentes (**TODOS**, **Todos los idiomas**, **Solo en un idioma**, **Pendiente de idioma**) aplicados al nuevo formato por fila.
- Se actualizó la versión visible de la APP a **v1.53.0** y el versionado de `package.json` a `1.53.0`.

### Versionado
- Versión anterior: `1.52.0`
- Nueva versión consolidada: `1.53.0`

---

## v1.52.0 - Multiidioma en cursos + subvista de traducciones

### Cambios consolidados
- Se añadió la nueva columna `curso_idioma` en `scorms_cursos` mediante migración SQL para poder asignar idioma a cada curso.
- En la gestión de cursos se incorporó el campo **Idioma curso** dentro de columnas editables y en la creación de cursos con valor por defecto `ES`.
- Se creó la nueva subvista **Traducciones** en Cursos, agrupando cursos por `IDUnico` y usando `relacion_tipo = Traducción` para identificar variantes idiomáticas.
- La subvista incluye presets visuales equivalentes a SCORMs: **TODOS**, **Todos los idiomas**, **Solo en un idioma** y **Pendiente de idioma** con selector de idioma.
- Se renombró el botón superior de navegación de **SCORMs Cursos** a **CURSOS**.
- Se actualizó la versión visible de la APP a **v1.52.0** y el versionado de `package.json` a `1.52.0`.

### Versionado
- Versión anterior: `1.51.0`
- Nueva versión consolidada: `1.52.0`

---

## v1.51.0 - Subvista de relaciones de cursos por IDUnico

### Cambios consolidados
- Se añadió una nueva subvista **Relaciones cursos** dentro de la sección de Cursos para visualizar agrupaciones por `IDUnico` en formato acordeón.
- En el **nivel 1** del acordeón se muestra el curso principal (priorizando `relacion_tipo = Padre`) con los datos: `IDUnico`, `curso_nombre`, `curso_instructor` y el total de cursos relacionados entre paréntesis.
- En el **nivel 2** se listan todos los cursos que comparten `IDUnico`, incluyendo el campo `relacion_tipo` junto a nombre e instructor.
- Se mantiene activo e integrado el **panel de filtros global** para esta nueva subvista, reutilizando la lógica de filtrado existente sobre `scorms_cursos`.
- Se actualizó la versión visible de la APP a **v1.51.0** y el versionado de `package.json` a `1.51.0`.

### Versionado
- Versión anterior: `1.50.0`
- Nueva versión consolidada: `1.51.0`

---

## v1.50.0 - Eliminación admin, publicación masiva y selectores administrables

### Cambios consolidados
- Se habilitó la **eliminación de SCORMs** para usuarios con perfil **Admin** desde la ventana de detalle, con confirmación previa.
- En la vista **Pendientes de publicar** se añadió selección múltiple por checkbox y acción de **publicación masiva** para publicar varios SCORMs de una sola vez.
- En creación y edición de SCORM se transformaron en **selectores desplegables** los campos:
  - Responsable
  - Tipo
  - Categoría
  - Subcategoría
  - Estado
  - Test
- Los selectores cargan sus valores desde los datos existentes en la tabla (`scorms_master`).
- Para usuarios **Admin** se añadió en esos selectores la opción **"+ Nuevo valor…"**, que permite crear un nuevo valor al vuelo y seleccionarlo inmediatamente.

### Versionado
- Versión anterior: `1.49.3`
- Nueva versión consolidada: `1.50.0`

---

# Log de cambios

## v1.49.3 - Autoasignación de `scorm_test` al guardar preguntas test

### Cambios consolidados
- Se ajustó el guardado del modal de **Preguntas tipo test** para que, cuando el texto guardado no esté vacío, se actualice automáticamente `scorm_test` con el valor **Sí**.
- Se mantiene la posibilidad de editar observaciones y preguntas de forma independiente, añadiendo únicamente esta regla de consistencia al guardar preguntas.
- Se actualizó la versión visible de la APP a **v1.49.3** y el versionado de `package.json` a `1.49.3`.

### Versionado
- Versión anterior: `1.49.2`
- Nueva versión consolidada: `1.49.3`

---


## v1.49.2 - Independencia entre Observaciones y Preguntas tipo test

### Cambios consolidados
- Se ajustó la columna **Test** en la vista principal de SCORMs para que el acceso **📄 Test** esté siempre disponible, independientemente del valor actual de `scorm_test`.
- Se mantiene el indicador visual del estado de `scorm_test` (incluyendo marca de error cuando no es positivo), pero sin bloquear la edición del texto de preguntas tipo test.
- Con este ajuste, la edición de **Preguntas tipo test** y la edición de **Observaciones** quedan desacopladas funcionalmente en la UI, tratándose como campos independientes.
- Se actualizó la versión visible de la APP a **v1.49.2** y el versionado de `package.json` a `1.49.2`.

### Versionado
- Versión anterior: `1.49.1`
- Nueva versión consolidada: `1.49.2`

---


## v1.49.1 - Ajuste de texto en acceso de preguntas test

### Cambios consolidados
- En la nueva funcionalidad de preguntas tipo test se cambió el texto del acceso visual de **📄 .txt** a **📄 Test** tanto en la columna **Test** de la vista principal como en el modal de **Detalles** del SCORM.
- Se mantiene intacta la lógica de apertura/guardado del modal y la persistencia en `scorm_preguntastest`.
- Se actualizó la versión visible de la APP a **v1.49.1** y el versionado de `package.json` a `1.49.1`.

### Versionado
- Versión anterior: `1.49.0`
- Nueva versión consolidada: `1.49.1`

---



## v1.49.0 - Modal de preguntas test (.txt) y acceso directo desde columna Test

### Cambios consolidados
- Se añadió soporte para la nueva columna `scorm_preguntastest` en `scorms_master` mediante migración SQL, preparada con `IF NOT EXISTS`.
- En la vista principal de **SCORMs** (modo tabla), cuando el campo **Test** vale **Sí**, el icono de check verde se sustituye por un botón tipo **📄 .txt** que abre el modal de preguntas test.
- Se incorporó un nuevo modal específico de texto para **Preguntas tipo test**, con `textarea` y botón **Guardar**, persistiendo el contenido en `scorm_preguntastest`.
- Se añadió acceso al mismo modal desde **Detalles del SCORM** mediante botón/icono **📄 .txt**.
- El contenido de preguntas test se guarda tal cual en un campo de texto (`text`), manteniendo los saltos de línea introducidos en el `textarea`.
- Se incorporaron estilos para el nuevo botón/icono `.txt` en la columna de Test.
- Se actualizó la versión visible de la APP a **v1.49.0** y el versionado de `package.json` a `1.49.0`.

### Versionado
- Versión anterior: `1.48.0`
- Nueva versión consolidada: `1.49.0`

---



## v1.48.0 - Ajustes modal detalle: observaciones grandes, scroll bloqueado y cierre controlado

### Cambios consolidados
- Se amplió el campo de observaciones en los modales de detalle de **SCORM** y **Curso** usando área de texto con altura mayor para facilitar edición de textos largos.
- Se reposicionó el campo de observaciones al final del detalle en ambos modales (`scorm_observaciones` y `curso_observaciones`).
- Se eliminó el cierre por clic fuera en los modales de detalle de SCORM y Curso (solo se cierran con botón **Cerrar** o acciones explícitas).
- Se añadió bloqueo de scroll del `body` mientras el modal de detalle está abierto, evitando que se desplace la pantalla de fondo.
- Se actualizó la versión visible de la APP a **v1.48.0** y el versionado de `package.json` a `1.48.0`.

### Versionado
- Versión anterior: `1.47.0`
- Nueva versión consolidada: `1.48.0`

---


## v1.47.0 - Observaciones en SCORM/Curso + detalle de cursos en modal + doble clic

### Cambios consolidados
- Se añadió la nueva columna `scorm_observaciones` en `scorms_master` y la nueva columna `curso_observaciones` en `scorms_cursos` mediante migración SQL.
- En **SCORMs** se incorporó el campo **Observaciones** (`scorm_observaciones`) al flujo editable del modal de detalles, incluyendo persistencia al guardar.
- En **Cursos** se incorporó el campo **Curso observaciones** (`curso_observaciones`) en el modal de detalle editable y en los payloads de creación/edición.
- En la vista general de **Cursos** se sustituyó el desplegable de detalle expandible por apertura de **modal de detalle editable**.
- Se habilitó apertura de detalle por **doble clic** en filas de SCORMs (vista tabla) y de Cursos (vistas general, individuales, planes y publicación).
- Se actualizó la versión visible de la APP a **v1.47.0** y el versionado de `package.json` a `1.47.0`.

### Versionado
- Versión anterior: `1.46.0`
- Nueva versión consolidada: `1.47.0`

---

## v1.46.0 - Exportación Excel en vistas generales de SCORMs y Cursos

### Cambios consolidados
- Se añadió el botón **Exportar Excel** en la vista general de **SCORMs** (modo tabla), exportando los registros filtrados actuales.
- Se añadió el botón **Exportar Excel** en la vista general de **Cursos**, exportando los registros filtrados actuales.
- La exportación incluye todas las columnas disponibles en los datos de cada tabla correspondiente (`scorms_master` y `scorms_cursos`), priorizando el orden funcional de columnas visibles y añadiendo el resto de campos detectados.
- Se incorporó una utilidad común de exportación para generar archivos Excel (`.xls`) desde cliente, reutilizada por ambas vistas.
- Se actualizó la versión visible de la APP a **v1.46.0** y el versionado de `package.json` a `1.46.0`.

### Versionado
- Versión anterior: `1.45.0`
- Nueva versión consolidada: `1.46.0`

---


## v1.45.0 - Corrección de enlaces externos en URLs sin protocolo

### Cambios consolidados
- Se normalizaron las URLs externas para que, si se informan sin protocolo (por ejemplo `www.google.com`), se abran fuera de la APP añadiendo `https://` automáticamente.
- El ajuste se aplica a enlaces de `scorm_url` en tabla/tarjetas/publicación y también en `URL novedad` de alertas.
- Se mantiene visible el valor original de la URL en pantalla, corrigiendo únicamente el destino del enlace para evitar rutas relativas dentro de `g-scormer.vercel.app`.
- Se actualizó la versión visible de la APP a **v1.45.0** y el versionado de `package.json` a `1.45.0`.

### Versionado
- Versión anterior: `1.44.0`
- Nueva versión consolidada: `1.45.0`

---


## v1.44.0 - Alertas: URL externa directa, clasificación visible y simplificación de acciones

### Cambios consolidados
- En la vista **Alertas actualizaciones** se eliminó la botonera **Deshacer alerta / Rehacer alerta**.
- En el nivel 1 del acordeón de alertas se añadió el campo **Clasificación** del SCORM, mostrado con el mismo chip de categoría.
- En la tabla de detalle de alertas (nivel 2), la columna **URL novedad** ahora abre y muestra íntegramente la URL almacenada en BDD, manteniendo navegación externa en nueva pestaña.
- Se actualizó la versión visible de la APP a **v1.44.0** y el versionado de `package.json` a `1.44.0`.

### Versionado
- Versión anterior: `1.43.0`
- Nueva versión consolidada: `1.44.0`

---



## v1.43.0 - Alertas desacopladas de master + URL de novedad + deshacer/rehacer visible

### Cambios consolidados
- Se ajustó **DESCARTAR ALERTA** para que elimine únicamente los registros de `scorms_alertas` por `scorm_codigo`, sin modificar `scorms_master`.
- Se ajustó **ACTUALIZAR SCORM** cuando se lanza desde alertas para que descarte la alerta en `scorms_alertas` sin limpiar `scorms_alerta` en la tabla master.
- Se habilitaron en la vista **Alertas actualizaciones** los botones **Deshacer alerta** y **Rehacer alerta**, reutilizando el historial funcional ya existente para acciones de alertas.
- Se añadió la nueva columna `url_novedad` en `scorms_alertas` mediante migración.
- En el modal **Generar alertas** se añadió el nuevo campo opcional **URL novedad** para persistir el enlace asociado a la alerta.
- En el nivel 2 del acordeón de alertas se añadió la columna **URL novedad**, mostrando el texto **LINK** (con apertura en nueva pestaña) cuando la URL existe.
- Se actualizó la versión visible de la APP a **v1.43.0** y el versionado de `package.json` a `1.43.0`.

### Versionado
- Versión anterior: `1.42.0`
- Nueva versión consolidada: `1.43.0`

---


## v1.42.0 - KPI de alertas por SCORM individual + acciones en acordeón nivel 1

### Cambios consolidados
- Se ajustó el KPI del botón **Alertas actualizaciones** para que contabilice el número de SCORMs individuales (`scorms_master`) que tienen alerta asociada en `scorms_alertas`, en lugar de contar solo filas con fecha local de alerta.
- En la vista de alertas por acordeón (nivel 1) se reincorporaron los botones **DESCARTAR ALERTA** y **ACTUALIZAR SCORM** sobre cada bloque de SCORM.
- **Descartar alerta** ahora elimina los registros asociados al `scorm_codigo` en `scorms_alertas` y limpia `scorms_alerta` en `scorms_master` para mantener consistencia visual y de datos.
- **Actualizar SCORM** reutiliza el mismo flujo de actualización de la vista master y, cuando se lanza desde alertas, elimina también la alerta asociada en `scorms_alertas`.
- Se ajustó la maquetación del resumen del acordeón de alertas para acercar visualmente el código de SCORM y su título.
- Se actualizó la versión visible de la APP a **v1.42.0** y el versionado de `package.json` a `1.42.0`.

### Versionado
- Versión anterior: `1.41.0`
- Nueva versión consolidada: `1.42.0`

---

## v1.41.0 - Nuevo modelo de alertas con historial por SCORM

### Cambios consolidados
- Se adaptó la vista **Alertas actualizaciones** para que esté disponible para todos los perfiles, independientemente del valor de `alertador`.
- Se restringió el botón **Generar alertas** exclusivamente a usuarios con `alertador = true`.
- Se reemplazó el origen de datos de alertas por la nueva tabla `scorms_alertas`, agrupando en acordeón por `scorm_codigo` y mostrando código, nombre, fecha de última alerta y número total de alertas.
- Dentro de cada SCORM se listan las alertas con **Fecha alerta** y **Novedad**, incluyendo el botón **Ver etiquetas** para desplegar una tabla de etiquetas asociadas (código, nombre y clasificación).
- El modal **Generar alertas** ahora permite informar `novedad` y guarda las alertas en `scorms_alertas`, persistiendo las etiquetas pegadas en formato coma-separado en `alerta_etiquetas`.
- Al confirmar la generación se cierra el modal y se refresca automáticamente la vista tras 2 segundos.
- Se añadió migración para creación de la nueva tabla `public.scorms_alertas`.
- Se actualizó la versión visible de la APP a **v1.41.0** y el versionado de `package.json` a `1.41.0`.

### Versionado
- Versión anterior: `1.40.0`
- Nueva versión consolidada: `1.41.0`

---


## v1.40.0 - Generación y gestión de alertas con permisos + deshacer/rehacer

### Cambios consolidados
- Se añadió el permiso funcional **alertador** en sesión de usuario (login, sesión persistida y reenganche), para habilitar exclusivamente a esos usuarios la vista de alertas y la generación de alertas por etiquetas.
- En la vista **Alertas actualizaciones** se incorporó el botón **Generar alertas**, que abre un modal para pegar códigos de etiqueta y confirmar la operación.
- Al confirmar, la app consulta `scorms_etiquetas`, obtiene la `clasificacion_scorm` asociada y marca con fecha actual (`scorms_alerta`) todos los SCORM de `scorms_master` cuya clasificación coincide.
- En la tabla de alertas se añadieron dos acciones nuevas además de **Detalles**:
  - **Descartar alerta**: pide confirmación y elimina la fecha de `scorms_alerta`.
  - **Actualizar SCORM**: reutiliza el flujo de actualización; al actualizar cambia estado y limpia también `scorms_alerta` para que desaparezca de la vista.
- Se añadieron controles **Deshacer alerta** y **Rehacer alerta** para el funcional de alertas, incluyendo generación, descarte y actualización desde alertas.
- Se actualizó la versión visible de la APP a **v1.40.0** y el versionado de `package.json` a `1.40.0`.

### Versionado
- Versión anterior: `1.39.1`
- Nueva versión consolidada: `1.40.0`

---


## v1.39.1 - Corrección de visualización en vista Alertas

### Cambios consolidados
- Se corrigió la lógica de la subvista **Alertas actualizaciones** para que también contemple datos provenientes de la columna `scorm_alerta` (además de `scorms_alerta`), evitando que SCORMs con alerta informada queden fuera del listado.
- Se actualizó el cálculo y ordenación de fechas en alertas para usar la nueva lectura compatible de ambas columnas.
- Se ajustó el render de la fecha en la tabla de alertas para mostrar correctamente el valor detectado en cualquiera de los dos nombres de campo.
- Se actualizó la versión visible de la APP a **v1.39.1** y el versionado de `package.json` a `1.39.1`.

### Versionado
- Versión anterior: `1.39.0`
- Nueva versión consolidada: `1.39.1`

---

## v1.39.0 - Alertas de actualizaciones y nuevas estructuras de BDD

### Cambios consolidados
- Se añadió una nueva migración SQL que crea la tabla `public.scorms_etiquetas` para soportar la relación N:N de etiquetas por clasificación de SCORM, con campos de código y nombre de etiqueta.
- En la misma migración se incorporó la nueva columna `scorms_alerta` (`timestamptz`) en `public.scorms_master`.
- Se creó la vista `public.alertas_actualizaciones`, que expone los registros de `scorms_master` con `scorms_alerta` informado y añade el alias `alerta_actualizacion_fecha`.
- En la vista de **SCORMs** se añadió la subvista **Alertas actualizaciones**, que muestra únicamente SCORMs con `scorms_alerta` no nulo, junto con su fecha de alerta y acceso a detalle.
- Se actualizó la versión visible de la APP a **v1.39.0** y el versionado de `package.json` a `1.39.0`.

### Versionado
- Versión anterior: `1.38.0`
- Nueva versión consolidada: `1.39.0`

---


## v1.38.0 - Permisos ADMIN reforzados para publicar y ver pendientes

### Cambios consolidados
- Se amplió la normalización del flag `admin` de `scorms_users` durante login, restauración de sesión y reenganche para reconocer valores booleanos y serializaciones comunes (`true`, `t`, `1`, `yes`, `si`, `sí`).
- Con esta normalización, cuando el campo `admin` viene en `TRUE` (o formatos equivalentes), el usuario obtiene correctamente permisos de ADMIN para:
  - Poner SCORM en estado **Publicado**.
  - Acceder a la vista **Publicación pendiente**.
- Se actualizó la versión visible de la APP a **v1.38.0** y el versionado de `package.json` a `1.38.0`.

### Versionado
- Versión anterior: `1.37.0`
- Nueva versión consolidada: `1.38.0`

---


## v1.37.0 - Restricción de publicación a ADMIN + nuevo campo alertador

### Cambios consolidados
- En **SCORMs** la vista **Publicación pendiente** ahora solo aparece para usuarios con rol `ADMIN` (`scorms_users.admin = true`).
- Se reforzó la seguridad funcional para que únicamente usuarios ADMIN puedan establecer el estado `Publicado`, incluyendo publicación directa, cambios masivos/drag&drop, guardado de detalles y alta de nuevos SCORMs.
- En el inicio de sesión y recarga de sesión de usuario se persistió el flag `admin` dentro de la sesión cliente para aplicar las restricciones por rol en interfaz y acciones.
- Se añadió una nueva migración SQL para incorporar el campo booleano `alertador` en `public.scorms_users`.
- Se actualizó también la migración base de creación de `scorms_users` para incluir `alertador` en despliegues desde cero.
- Se actualizó la versión visible de la APP a **v1.37.0** y el versionado de `package.json` a `1.37.0`.

### Versionado
- Versión anterior: `1.36.0`
- Nueva versión consolidada: `1.37.0`

---


## v1.36.0 - Creación de Plan de aprendizaje desde cursos existentes

### Cambios consolidados
- En la vista **Planes de aprendizaje** se añadió el botón **Crear Plan de aprendizaje** para abrir un modal específico de alta de PA.
- El nuevo modal permite informar datos del PA (`pa_nombre`, `pa_codigo`, `pa_url`) y solicita el **Acrónimo PA** para construir el nuevo `curso_codigo` de cada curso añadido.
- Se incorporó selector de cursos existentes (con buscador) para elegir qué cursos se añaden al plan; la lista muestra únicamente cursos que no forman parte de otro PA.
- Al confirmar, se crean nuevas filas en `scorms_cursos` copiando los valores del curso origen, manteniendo `codigo_individual`, añadiendo datos del PA y actualizando `curso_codigo` con formato `ACRONIMO-codigo_original`.
- Se actualizó la versión visible de la APP a **v1.36.0** y el versionado de `package.json` a `1.36.0`.

### Versionado
- Versión anterior: `1.35.0`
- Nueva versión consolidada: `1.36.0`

---


## v1.35.0 - Edición completa de cursos, filtros priorizados y depuración de planes

### Cambios consolidados
- En la vista de **Detalle del curso** (SCORMs Cursos) ahora todos los campos del curso son editables desde inputs de texto y se añadió el botón **Guardar cambios** para persistir la edición completa en `scorms_cursos`.
- Se incorporó control de guardado del modal de detalle (`Guardando...`), actualización en memoria de la fila editada y mensaje de estado al guardar correctamente.
- En el panel de filtros de cursos se reordenaron y priorizaron arriba los filtros: **Curso código**, **Curso nombre** y el nuevo filtro **SCORMS**.
- El filtro **SCORMS** busca sobre los SCORMs asociados a cada curso a partir de referencias en `contenido`, incluyendo datos de SCORM master (código, nombre, responsable, categoría e idioma).
- En la vista **Planes de aprendizaje** se ocultan los planes cuyo nombre contiene `00` o `CURSOS SIN PLAN DE APRENDIZAJE`.
- Se actualizó la versión visible de la APP a **v1.35.0** y el versionado de `package.json` a `1.35.0`.

### Versionado
- Versión anterior: `1.34.0`
- Nueva versión consolidada: `1.35.0`

---


## v1.34.0 - Subvista de Planes de aprendizaje y contador en cursos individuales

### Cambios consolidados
- Se añadió una nueva subvista **Planes de aprendizaje** dentro de **SCORMs Cursos** con botón dedicado en la cabecera.
- La subvista agrupa en formato acordeón los cursos que forman parte de un PA (`pa_formaparte`), mostrando por plan: **código**, **nombre** y la etiqueta **LINK** con hipervínculo a `pa_url` cuando existe.
- En cada resumen de plan se muestra entre paréntesis el número de cursos asociados a ese plan.
- Al desplegar un plan, se listan sus cursos asociados en tabla interna con columnas de código, nombre, tipología, estado y acceso a detalles.
- En la subvista **Cursos individuales**, el nombre del curso ahora muestra entre paréntesis cuántos cursos cuelgan de ese curso individual.
- Se actualizó la versión visible de la APP a **v1.34.0** y el versionado de `package.json` a `1.34.0`.

### Versionado
- Versión anterior: `1.33.2`
- Nueva versión consolidada: `1.34.0`

---


## v1.33.2 - Corrección DESHACER en publicación de SCORMs

### Cambios consolidados
- Se corrigió el flujo de publicación de SCORM en `ScormsTable` para que al pulsar **PUBLICAR SCORM** se registre correctamente el movimiento en `moveHistory` con su estado anterior.
- Ahora el botón **DESHACER** en la vista de SCORMs puede revertir publicaciones realizadas desde la vista **Pendientes de publicar**, restaurando el estado previo real del SCORM.
- Se limpia `redoHistory` al publicar un SCORM para mantener consistencia del historial.
- Se añadió control para evitar registrar/publicar de nuevo cuando el SCORM ya está en estado `Publicado`.
- Se actualizó la versión visible de la APP a **v1.33.2** y el versionado de `package.json` a `1.33.2`.

### Versionado
- Versión anterior: `1.33.1`
- Nueva versión consolidada: `1.33.2`

---


## v1.33.1 - Botón para pasar cursos En proceso a pendiente + estado en detalles

### Cambios consolidados
- Se añadió la acción **Pasar a pendiente de publicar** para cursos en estado `En proceso` en la vista general de **SCORMs Cursos**.
- Se añadió la misma acción en la subvista **Cursos individuales** para permitir el cambio de estado también desde ese contexto.
- Se reutilizó la lógica de cambio de estado para registrar historial (`moveHistory` / `redoHistory`) al pasar a `Pendiente de publicar` y mantener coherencia con deshacer/rehacer.
- Se incorporó `curso_estado` en el bloque de **detalles** (expandido) de cursos para mostrar explícitamente el estado dentro del detalle.
- En la tabla interna de **Cursos individuales** se añadió columna visible de estado para mejorar trazabilidad del flujo de publicación.
- Se actualizó la versión visible de la APP a **v1.33.1** y el versionado de `package.json` a `1.33.1`.

### Versionado
- Versión anterior: `1.33.0`
- Nueva versión consolidada: `1.33.1`

---


## v1.33.0 - Publicación pendiente para cursos + deshacer/rehacer reforzado

### Cambios consolidados
- Se añadió la columna `curso_estado` al modelo de `scorms_cursos` (migración incremental), incluyendo relleno inicial a `En proceso` para registros existentes sin valor.
- Se actualizó la migración base de creación de `scorms_cursos` para incluir `curso_estado` en nuevos despliegues.
- En la vista **SCORMs Cursos** se añadió la nueva subvista **Publicación pendiente**, con KPI en botón, resaltado por color y tabla centrada en cursos con estado `Pendiente de publicar`.
- En la tabla de pendientes de cursos se añadió acción **PUBLICAR** para cambiar `curso_estado` a `Publicado`.
- Se incorporaron acciones **← DESHACER** y **REHACER →** en la publicación pendiente de cursos para revertir/reaplicar cambios de estado publicados en sesión.
- Se añadió `curso_estado` a columnas visibles/filtrables de **SCORMs Cursos** y se establece por defecto a `En proceso` al crear un curso nuevo.
- En **SCORMs Master**, los botones de deshacer/rehacer ahora se muestran con flechas (`← DESHACER` / `REHACER →`) y se añadió el bloque de deshacer/rehacer en la vista **Pendientes de publicar**.
- Se actualizó la versión visible de la APP a **v1.33.0** y el versionado de `package.json` a `1.33.0`.

### Versionado
- Versión anterior: `1.32.0`
- Nueva versión consolidada: `1.33.0`

---

## v1.32.0 - Nueva columna scorm_test en filtros y tabla principal

### Cambios consolidados
- Se añadió la columna `scorm_test` en la configuración de columnas de la vista **SCORMs Master**, posicionada a la derecha de **Estado** en la tabla por defecto.
- La columna `scorm_test` ahora aparece también en el panel de filtros globales y en los filtros tipo selector, para poder filtrar directamente por sus valores.
- Se adaptó la visualización de `scorm_test` en la tabla: cuando el valor es **Sí/Si** se muestra con **check verde** (`✅`), y para cualquier otro valor se muestra el texto con **aspa roja** (`❌`).
- Se mantuvo el filtrado contextual por clic en celda para `scorm_test`, de forma que al pulsar el valor en la tabla se añade/quita el filtro correspondiente.
- Se incrementó ligeramente el ancho mínimo global de tablas para dar cabida a la nueva columna sin comprometer la legibilidad.
- Se actualizaron las versiones de la APP en `lib/appVersion.js` y `package.json` a **1.32.0**.

### Versionado
- Versión anterior: `1.31.0`
- Nueva versión consolidada: `1.32.0`

---

## v1.31.0 - Añadir traducción masiva en vista Traducciones

### Cambios consolidados
- En la vista **Traducciones** se añadió selección múltiple por checkbox para SCORMs con base en **ES**, incluyendo selección global de los visibles.
- Se incorporó la acción **Añadir traducción**, que abre un modal para crear traducciones de uno o varios SCORMs seleccionados.
- El modal permite elegir idioma destino y capturar el nombre traducido de cada curso antes de crear los registros.
- La creación de traducciones genera nuevos SCORMs en `scorms_master` con el mismo `scorm_code` del original y `scorm_idioma` del idioma destino (prefijo internacionalizado en formato `IDIOMA-CODIGO`).
- Se añadió control de duplicados para evitar crear una traducción si ya existe el mismo `scorm_code` en el idioma destino.
- Se ampliaron los idiomas por defecto de la tabla de traducciones para incluir **GAL (Gallego)** e **IT (Italiano)**, además de etiquetas de idioma en los selectores.
- Se añadieron estilos de apoyo para las nuevas acciones de traducción en cabecera.
- Se actualizó la versión visible de la APP a **v1.31.0** y el versionado de `package.json` a `1.31.0`.

### Versionado
- Versión anterior: `1.30.0`
- Nueva versión consolidada: `1.31.0`

---

## v1.30.0 - Asociación múltiple de usuario a responsables/instructores

### Cambios consolidados
- Se añadió en cabecera el botón **Asociar mi usuario a agente**, que abre un modal editable en cualquier momento para gestionar la asociación del usuario conectado.
- El nuevo modal incluye una tabla de dos columnas con checkboxes: **Responsables de SCORM** (desde `scorms_master.scorm_responsable`) e **Instructores de cursos** (desde `scorms_cursos.curso_instructor`).
- Se implementó guardado de asociaciones en la fila del usuario (`scorms_users.agent`) usando un formato JSON con dos listas (`responsables` e `instructores`), manteniendo compatibilidad con el formato legacy en texto plano.
- Se actualizó la sesión/localStorage para persistir y reutilizar las asociaciones activas del usuario.
- Se adaptó el filtro **Mis scorms** para aplicar cualquier valor asociado en la lista de responsables del usuario.
- Se adaptó el filtro **Mis cursos** para aplicar cualquier valor asociado en la lista de instructores del usuario.
- Se añadieron estilos para el modal de asociación y listas con scroll para facilitar edición de múltiples valores.
- Se actualizó la versión visible de la APP a **v1.30.0** y el versionado de `package.json` a `1.30.0`.

### Versionado
- Versión anterior: `1.29.0`
- Nueva versión consolidada: `1.30.0`

---

## v1.29.0 - Reenganche de agente y filtros aproximados en Mis scorms/Mis cursos

### Cambios consolidados
- Se añadió el botón **Identificar agente** en el modal de usuario para enganchar/reenganchar en caliente el agente asociado al usuario conectado, refrescando sesión y `localStorage` sin cerrar sesión.
- En **Mis scorms**, el matching de responsable/agente ahora intenta primero coincidencia exacta normalizada y, si no existe, aplica coincidencia aproximada por `contiene` para soportar casos como `Miguel Ángel` vs `Miguel Ángel Larraga`.
- En la vista **SCORMs Cursos**, se añadió el botón **Mis cursos** con el mismo criterio de matching aproximado sobre `curso_instructor` (exacto y fallback por contiene).
- Se centralizó la versión en `lib/appVersion.js`, se actualizó la versión visible de la APP a **v1.29.0** y el `package.json` a `1.29.0`.

### Versionado
- Versión anterior: `1.28.3`
- Nueva versión consolidada: `1.29.0`

---

## v1.28.3 - Visualización de agent sin alterar login

### Cambios consolidados
- Se mantuvo el login con su funcionamiento original por `name` + `pass`, sin cambios en el origen de autenticación del usuario.
- Se ajustó la sesión para guardar y mostrar correctamente el valor de agente del usuario tomando `scorms_users.agent` (con compatibilidad también para `agente` si existe).
- El badge de sesión y el modal de usuario muestran explícitamente el valor del agente conectado.
- El botón **Mis scorms** conserva su filtro por responsable usando `userSession.agente`, por lo que ahora aplica el agente real cargado en login sin cambiar la lógica del botón.
- Se actualizó la versión visible de la APP a **v1.28.3** y el versionado de `package.json` a `1.28.3`.

### Versionado
- Versión anterior: `1.28.2`
- Nueva versión consolidada: `1.28.3`

---

## v1.28.2 - Login con nick/agent y filtro Mis scorms por agente real

### Cambios consolidados
- Se reforzó el login para autenticar por `name` o por `nick`, usando la misma contraseña de `scorms_users`.
- Se ajustó la sesión para capturar el agente desde ambas columnas compatibles (`agente` o `agent`) y mostrarlo correctamente al iniciar sesión.
- Se añadió persistencia normalizada de sesión para que usuarios con sesiones antiguas también recuperen el agente correcto sin reloguear.
- Se mejoró el badge/ventana de sesión para priorizar la visualización del `nick` del usuario y mostrar el agente asignado de forma explícita.
- Con esto, el botón **Mis scorms** aplica el filtro por responsable usando el agente real cargado desde login.
- Se actualizó la versión visible de la APP a **v1.28.2** y el versionado de `package.json` a `1.28.2`.

### Versionado
- Versión anterior: `1.28.1`
- Nueva versión consolidada: `1.28.2`

---

## v1.28.1 - Normalización de agente y ajuste de “Mis scorms"

### Cambios consolidados
- Se corrigió la correlación del filtro **Mis scorms** para que compare responsable/agente ignorando mayúsculas, tildes y espacios (incluyendo espacios internos), manteniendo soporte de múltiples responsables separados por `&`.
- En la cabecera superior derecha, el badge de sesión ahora muestra el **nombre de agente** del usuario conectado (con fallback al nombre de usuario si no hay agente).
- En el modal de sesión se añadió una línea informativa con el agente activo para hacer visible la identidad de agente durante la sesión.
- Se actualizó la versión visible de la APP a **v1.28.1** y el versionado de `package.json` a `1.28.1`.

### Versionado
- Versión anterior: `1.28.0`
- Nueva versión consolidada: `1.28.1`

---

## v1.28.0 - Correlación de agentes y filtro “Mis scorms”

### Cambios consolidados
- Se incorporó la correlación de **agentes** desde `scorms_users.agente` para la sesión de usuario al iniciar sesión.
- En la vista **SCORMs Master** se añadió el botón **Mis scorms** que activa/desactiva un filtro por responsable según el agente del usuario conectado.
- El filtro **Mis scorms** contempla múltiples responsables en `scorm_responsable` separados por `&` (comparación exacta por nombre de agente, ignorando mayúsculas/minúsculas y espacios laterales).
- Se añadieron ayudas visuales en los formularios de creación/edición para indicar el formato de múltiples responsables separados por `&`.
- Se añadió una migración incremental para incluir la columna `agente` en `scorms_users`.
- Se actualizó la versión visible de la APP a **v1.28.0** y el versionado de `package.json` a `1.28.0`.

### Versionado
- Versión anterior: `1.27.4`
- Nueva versión consolidada: `1.28.0`

---

## v1.27.4 - Diferenciación visual de niveles en modal de cursos (Master)

### Cambios consolidados
- En el modal de **Cursos relacionados al SCORM** (vista master), se reforzó la diferenciación visual entre **Nivel 1** y **Nivel 2** del acordeón.
- Se aclaró visualmente el acordeón en **Nivel 2** y **Nivel 3** con fondos y bordes más suaves para jerarquía más legible.
- Se eliminaron las **negritas** en los encabezados de **Nivel 2** y **Nivel 3**, manteniendo el énfasis principal en el **Nivel 1**.
- Se actualizó la versión visible de la APP a **v1.27.4** y el versionado de `package.json` a `1.27.4`.

### Versionado
- Versión anterior: `1.27.3`
- Nueva versión consolidada: `1.27.4`

---

## v1.27.3 - Curso nombre visible en todos los niveles del modal de cursos (Master)

### Cambios consolidados
- En el modal de **Cursos individuales** de la vista **SCORMs Master**, se añadió `curso_nombre` en los **3 niveles** del acordeón para mejorar trazabilidad visual.
- En el **Nivel 1**, `curso_nombre` ahora se muestra como primer dato del resumen del grupo, alineado con el criterio ya aplicado en la subvista de cursos individuales.
- En el **Nivel 2**, el resumen de cada grupo de cursos ahora prioriza `curso_nombre` y mantiene el identificador del grupo como dato complementario.
- En el **Nivel 3**, el bloque de detalles incorpora `curso_nombre` en el resumen y la tabla de campos reordena las filas para mostrar `curso_nombre` en primer lugar.
- Se actualizó la versión visible de la APP a **v1.27.3** y el versionado de `package.json` a `1.27.3`.

### Versionado
- Versión anterior: `1.27.2`
- Nueva versión consolidada: `1.27.3`

---

## v1.27.2 - Cursos individuales en master con acordeón de 3 niveles

### Cambios consolidados
- En la vista **master** de SCORMs, el botón **Cursos** ahora representa y muestra el número de **cursos individuales** relacionados con cada SCORM.
- En el modal de cursos del master se implementó un acordeón de **3 niveles**:
  - **Nivel 1:** cursos individuales.
  - **Nivel 2:** cursos agrupados dentro de cada curso individual.
  - **Nivel 3:** detalle en modo tabla.
- En la tabla de detalle (nivel 3) se excluyó la columna/campo **contenido(s)** según lo solicitado.
- Se actualizó la versión visible de la APP a **v1.27.2** y el versionado de `package.json` a `1.27.2`.

### Versionado
- Versión anterior: `1.27.1`
- Nueva versión consolidada: `1.27.2`

---

## v1.27.1 - Botón SCORMS en nivel 1 de Cursos individuales

### Cambios consolidados
- Se deshizo el cambio de agrupación por SCORM como nivel superior del acordeón en la subvista **Cursos individuales**.
- Se recuperó la estructura original por **Código individual** en el nivel 1 del acordeón.
- Se movió el botón **Scorms** al resumen del **nivel 1** (a la derecha), eliminándolo de las filas internas del nivel 2.
- El botón **Scorms** del nivel 1 abre el mismo modal existente y ahora consolida todos los SCORMs detectados en todas las filas del grupo expandido.
- Se actualizó la versión visible de la APP a **v1.27.1** y el versionado de `package.json` a `1.27.1`.

### Versionado
- Versión anterior: `1.27.0`
- Nueva versión consolidada: `1.27.1`

---

## v1.27.0 - Nodo superior SCORMS en Cursos individuales

### Cambios consolidados
- En la subvista **Cursos individuales** de **SCORMs Cursos** se añadió un nuevo nivel superior de acordeón por **SCORMS**.
- Cada nodo superior lista el SCORM detectado desde la columna `contenido` y muestra debajo los grupos de **Código individual** relacionados.
- Dentro de cada SCORM se mantiene el detalle existente por **Código individual** con su tabla de cursos y acciones **Detalles** / **Scorms**.
- Se incorporó manejo de cursos sin referencia SCORM, agrupándolos en el nodo **Sin SCORM referenciado**.
- Se actualizó la versión visible de la APP a **v1.27.0** y el versionado de `package.json` a `1.27.0`.

### Versionado
- Versión anterior: `1.26.0`
- Nueva versión consolidada: `1.27.0`

---

## v1.26.0 - Código individual y subvista de Cursos individuales

### Cambios consolidados
- Se añadió la nueva columna `codigo_individual` en la estructura de `scorms_cursos` mediante migración incremental y se actualizó el script de creación base para nuevos entornos.
- Se incorporó una nueva subvista **Cursos individuales** dentro de **SCORMs Cursos**.
- La subvista muestra un acordeón por **Código individual** y enseña en cabecera: **Código individual**, **Curso nombre** (primer valor del grupo) y **Materia**.
- Al expandir cada grupo se listan todos los cursos asociados al mismo código individual con columnas: **curso_codigo**, **curso_nombre**, **tipología**, botón **Detalles** y botón **SCORMs**.
- Se añadió un modal de **Detalle del curso** para mostrar la información completa del curso seleccionado desde la subvista de cursos individuales.
- Se actualizó la versión visible de la APP a **v1.26.0** y el versionado de `package.json` a `1.26.0`.

### Versionado
- Versión anterior: `1.25.0`
- Nueva versión consolidada: `1.26.0`

---

## v1.25.0 - Acordeón de filtros clicable en todas las vistas

### Cambios consolidados
- Se actualizó el panel global de **Filtros** en **SCORMs Master** para que funcione como acordeón desde toda la cabecera: ahora puede expandirse o contraerse haciendo clic en cualquier punto del encabezado del panel, no solo en el control lateral.
- Se aplicó el mismo comportamiento de acordeón en la vista **SCORMs Cursos**, unificando la interacción en todas las vistas de tablas.
- Se mejoró la accesibilidad del encabezado de filtros convirtiéndolo en un control navegable por teclado (`Tab`, `Enter` y `Espacio`) con estado expandido/colapsado.
- Se ajustaron estilos visuales de la cabecera interactiva de filtros (cursor, ancho completo, foco visible y etiqueta de estado Expandir/Colapsar).
- Se actualizó la versión de la APP en `package.json` a `1.25.0`.

### Versionado
- Versión anterior: `1.24.0`
- Nueva versión consolidada: `1.25.0`

---

## v1.24.0 - Relación bidireccional SCORMs↔Cursos y alta de cursos con buscador de SCORMs

### Cambios consolidados
- En la vista **SCORMs Master** se sustituyó la columna **Etiquetas** por **CURSOS**, mostrando un botón por fila para abrir el detalle de cursos vinculados al SCORM.
- Se incorporó la carga de `scorms_cursos` dentro de la vista master para resolver la relación inversa (SCORM → Cursos) leyendo referencias en `contenido`.
- El botón de **CURSOS** abre un **modal grande** con acordeón de cursos relacionados al SCORM seleccionado.
- En el primer nivel del acordeón se muestran: **curso_nombre**, **tipología** e **inscripción**.
- Al expandir cada curso, el resto del detalle se presenta en formato de **tabla de dos columnas** (Campo / Valor).
- En la vista **SCORMs Cursos** se añadió el botón **Crear Curso**, que abre un modal grande para informar datos del nuevo curso y guardarlo en `scorms_cursos`.
- El modal de creación de curso permite **relacionar SCORMs** mediante buscador por **código, nombre, responsable y categoría**.
- Los SCORMs seleccionados al crear el curso se persisten en la columna **contenido** como referencias `IDIOMA-SCR####`.
- Se añadieron estilos para modal grande y para el resumen de acordeón de cursos.
- Se actualizó la versión de la APP en `package.json` a `1.24.0`.

### Versionado
- Versión anterior: `1.23.0`
- Nueva versión consolidada: `1.24.0`

---

## v1.23.0 - Selección por clic en tablas Master y Cursos (estilo Qlik)

### Cambios consolidados
- Se añadió funcionalidad **select on click** en la tabla de **SCORMs Master**: al hacer clic en una celda de datos, se aplica (o quita) automáticamente un filtro con el valor de esa celda en su misma columna.
- Se añadió la misma funcionalidad **select on click** en la tabla de **SCORMs Cursos** sobre las columnas visibles de la vista compacta.
- Los valores ya seleccionados quedan resaltados visualmente dentro de la tabla para identificar de forma inmediata qué selecciones están activas.
- Se añadió estilo visual de celdas seleccionables (`hover` + estado seleccionado) para mejorar la experiencia de uso tipo Qlik.
- Se actualizó la versión visible de la APP en cabecera y el versionado de `package.json` a `1.23.0`.

### Versionado
- Versión anterior: `1.22.0`
- Nueva versión consolidada: `1.23.0`

---

## v1.22.0 - Nuevas columnas visibles en vista de Cursos

### Cambios consolidados
- En la tabla compacta de **SCORMs Cursos** se añadieron las columnas visibles solicitadas: **Tipología**, **Materia**, **PA Nombre**, **Curso instructor** y **URL curso**.
- Se mantuvo **Detalle** como la última columna a la derecha.
- Se conservó **Curso nombre** como la columna más ancha para priorizar la legibilidad del título del curso.
- En la columna **URL curso** el enlace ahora se muestra con la palabra fija **"LINK"** cuando existe una URL válida.
- Se actualizó la versión visible de la APP en `package.json` a `1.22.0`.

### Versionado
- Versión anterior: `1.21.0`
- Nueva versión consolidada: `1.22.0`

---

## v1.21.0 - Filtros colapsados por defecto y ajuste del modal de SCORMs en Cursos

### Cambios consolidados
- Se configuró el comportamiento global de paneles de filtros para que arranquen **colapsados por defecto** en todas las vistas principales (`SCORMs` y `SCORMs Cursos`).
- En la tabla compacta de **SCORMs Cursos** se redistribuyeron las columnas para priorizar la operación solicitada:
  - columna 1: botón **Scorms**,
  - columna 2: **Curso código**,
  - columna 3: **Curso nombre** (en negrita y con mayor anchura),
  - última columna: acción **Detalle**.
- En el modal de SCORMs dentro de cursos se eliminó el bloque textual superior con el contenido del curso, dejando la experiencia centrada en el acordeón.
- En el resumen del acordeón se cambió la visualización del enlace a etiqueta fija **"Link RISE"** con hipervínculo.
- En el detalle expandido del acordeón se ocultaron los campos **ID** y **CREATED AT**.
- Los campos del detalle del acordeón se dejaron en modo de **solo lectura no editable** con representación visual tipo texto.
- Se actualizó la versión visible de la APP en `package.json` a `1.21.0`.

### Versionado
- Versión anterior: `1.20.0`
- Nueva versión consolidada: `1.21.0`

---

## v1.20.0 - Vinculación Cursos ↔ SCORM Master con modal de acordeón

### Cambios consolidados
- Se conectó la vista **SCORMs Cursos** con la tabla `scorms_master`, cargando ambos datasets en paralelo para resolver referencias de contenido de curso contra SCORMs master.
- Se añadió una nueva columna de acción **Scorms** en cada fila de cursos; al pulsarla se abre un modal dedicado por curso.
- En el modal se incorporó un acordeón de SCORMs detectados en `contenido` mediante patrón `SCR####` con prefijo de idioma opcional (`ES-`, `CAT-`, `PT-`, etc.), aplicando filtro de idioma cuando viene informado en el contenido.
- El primer nivel del acordeón muestra: **`scorm_code`** (en negrita), `scorm_name`, `scorm_responsable` y `scorm_url` navegable.
- Al expandir cada elemento se muestran el resto de campos disponibles del registro en `scorms_master` en formato de detalle de solo lectura.
- Se añadieron estilos globales para el acordeón y la presentación en rejilla de los campos dentro del modal.
- Se actualizó la versión visible de la APP en `package.json` a `1.20.0`.

### Versionado
- Versión anterior: `1.19.0`
- Nueva versión consolidada: `1.20.0`

---

## v1.19.0 - Filtros colapsables unificados y detalle SCORM en tabla

### Cambios consolidados
- Se convirtió el panel global de **Filtros** en un bloque **colapsable/expandible** en la vista principal de SCORMs, manteniendo el recuento de filtros activos y toda la funcionalidad existente.
- Se consolidó el mismo patrón visual y funcional de filtros en la vista **SCORMs Cursos** (panel completo con tarjetas de filtro visibles + botón Colapsar/Expandir).
- El modal de **Detalles SCORM** se rediseñó a formato **tabla (Campo / Valor)**, manteniendo la editabilidad de todos los campos y los botones de acción ya existentes.
- Se actualizaron estilos globales para soportar el nuevo encabezado interactivo de filtros, el estado colapsado y el formato tabular del detalle editable.
- Se actualizó la versión visible de la APP a **v1.19.0** y el versionado de `package.json` a `1.19.0`.

### Versionado
- Versión anterior: `1.18.0`
- Nueva versión consolidada: `1.19.0`

---

## v1.18.0 - Rediseño y reordenación del panel de filtros

### Cambios consolidados
- Se rediseñó el panel de filtros para que las cajas estén **siempre visibles**, eliminando la necesidad de abrir desplegables para escribir filtros.
- Se reorganizó el orden de filtros en tres líneas:
  - Línea 1: **Código SCORM**, **Nombre**.
  - Línea 2: **Responsable**, **Clasificación**, **Estado**, **Idioma**.
  - Línea 3: resto de campos.
- En los filtros de **Responsable, Clasificación, Estado e Idioma** se sustituyó la entrada libre por un selector con valores posibles detectados automáticamente de los registros cargados.
- Se aplicó un ajuste estético del panel para un estilo más fino (tarjetas más compactas, cabeceras suaves y espaciado reducido).
- Se actualizó la versión visible de la APP a **v1.18.0** y el versionado de `package.json` a `1.18.0`.

### Versionado
- Versión anterior: `1.17.0`
- Nueva versión consolidada: `1.18.0`

---

## v1.17.0 - Orden de estados, KPI por bloque y deshacer/rehacer en vista por estado

### Cambios consolidados
- En la vista por estado se ajustó el orden fijo de bloques a: **En proceso > Pendiente de publicar > Publicado > Actualizado pendiente de publicar** (y después el resto en orden alfabético).
- En el encabezado de cada bloque de estado se añadió un **KPI dentro de un círculo** con el número de SCORMs de ese estado.
- Se añadieron botones **Deshacer** y **Rehacer** visibles en la propia **Vista por estado** para revertir y reaplicar cambios manuales de estado (drag & drop).
- Se actualizaron estilos visuales para los nuevos controles y badge circular de KPI.
- Se actualizó la versión visible de la APP a **v1.17.0** y el versionado de `package.json` a `1.17.0`.

### Versionado
- Versión anterior: `1.16.0`
- Nueva versión consolidada: `1.17.0`

---

## v1.16.0 - Login de acceso con usuario conectado y cambio de contraseña

### Cambios consolidados
- Se creó la migración `20260214_create_scorms_users.sql` para incorporar la tabla `public.scorms_users` usada para gestionar accesos de la APP (`name`, `pass`, `admin`).
- Se añadió una pantalla de **login obligatoria** al entrar a la APP, validando `name` + `pass` contra `scorms_users` antes de permitir acceso al contenido.
- Se incorporó persistencia de sesión local para mantener el usuario autenticado tras recarga del navegador.
- Con sesión iniciada, en la esquina superior derecha se añadió un botón compacto con el **nombre del usuario** y un **punto verde** de conexión.
- Al pulsar el botón de usuario se abre un modal que permite **cambiar la contraseña** del usuario autenticado; el nuevo valor se sobrescribe en `scorms_users.pass`.
- Se añadió acción de **Cerrar sesión** desde el modal de usuario.
- Se actualizó la versión visible de la APP a **v1.16.0** y el versionado de `package.json` a `1.16.0`.

### Versionado
- Versión anterior: `1.15.1`
- Nueva versión consolidada: `1.16.0`

---

## v1.15.1 - Ajustes de navegación y detalle compacto en SCORMs Cursos

### Cambios consolidados
- Se añadió un botón **Volver a SCORMs** dentro de la vista de `scorms_cursos` para retornar de forma directa a la vista anterior.
- Se rediseñó la tabla de cursos a filas más compactas (menor alto de fila y tipografía más contenida).
- Se movió el control de detalle a la **primera columna** de la tabla.
- Se sustituyó el modal de detalle por un patrón de **expandir/colapsar** por fila para mostrar los campos extendidos en línea.
- Se mantiene el panel de filtros y el scroll lateral de la tabla.
- Se actualizó la versión de la APP en `package.json` a `1.15.1`.

### Versionado
- Versión anterior: `1.15.0`
- Nueva versión consolidada: `1.15.1`

---

## v1.15.0 - Integración de SCORMs Cursos con vista y filtros propios

### Cambios consolidados
- Se creó la migración `20260213_create_scorms_cursos.sql` para incorporar la nueva tabla `public.scorms_cursos` con el esquema completo solicitado.
- Se añadió la nueva vista **SCORMs Cursos · Vista general** conectada a Supabase sobre `scorms_cursos`, con refresco de datos y contador de carga.
- Se incorporó un **panel de filtros** por columna (múltiples filtros por campo) equivalente al enfoque de filtros desplegables de SCORMs.
- La nueva tabla de cursos incluye **scroll lateral** para manejar todas las columnas del esquema de forma usable en pantalla.
- Se añadió una acción **Ver detalle** por fila para abrir un modal con los datos completos del curso seleccionado.
- Se incorporó un selector superior para alternar entre la gestión tradicional de **SCORMs** y la nueva vista de **SCORMs Cursos**.
- Se actualizó la versión de la APP en `package.json` a `1.15.0`.

### Versionado
- Versión anterior: `1.14.0`
- Nueva versión consolidada: `1.15.0`

---

## v1.14.0 - Tipo de actualización en tabla de Publicación pendiente

### Cambios consolidados
- En la vista **Publicación pendiente** se añadió la columna **Tipo de actualización** ubicada a la izquierda de la columna **Fecha**.
- Para registros en estado **Pendiente de publicar**, la nueva columna muestra el texto fijo **"Nueva publicación"**.
- Para registros en estado **Actualizado pendiente de publicar**, la nueva columna muestra el valor de **`cambio_tipo`** recuperado desde `scorms_actualizacion` (última actualización por código SCORM).
- Se amplió la carga de datos de actualizaciones para incluir `cambio_tipo` junto con la fecha y así reutilizar una sola consulta para fecha + tipo.
- Se actualizó la versión visible de la APP a **v1.14.0** y el versionado de `package.json` a `1.14.0`.

### Versionado
- Versión anterior: `1.13.0`
- Nueva versión consolidada: `1.14.0`

---

## v1.13.0 - KPI y color dinámico en botón Publicación pendiente

### Cambios consolidados
- En la cabecera principal se añadió el **KPI** dentro del botón **Publicación pendiente**, mostrando el total de SCORMs con estado **Pendiente de publicar** + **Actualizado pendiente de publicar**.
- El botón **Publicación pendiente** ahora cambia a estilo destacado (naranja) cuando existe al menos un SCORM pendiente de publicación (nuevo o actualizado).
- Se actualizó la versión visible de la APP a **v1.13.0** y el versionado de `package.json` a `1.13.0`.

### Versionado
- Versión anterior: `1.12.0`
- Nueva versión consolidada: `1.13.0`

---

## v1.12.0 - Fechas y ordenación en Publicación pendiente

### Cambios consolidados
- En la vista **Publicación pendiente** se añadió una columna **Fecha** con formato **DD/MM/AAAA**.
- Para filas en estado **Actualizado pendiente de publicar**, la fecha mostrada pasa a ser la **última fecha de actualización** registrada en `scorms_actualizacion`.
- Para filas en estado **Pendiente de publicar**, la fecha mostrada corresponde a la **fecha de creación** del SCORM (`created_at` en `scorms_master`).
- Se habilitó la **ordenación por fecha** al hacer clic sobre el encabezado de la nueva columna Fecha (alterna ascendente/descendente).
- En esa tabla se eliminaron las columnas **Subcategoría** y **Etiquetas**.
- Se actualizó la versión visible de la APP a **v1.12.0** y el versionado de `package.json` a `1.12.0`.

### Versionado
- Versión anterior: `1.11.0`
- Nueva versión consolidada: `1.12.0`

---

## v1.11.0 - Filtros globales recuperados y KPIs de publicación

### Cambios consolidados
- Se recuperó el acceso a **Filtros** para todas las vistas (Tabla, Vista por estado, Traducciones y Publicación pendiente), dejando el mismo panel global justo debajo de la cabecera principal.
- Se mantuvo intacta la lógica de filtrado común para todas las vistas, pero ahora el control vuelve a estar visible en cualquier modo de trabajo.
- En la vista **Publicación pendiente**, el botón **Actualizaciones** ahora se resalta en naranja cuando existe al menos un SCORM en estado **Pendiente de publicar** o **Actualizado pendiente de publicar**.
- Se añadió KPI también al filtro de **Pendientes de publicar** (antes "Nuevos SCORMs"), mostrando el recuento de SCORMs en ese estado directamente en el botón.
- Se mantuvo el KPI de **Actualizaciones** dentro de su botón para ver el conteo de "Actualizado pendiente de publicar".
- Se actualizó la versión visible de la APP a **v1.11.0** y el versionado de `package.json` a `1.11.0`.

### Versionado
- Versión anterior: `1.10.0`
- Nueva versión consolidada: `1.11.0`

---

## v1.10.0 - Controles sobre tabla, filtros en cabecera y KPI integrado

### Cambios consolidados
- Se movieron los botones **Crear SCORM**, **Actualizar selección**, **Deshacer** y **Rehacer** para que queden justo encima de la tabla principal (dentro del bloque de tabla).
- Se retiró el panel de filtros superior y se integró directamente en la cabecera operativa de la tabla mediante un desplegable **Filtros**, manteniendo la misma lógica de uso por columna (añadir filtros, chips y quitar filtros).
- Se mantuvo el comportamiento de filtrado global para las vistas existentes, pero su punto de interacción ahora vive en el encabezado de la tabla.
- El KPI de publicación se integró dentro del botón **Actualizaciones** (vista de publicación pendiente), ubicado a la derecha en formato de círculo con la paleta cálida solicitada.
- Se actualizó la versión visible de la APP a **v1.10.0** y el versionado de `package.json` a `1.10.0`.

### Versionado
- Versión anterior: `1.9.0`
- Nueva versión consolidada: `1.10.0`

---

## v1.9.0 - Vista de publicación pendiente, KPI y acción publicar

### Cambios consolidados
- Se creó una nueva vista **Publicación pendiente** accesible desde la cabecera, pensada para gestionar solo SCORMs en estado **Pendiente de publicar** y **Actualizado pendiente de publicar**.
- La nueva vista mantiene los filtros globales existentes (los mismos de la tabla principal) y muestra una tabla equivalente a la principal, pero acotada a esos estados.
- Se añadieron filtros rápidos propios de la vista:
  - **TODOS**: muestra todos los SCORMs pendientes de publicación,
  - **Recientes**: muestra los de la última semana,
  - **Nuevos SCORMs**: muestra solo estado *Pendiente de publicar*,
  - **Actualizaciones**: muestra solo estado *Actualizado pendiente de publicar*.
- En la columna de acciones de esta vista se sustituyó la operación de actualización por un botón **PUBLICAR SCORM** con estilo cálido.
- Al pulsar **PUBLICAR SCORM**, el estado del registro cambia a **Publicado** en Supabase y se refleja de inmediato en la UI.
- En la cabecera principal se añadió un **KPI publicación** con el recuento rápido de SCORMs pendientes de publicar (nuevos + actualizados).
- Se actualizó la versión visible de la APP a **v1.9.0** y el versionado de `package.json` a `1.9.0`.

### Versionado
- Versión anterior: `1.8.0`
- Nueva versión consolidada: `1.9.0`

---

## v1.8.0 - Botones unificados y histórico de actualizaciones en Detalles

### Cambios consolidados
- Se unificó la estética y tamaño de los botones **Detalles** y **Actualizar SCORM** en las acciones de tabla y tarjetas de estado, aplicando el mismo estilo secundario y ancho mínimo común.
- En la vista de **Detalles** se añadió el botón **Actualizaciones** para consultar el histórico del SCORM seleccionado.
- Se incorporó un nuevo modal de **Histórico de actualizaciones** que consulta `scorms_actualizacion` por `scorm_code` y muestra tipo de cambio, fecha de modificación, usuario y notas.
- Se añadió feedback de carga, estado vacío y manejo de error cuando no se puede recuperar historial.
- Se actualizó la versión visible en cabecera de la APP a **v1.8.0** y el versionado de `package.json` a `1.8.0`.

### Versionado
- Versión anterior: `1.7.0`
- Nueva versión consolidada: `1.8.0`

---

## v1.7.0 - Homogeneización de acciones, actualización múltiple y alta de SCORM

### Cambios consolidados
- Se homogeneizó la experiencia visual de las acciones de actualización en todas las vistas (tabla, estado, traducciones y modal de detalle), unificando estilo y tamaño del botón **Actualizar SCORM** para mejorar consistencia de lectura y uso.
- Se incorporó selección por **check** en la vista tabla:
  - check por fila para selección individual,
  - check en cabecera para seleccionar/deseleccionar todos los SCORM visibles por filtros.
- Se añadió la acción **Actualizar selección (N)** en cabecera para actualizar varios SCORM a la vez con un único flujo.
- El modal de actualización ahora soporta operación múltiple:
  - inserta un registro en `scorms_actualizacion` por cada SCORM seleccionado,
  - cambia el estado de todos los seleccionados a **Actualizado pendiente de publicar**.
- Se añadió el botón **Crear SCORM** en cabecera con modal de alta completa (todos los campos editables de `scorms_master`).
- En el alta de SCORM se sugiere automáticamente el siguiente código libre en formato `SCRNNNN` (ejemplo: si el último detectado es `SCR0999`, propone `SCR1000`).
- Se añadieron validaciones en alta para requerir **Código** y **Nombre**, y evitar códigos duplicados.
- Se actualizó la versión visible de la APP a **v1.7.0** y el versionado de `package.json` a `1.7.0`.

### Versionado
- Versión anterior: `1.6.1`
- Nueva versión consolidada: `1.7.0`

---

## v1.6.1 - Corrección de campo de nombre SCORM (`scorm_name`)

### Cambios consolidados
- Se corrigió la referencia de la columna editable **Nombre** para usar `scorm_name` (en lugar de `scorm_nombre`) en la configuración principal de columnas.
- Se ajustó la lógica de filtros de la columna **Nombre** para evaluar `scorm_name` como clave oficial.
- Se actualizó la renderización condicional de celdas para la columna **Nombre** usando `scorm_name`.
- Se priorizó `scorm_name` como fuente de nombre oficial en lectura, manteniendo compatibilidad con `scorm_nombre` como respaldo histórico.
- Se actualizó la versión visible en cabecera de la APP a **v1.6.1**.

### Versionado
- Versión anterior: `1.6.0`
- Nueva versión consolidada: `1.6.1`

---

## v1.6.0 - Flujo de actualización de SCORM con trazabilidad en Supabase

### Cambios consolidados
- Se añadió la acción **Actualizar SCORM** en la columna de acciones de la vista principal (tabla), con apertura de modal dedicado al flujo de actualización.
- Se añadió también el botón **Actualizar SCORM** dentro del modal de detalles, para que la acción esté disponible desde la ficha del SCORM independientemente de la vista desde la que se haya abierto.
- Se implementó el nuevo modal de actualización con validaciones y campos alineados a la nueva tabla `scorms_actualizacion`:
  - `cambio_tipo` **obligatorio** con 4 opciones cerradas:
    - Cambios menores
    - Cambio de estructura
    - Actualización de imágenes
    - Actualización de storyline
  - `fecha_modif` editable (por defecto fecha actual),
  - `cambio_user` opcional manual,
  - `cambio_notas` opcional.
- Al confirmar la actualización:
  - se inserta el registro en `scorms_actualizacion` con `scorm_codigo` vinculado al `scorm_code` del registro principal,
  - se actualiza automáticamente el estado del SCORM a **Actualizado pendiente de publicar** en `scorms_master`.
- Se añadieron estilos para la nueva UX (acciones múltiples por fila, modal compacto de actualización y campo de notas multilínea).
- Se creó migración SQL para la tabla `public.scorms_actualizacion`.

### Versionado
- Versión anterior: `1.5.1`
- Nueva versión consolidada: `1.6.0`

---

## v1.5.1 - Normalización de idioma catalán y preset TODOS en Traducciones

### Cambios consolidados
- Se normalizó el idioma catalán a **CAT** (en lugar de CA) en toda la vista para:
  - detección de idiomas disponibles,
  - agrupación por cobertura de traducciones,
  - formato de código internacionalizado mostrado en tabla y tarjetas.
- En la vista **Traducciones** se añadió el preset **TODOS** y se dejó como filtro por defecto para mostrar todos los SCORMs agrupados por `scorm_code` al entrar en la vista.
- Se mantiene la lógica de que un SCORM multiidioma es el mismo contenido funcional cuando comparte `scorm_code` (por ejemplo, `SCR0067`), diferenciando únicamente su disponibilidad por idioma.

### Versionado
- Versión anterior: `1.5.0`
- Nueva versión consolidada: `1.5.1`

---

## v1.5.0 - Nueva vista Traducciones con filtros por cobertura de idioma

### Cambios consolidados
- Se creó la nueva vista **Traducciones** dentro del selector de vistas principal para priorizar el control por idioma.
- La vista agrupa SCORMs por **`scorm_code`** y muestra una tabla con columnas dinámicas de idioma:
  - idiomas actuales soportados por defecto: **ES, CA, PT**,
  - detección automática de nuevos idiomas en datos para que aparezcan sin cambios de código.
- Se añadieron tres filtros predefinidos de usabilidad en la vista Traducciones:
  - **Traducidos a todos los idiomas**: muestra SCORMs con cobertura completa de todos los idiomas disponibles.
  - **Solo en Español**: muestra SCORMs que únicamente existen en idioma ES.
  - **Pendiente de idioma**: permite seleccionar un idioma y muestra los SCORMs que no lo tienen.
- Se mantiene el panel de filtros común de la aplicación, compartido por tabla, estado y traducciones.
- Se ajustaron estilos para los nuevos controles de presets, selector de idioma y estados visuales de disponibilidad de traducción.

### Versionado
- Versión anterior: `1.4.1`
- Nueva versión consolidada: `1.5.0`

---

## v1.4.1 - Nombre oficial SCORM y código internacionalizado

### Cambios consolidados
- Se recuperó la columna **`scorm_nombre`** como fuente principal del nombre oficial del SCORM en:
  - tabla,
  - tarjetas de la vista por estado,
  - encabezado del modal de detalles.
- Se mantuvo compatibilidad de lectura con `scorm_name` como respaldo en caso de datos históricos.
- Se definió el **código internacionalizado** como concatenación de:
  - `scorm_idioma` + `-` + `scorm_code`.
- Se actualizó la visualización del campo **Código** para mostrar el código internacionalizado en tabla, tarjetas y modal.
- Se actualizó el comportamiento de filtros para que:
  - **Nombre** filtre por `scorm_nombre` (con respaldo en `scorm_name`),
  - **Código** filtre por el nuevo formato internacionalizado.
- Se ajustó el estilo de ancho de columna para contemplar la clase nueva `col-scorm_nombre` sin perder compatibilidad visual.

### Versionado
- Versión anterior: `1.4.0`
- Nueva versión consolidada: `1.4.1`

---

## v1.4.0 - Animación visual de arrastre, deshacer/rehacer y nuevo idioma SCORM

### Cambios consolidados
- Se mejoró la experiencia de arrastre en la vista por estado:
  - las tarjetas tienen transición visual durante la interacción,
  - el bloque de destino se resalta (sombreado) al pasar el SCORM por encima antes de soltarlo.
- Se añadieron botones **Deshacer** y **Rehacer** en la parte superior para revertir y reaplicar movimientos de estado.
- Se fijó el orden de paneles de estado a:
  - **En proceso**,
  - **Publicado**,
  - **Actualizado pendiente de publicar**,
  y después el resto de estados adicionales en orden alfabético.
- Se incorporó soporte de BDD para la nueva columna **`scorm_idioma`** mediante migración SQL.
- Se actualizó el **nombre mostrado** en tabla, tarjetas y ficha/modal para que sea la concatenación de:
  - `scorm_idioma` + `scorm_code`,
  - sin espacios, guiones ni guion bajo.
- Se mantiene el **código SCORM** (`scorm_code`) visible y buscable, incluyendo su presencia en detalle y filtros.

### Versionado
- Versión anterior: `1.3.0`
- Nueva versión consolidada: `1.4.0`

---

## v1.3.0 - Vista por estado, filtros desplegables y tablero drag & drop

### Cambios consolidados
- Se eliminó completamente la caja superior informativa de bienvenida (`GScormer · v1.2.0`, descripción extensa y subtítulo), dejando la pantalla centrada en la gestión operativa.
- Se añadió selector de vistas con botones:
  - **Vista por estado** (nuevo tablero horizontal),
  - **Volver a tabla** (retorno inmediato a la vista clásica).
- Se reemplazó la zona de filtros por un sistema de **desplegables por campo** (clic para abrir/cerrar), manteniendo la misma lógica de filtros múltiples por columna en ambas vistas.
- Se asignó un color fijo y diferente para cada categoría solicitada:
  - `02-Gestión Documental y Archivo`
  - `00-Configuración General`
  - `01-Atención Ciudadana`
  - `04-Gestión Económica`
  - `05-Escritorio de tramitación`
  - `06-Gestiona Code`
  - `03-Analiza`
- Se creó la nueva **Vista por estado** con contenedores por `scorm_estado`, mostrando tarjetas de SCORM con **código + nombre**.
- Se habilitó interacción de **arrastrar y soltar** entre estados:
  - mover un SCORM cambia su estado,
  - mover varios SCORMs a la vez con selección previa por **CTRL/CMD + clic**.
- Se añadió despliegue de detalle al hacer clic en una tarjeta en la vista por estado, mostrando campos clave y enlace.
- Se amplió el aprovechamiento horizontal de la interfaz para facilitar lectura y gestión de tableros por estado.

### Versionado
- Versión anterior: `1.2.0`
- Nueva versión consolidada: `1.3.0`

---

## v1.2.0 - Filtros avanzados, vista de detalles y mejoras de tabla

### Cambios consolidados
- Se añadió color dinámico por categoría en la columna **scorm_categoria**, generando un color único y consistente para cada valor.
- Se transformó la columna **URL** para mostrar un enlace de acción (**Abrir enlace**) sin exponer la URL completa en modo tabla.
- Se incorporó una **vista DETALLES** por fila con botón dedicado en la última columna:
  - abre un modal grande,
  - muestra título con `scorm_code`,
  - muestra subtítulo con `scorm_name`,
  - incluye el resto de campos editables,
  - permite guardar cambios con el botón **Guardar detalles**.
- Se implementó un **buscador por todos los campos** con soporte de múltiples filtros por columna:
  - permite añadir varios filtros por campo,
  - visualiza filtros en formato “chip” clicable para quitar uno a uno,
  - incluye botón **Quitar filtros** por cada campo.
- Se actualizó el estilo global para soportar la nueva experiencia de filtros, chips y modal.

### Versionado
- Versión anterior: `1.1.2`
- Nueva versión consolidada: `1.2.0`

---

## v1.1.2 - Ajustes visuales de tabla y simplificación de columnas

### Cambios consolidados
- Se actualizó la paleta general de la aplicación a tonos más claros (blancos, grises suaves, azules claros y verdes claros).
- Se reforzó el estilo “modo tabla” en la vista principal:
  - contenedor de tabla con borde y esquinas redondeadas,
  - encabezado más definido y fijo (sticky),
  - líneas divisorias verticales y horizontales,
  - filas alternadas para mejor lectura.
- Se amplió visualmente la columna **Nombre** (`scorm_name`) para facilitar la lectura de títulos largos.
- Se eliminaron de la vista de tabla las columnas **ID** y **Fecha de creación**.
- Se mantiene la lógica de guardado por `id` internamente, sin mostrarlo en la interfaz.

### Versionado
- Versión anterior: `1.1.1`
- Nueva versión consolidada: `1.1.2`

## v1.70.5 - Edición de PA con cursos PADRE y traducciones

### Cambios consolidados
- En el modal **Editar Plan de aprendizaje**, la lista de cursos para añadir ahora muestra todos los cursos de nivel **PADRE** y también sus cursos hijos de tipo **TRADUCCION**.
- Al abrir la edición de un PA, los cursos que ya están asociados a ese PA se cargan automáticamente marcados con check.
- Se ajustó el guardado del PA para evitar duplicar cursos ya asociados: solo se insertan como nuevos los cursos seleccionados que todavía no pertenecen al PA actual.
- En la tabla de selección de cursos del modal de edición se añadieron columnas de **Nivel** (relación) e **Idioma** para facilitar la identificación de PADRE/traducciones.

### Versionado
- Versión anterior: `1.70.4`
- Nueva versión consolidada: `1.70.5`


## v1.73.3 - Gestión de etiquetas con alta y edición por modal

### Cambios consolidados
- En el **Gestor de etiquetas**, cada fila incorpora un botón **Editar** que abre un modal específico para modificar los valores de la etiqueta seleccionada.
- Se añadió un flujo de **Añadir etiqueta** independiente para altas nuevas desde el propio modal del gestor.
- La carga del catálogo de `scorms_etiquetas` ahora incluye el campo `id` y lo muestra en tabla para facilitar seguimiento de claves.
- Al crear una etiqueta nueva, se asigna manualmente el campo `id` con valor correlativo respecto al último `id` existente en `scorms_etiquetas` (`max + 1`), tal como se solicitó.
- Se separó la lógica de guardado en dos acciones: creación (`insert`) y edición (`update` por `id`).

### Versionado
- Versión anterior: `1.73.2`
- Nueva versión consolidada: `1.73.3`


## v1.73.4 - Ajustes de UX en etiquetas y desmarcado tras edición masiva

### Cambios consolidados
- En el modal **Gestor de etiquetas**, el botón **Añadir etiqueta** se movió a la parte superior (cabecera del modal), junto al botón de cierre.
- En la edición masiva general de **SCORMs**, al aplicar cambios ahora se desmarcan automáticamente los SCORMs que formaban parte de la operación.
- En la edición masiva general de **cursos**, al aplicar cambios ahora se desmarcan automáticamente los cursos editados.

### Versionado
- Versión anterior: `1.73.3`
- Nueva versión consolidada: `1.73.4`
