# Log de cambios

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
