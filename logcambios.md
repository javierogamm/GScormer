# Log de cambios

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
