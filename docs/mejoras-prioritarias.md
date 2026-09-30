# Prioridades altas de diseño — implementadas

30 de septiembre de 2026. Seguimiento de la [auditoría inicial](auditoria-diseno.md).

## Cambios

- Pack de 3 clases con fondo opaco `#122326`, título y precio blancos, iconos cian y texto oscuro sobre las etiquetas cian. En móvil, «Más popular» ocupa su propia línea para no tapar el título.
- «Nuestros Colaboradores» visible sobre oscuro. Descripciones y pie usan `#A7B0BB`; el gris de lectura sobre blanco conserva su valor anterior.
- Texto oscuro en WhatsApp y botones de contorno de precios con teal oscuro. Etiquetas rojas con texto blanco pequeño usan `#B9252A`.
- La fila de la bici favorita se calcula desde `BIKE_CONFIG.rowConfig`. La favorita sigue siendo la 4, fila 1.
- Imágenes con cuadrícula reemplazadas por recursos con fondo oscuro, conservando el color de cada clase. La revisión adicional detectó el mismo defecto en sunrise, energy/power y sweat/marathon.

## Cancelación y reembolso

Se verificó [la implementación del endpoint](../app/api/bookings/cancel/route.ts): permite cancelar con al menos una hora de anticipación y procesa el reembolso de una clase suelta pagada cuando faltan **más de cuatro horas**. La política publicada y las preguntas frecuentes ya distinguen esos plazos.

Precios y checkout ahora comparten [los mensajes](../data/cancellation-policy.ts): «Cancela hasta 1 h antes» y «Reembolso total al cancelar con más de 4 h de anticipación». El checkout individual enlaza a la política. Se corrigió también el texto de 2 h del pack, que discrepaba con el endpoint y su descripción en Stripe. No se modificaron cobros, tarifas ni reglas del servidor.

## Verificación

- `npm run build`: correcto, incluida la comprobación de TypeScript.
- Chromium/Edge en 320 × 740, 375 × 812, 768 × 1024 y 1440 × 1000, con las fuentes cargadas y disponibilidad simulada.
- Coincidencia de la bici 4/fila 1 entre portada y checkout; mensajes de cancelación en precios, compra individual y pack.
- Botón «Pagar y reservar» alcanzable al desplazar el formulario en los cuatro tamaños.
- Separación entre el texto del título del pack y «Más popular»; inspección visual de capturas.
- Sin infracciones detectadas por las reglas seleccionadas de axe: contraste, nombres de botones/enlaces y etiquetas. En las mismas vistas de la auditoría inicial, las ocurrencias de contraste pasaron de 14 a 0 en escritorio y de 22 a 0 en móvil. Las imágenes y ciertos degradados siguen requiriendo revisión manual; no equivale a una certificación de accesibilidad.
- No se efectuaron pagos ni reservas reales. Las comprobaciones de contenido no prueban operaciones financieras.

Capturas finales:

- [Precios en escritorio](../output/design-priorities/desktop-precios.png).
- [Pack en móvil de 320 px](../output/design-priorities/small-mobile-pack-card.png).
- [Colaboradores en escritorio](../output/design-priorities/desktop-colaboradores.png).
- [Horario e imagen en móvil](../output/design-priorities/mobile-horarios.png).
- [Resumen de cancelación y pago en móvil](../output/design-priorities/mobile-checkout-bottom.png).

Métricas y script de verificación: `output/design-priorities/` (artefactos locales excluidos por el `.gitignore` existente).

## Recursos de imagen y procedencia

Se utilizó la herramienta integrada `image_gen`, en modo edición sobre las imágenes existentes. Los resultados se inspeccionaron y se exportaron a WebP de 450 × 900, calidad 85, para conservar las dimensiones que usa el sitio. Sunset y night se inspeccionaron y se conservaron.

Archivos finales en el proyecto:

| Edición | Archivos |
| --- | --- |
| After Work, violeta | [class-afterwork.webp](../public/class-afterwork.webp) |
| Sunrise, naranja | [class-sunrise.webp](../public/class-sunrise.webp) |
| Energy/Power, amarillo | [class-energy.webp](../public/class-energy.webp), [class-power.webp](../public/class-power.webp) |
| Sweat/Marathon, verde | [class-sweat.webp](../public/class-sweat.webp), [class-marathon.webp](../public/class-marathon.webp) |

Energy/Power y Sweat/Marathon ya compartían exactamente el mismo recurso antes de la edición; se mantuvo esa correspondencia.

Prompt final de After Work:

```text
Use case: precise-object-edit. Edit target: provided After Work Ride artwork for an indoor cycling class card. Preserve the single adult female cyclist's identity, athletic outfit, pose, purple rim light, stationary bicycle and portrait composition. Replace ONLY the entire baked-in gray/white checkerboard background and white fringe with a seamless near-black charcoal studio background (#0c1017), subtle purple atmospheric light matching the subject. Opaque final image, no transparency, absolutely no checkerboard anywhere, no white empty space, no text, logos or extra people. Keep the face and upper body clear near the top third for the website card's center-top crop. Produce a clean professional sports editorial asset, retaining the original visual style.
```

Prompt final de las tres ediciones restantes; valores `(name, color)`: `(sunrise, orange)`, `(energy, golden yellow)` y `(sweat, green)`:

```text
Use case: precise-object-edit. Edit target: supplied {name} indoor cycling class website artwork. Preserve exactly the single adult female cyclist, pose, outfit, stationary bike, composition, and {color} rim light. Replace ONLY the entire baked-in gray/white checkerboard background and white fringe with a seamless opaque near-black charcoal studio background (#0c1017) with subtle atmospheric {color} light matching the subject. Absolutely no checkerboard anywhere, no white empty space, no transparency, no text, no logos, no extra people. Portrait framing, athlete face and upper body remain near upper third for a center-top website thumbnail crop. Retain original illustration/photo style, polished clean edges.
```
