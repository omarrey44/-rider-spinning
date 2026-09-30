# Auditoría de diseño · Rideon

30 de septiembre de 2026. Este documento describe el estado inicial de la versión local antes de las correcciones.

**Seguimiento:** las prioridades altas ya están implementadas. Ver [cambios, recursos y comprobaciones](mejoras-prioritarias.md). Las capturas de esta auditoría se conservan como referencia del antes.

La identidad oscura con cian y la tipografía deportiva funcionan. La mejora con mayor impacto visual es **unificar jerarquías y corregir contrastes**, conservando esa identidad. Hay defectos concretos que conviene resolver antes de añadir efectos o rediseñar páginas completas.

[Abrir informe visual con selector móvil/escritorio](../output/design-audit/index.html).

## Alcance y evidencia

Revisión en Edge/Chromium, escritorio de 1440 × 1000 y móvil de 375 × 812: portada, horarios, selector de bicicletas, acceso a reservas/membresías, instrucciones, instructores, precios, preguntas frecuentes, colaboradores, sugerencias, contacto, menú móvil, compra individual, compra de suscripción y página de privacidad.

Los servicios de disponibilidad y los datos externos se simularon. No se realizaron compras ni reservas. Las capturas muestran esos datos de prueba. La revisión no abarca el administrador, Stripe, todos los estados de error, dispositivos físicos ni una auditoría completa de accesibilidad. En esta revisión no se volvió a ejecutar la matriz de tamaños del selector de membresías, verificada durante el trabajo anterior.

Se combinaron inspección visual, lectura del código, estilos calculados y cuatro reglas de axe: contraste de texto, nombres de botones, nombres de enlaces y etiquetas de campos. Se detectaron 14 ocurrencias de contraste en escritorio y 22 en móvil; varias corresponden al mismo componente repetido. Los degradados y fotografías requieren comprobación manual: axe dejó 241 nodos pendientes de contraste en escritorio y 203 en móvil. Estas cifras no representan defectos únicos ni una certificación.

## Prioridades

| Prioridad | Hallazgo | Cambio recomendado | Esfuerzo orientativo |
| --- | --- | --- | --- |
| Alta | El pack destacado usa texto blanco sobre un degradado demasiado claro en la parte superior. | Fondo oscuro estable para el pack; título, precio y vigencia claramente legibles. | Bajo |
| Alta | En colaboradores, «Nuestros» casi desaparece sobre el fondo oscuro. Las descripciones, el pie de página y algunos botones tienen contraste insuficiente. | Separar los colores de texto para superficies claras y oscuras; corregir las combinaciones medidas. | Bajo |
| Alta | After Work Ride muestra una cuadrícula incrustada en su imagen. | Sustituir o limpiar el recurso y revisar las demás imágenes de clases. | Medio; depende del recurso |
| Alta | La portada dice «Bike #04 · Fila 2 centro» y el selector ubica correctamente la bici 4 en fila 1. | Derivar número y fila de la misma configuración. Mantener la favorita en 4. | Bajo |
| Alta | Clase suelta anuncia cancelación hasta 4 h antes en precios y hasta 1 h antes en el formulario. | Confirmar la política vigente y mostrar un único mensaje en cada paso. | Bajo, una vez confirmada la regla |
| Media | Botones de reserva cambian de color según la clase, mientras otros avisos y accesos también brillan. | Un estilo de acción principal; colores de clase limitados a etiquetas o detalles. | Medio |
| Media | La entrada para miembros se presenta como «Buscar o cancelar reserva». | Dar prioridad a «Mis clases y membresías» y un acceso claro a reservar con el plan; conservar la cancelación fácil de encontrar. | Bajo/medio |
| Media | Los formularios de compra requieren desplazamiento para descubrir el botón final en móvil. | Aplicar cabecera compacta, cuerpo desplazable y acción final persistente, siguiendo el patrón del selector de membresías. | Medio |
| Media | Algunos bloques vacíos y ayudas ocupan mucho espacio antes de una acción útil. | Compactar estados iniciales, tarjetas de horarios y explicaciones; conservar superficies táctiles cómodas. | Medio |
| Media | La escala de títulos y el tratamiento de imágenes cambian entre secciones. | Unificar tamaños por función y usar fotos consistentes del equipo. | Medio |

El esfuerzo es una orientación de alcance, no una estimación en horas.

## Color y contraste

No hace falta cambiar la paleta completa. Hace falta asignar una función consistente a cada color y distinguir superficies claras de oscuras.

