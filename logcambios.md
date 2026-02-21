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