| Elemento actual | Texto / fondo | Contraste medido | Propuesta |
| --- | --- | --- | --- |
| Etiqueta de ahorro | `#FFFFFF` / `#1DD4E8` | 1.80:1 | Texto oscuro sobre cian. |
| Botón de WhatsApp | `#FFFFFF` / `#25D366` | 1.98:1 | Texto oscuro sobre el verde actual, o verde más oscuro con texto blanco. |
| Descripciones de colaboradores | `#6B6B6B` / `#111111` | 3.54:1 | Un gris claro específico para fondos oscuros. |
| Texto secundario del pie | `#6B6B6B` / `#141414` | 3.45:1 | El mismo gris claro para contenido secundario sobre oscuro. |
| Algunas etiquetas rojas pequeñas | `#FFFFFF` / `#E63946` | 4.16:1 | Oscurecer el rojo de fondo cuando lleve texto pequeño blanco. |

Para texto normal, WCAG AA exige al menos 4.5:1; para texto grande, 3:1. [Referencia oficial W3C](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Los ratios anteriores proceden de axe en la página renderizada. Los botones principales rojos usan otro fondo más oscuro: no se les atribuye el fallo de las etiquetas rojas.

La parte superior del pack y los botones de contorno cian sobre blanco también requieren corrección visual. Al tener degradados/transparencias, no se les asigna aquí un ratio automático concluyente.

Paleta propuesta, conservando la identidad:

| Función | Combinación propuesta | Contraste de colores sólidos |
| --- | --- | --- |
| Fondo principal y tarjetas | `#0A0A0A` / `#161616`, texto blanco | Verificar cada variante final |
| Identidad, selección, favorita | Cian `#1DD4E8`; texto `#141414` si el cian es el fondo | 10.21:1 |
| Acción principal: reservar/comprar | Rojo `#B9252A` con texto blanco | 6.25:1 |
| Enlaces sobre blanco | Teal oscuro `#006970` | 6.45:1 |
| Texto secundario sobre oscuro | Gris `#A7B0BB` sobre `#111111` | 8.61:1 |
| WhatsApp con fondo verde actual | Texto `#141414` sobre `#25D366` | 9.29:1 |

Estos últimos ratios son cálculos de las combinaciones propuestas, no resultados de una interfaz implementada. Disponibilidad, advertencia y ocupación deben incluir además texto o iconos. En las bicis, conservar favorita con estrella, selección con confirmación y ocupadas/bloqueadas con estados explícitos.

## Hallazgos por zona

### Portada y navegación

La imagen del estudio, el título condensado y la tarjeta de próxima clase comunican energía. Sin embargo, la frase motivacional ocupa más jerarquía que la oferta concreta. Propuesta de contenido principal: «Spinning en Chihuahua. Clases de 45 minutos. Elige horario y bici», con «Clase suelta $200 MXN» cerca del botón. La frase actual puede acompañar la marca en un nivel secundario.

La pequeña parrilla del hero dice «Selecciona tu bici», pero sus números son una vista previa sin interacción individual. Conviene convertirla en una entrada real al selector o identificarla como vista previa. Además, la fila de la bici favorita está escrita manualmente en [Hero.tsx](../components/Hero.tsx), lo que explica la discrepancia con el selector.

El menú móvil es legible, pero deja ver el contenido que hay detrás; una superficie más opaca daría mayor separación. El emblema de marca tiene mucho detalle para su tamaño en la cabecera: probar una variante simplificada para tamaños pequeños.

Evidencia: [portada escritorio](../output/design-audit/desktop-hero.png), [portada móvil](../output/design-audit/mobile-hero.png), [menú móvil](../output/design-audit/mobile-menu.png).

### Horarios y reserva con membresía

La imagen [class-afterwork.webp](../public/class-afterwork.webp) contiene la cuadrícula en los propios píxeles: el archivo no tiene canal alfa. Se ve como un recurso sin terminar. Debe reemplazarse por un recorte transparente limpio o una fotografía con fondo deliberado.

Los colores particulares de cada clase pueden conservarse como detalles. El botón para seleccionar bici debería mantener el mismo color y peso en todas las clases. «Próxima», disponibilidad y membresía no necesitan tres focos de brillo simultáneos.

En móvil, la fotografía de cada horario ocupa 160 px antes de los datos y acciones. Una miniatura junto a hora/nombre permitiría comparar mejor horarios. La sección «Mis reservas» combina buscar, reservar con membresía y cancelar en un bloque largo; conviene priorizar la tarea de volver a reservar, con ayuda breve bajo un campo etiquetado. La etiqueta debe explicar qué dato ingresar sin depender del placeholder, que se corta a 375 px.

Evidencia: [horarios móvil](../output/design-audit/mobile-horarios.png), [horarios escritorio](../output/design-audit/desktop-horarios.png), [acceso de miembros](../output/design-audit/mobile-mis-reservas.png).

### Precios y formularios

El pack debería destacar por fondo, borde y una sola etiqueta. Actualmente se acumulan «Más popular», ahorro cian, contorno, degradado y resplandor. Mostrar cerca del importe «3 clases · 7 días · $100 por clase» facilita comparar, manteniendo las condiciones actuales.

Para mensualidad, agrupar precio, renovación y cuota de mantenimiento en un resumen legible; evitar que información relevante quede al final de una lista de beneficios. Esto es una propuesta de presentación, no de cambio de tarifas.

A 375 × 812, el formulario individual necesita 102 px de desplazamiento interno para mostrar completamente el botón; el de suscripción necesita 164 px. Ambos botones son alcanzables. La mejora consiste en hacer evidente y persistente la acción final, reducir aire entre resumen y campos y revisar el resultado con teclado virtual en dispositivo real.

El plazo contradictorio de cancelación está en [Pricing.tsx](../components/Pricing.tsx) y [CheckoutModal.tsx](../components/CheckoutModal.tsx). Requiere validar la regla de negocio antes de corregir el texto.

Evidencia: [precios escritorio](../output/design-audit/desktop-precios.png), [suscripción móvil al abrir](../output/design-audit/mobile-subscribe.png), [suscripción después de desplazar](../output/design-audit/mobile-subscribe-bottom.png), [mediciones de formularios](../output/design-audit/mobile-dialog-metrics.json).

### Tipografía, espaciado y contenido secundario

Conservar Barlow Condensed para títulos y Manrope para lectura. La mayoría de los títulos de sección pasan de 52 px en escritorio a 22 px en móvil, mientras «Quejas y sugerencias» usa 28 px y el selector 24 px. Conviene definir una escala por función: como punto de partida, títulos móviles de 28–32 px, cuerpo de 15–16 px y metadatos de 12–13 px. Son propuestas de diseño que deben probarse con textos largos.

La página mide aproximadamente 10,585 px en escritorio y 12,111 px en móvil en el estado capturado. La longitud por sí sola no es un defecto. Sí resulta costoso dedicar bloques grandes al selector aún bloqueado, resultados de búsqueda vacíos y explicaciones antes de que el usuario los necesite. Reducir esos estados iniciales y presentar los tres pasos como ayuda compacta permitiría una navegación más directa.

Los instructores aparecen con iniciales. Fotos reales, con recorte e iluminación consistentes, darían mayor presencia al equipo. Los logos de colaboradores necesitan su propio fondo limpio: el degradado oscuro que atraviesa logos sobre blanco les resta claridad. Las secciones claras de precios, instructores y FAQ pueden conservarse, aplicando sus propios colores de texto.

El pie móvil ocupa alrededor de 1,219 px: consolidar enlaces repetidos entre soporte/legal y agrupar columnas. En privacidad, los apartados heredan padding global de sección, excesivo para un documento de lectura; ajustar el espaciado al contexto del texto.

Evidencia: [instructores](../output/design-audit/desktop-instructores.png), [colaboradores](../output/design-audit/desktop-colaboradores.png), [pie móvil](../output/design-audit/mobile-contacto.png), [privacidad](../output/design-audit/mobile-legal.png).

## Orden de implementación sugerido

1. Corregir contraste, fondo del pack, imagen con cuadrícula y fila de la bici 4. Resolver el mensaje de cancelación tras verificar la política vigente.
2. Unificar acciones y colores por función; compactar acceso de miembros, tarjetas móviles y formularios de compra.
3. Afinar contenido de portada, fotos del equipo, escala tipográfica, logos, pie y espaciado de páginas de lectura.

Para comprobar los cambios: comparar las mismas capturas; revisar al menos 320, 375, 768 y 1440 px; comprobar teclado/foco y desplazamiento; repetir contraste; verificar que selección, precio, fila y condiciones coinciden entre reserva individual y membresías. No se detectó desbordamiento horizontal de la página a 375 px en el estado probado. Las posibles mejoras en reservas completadas deben medirse con analítica o pruebas con usuarios; esta auditoría no predice un incremento de conversión.

Las capturas y métricas se conservan localmente en `output/design-audit/`, carpeta excluida por el `.gitignore` del proyecto. El informe Markdown es el documento versionable.
