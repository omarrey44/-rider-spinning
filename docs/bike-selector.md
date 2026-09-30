# Selector de bicicletas: análisis y aplicación

La reserva de clase individual de $200 utilizaba una imagen PNG y perspectiva CSS. No había un modelo 3D navegable. El modal de membresía usaba otro componente, con botones planos y una consulta de disponibilidad duplicada.

Problemas encontrados:

- La bicicleta tenía fondo rojo, reflejo y plataforma incorporados; al repetirla en el salón se mezclaban con las sombras y plataformas CSS.
- El PNG pesaba 1,415,071 bytes. Se descargaba un único recurso reutilizado, pero excesivo para su tamaño en pantalla.
- Los anchos fijos de las bicicletas y los números pequeños dificultaban la selección en móvil.
- El modal describía una selección en cian, pero avanzaba directamente a confirmar sin mostrarla.
- La barra de continuación se buscaba globalmente en el documento; podía apuntar al selector situado detrás del modal.
- Durante la consulta se podía mostrar un conteo aún no verificado. No había un botón de reintento.

Implementación:

- `BikeRoom.tsx` presenta la escena compartida: instructor, dos filas de 6 y 5 bicicletas, números separados del modelo, marca de selección y símbolos de bloqueo/mantenimiento.
- `BikeSelector.tsx` integra la escena en la página y en el modal compacto. `MembershipBookingModal.tsx` lo reutiliza para packs y suscripciones, manteniendo sus confirmaciones y precios: 1 crédito o incluido.
- `useBikeAvailability.ts` consulta por fecha y horario, cancela solicitudes anteriores, valida respuestas y permite reintentar. La reserva solo puede continuar con disponibilidad comprobada.
- El mapa se adapta al ancho de su contenedor, conserva botones de al menos 44 × 44 px y permite desplazamiento dentro de la escena cuando una pantalla muy estrecha lo requiere. Respeta la preferencia de movimiento reducido.
- Se retiraron los estilos de las dos representaciones sustituidas.

El resultado sigue siendo una representación 2.5D, con imágenes y CSS. Permite elegir el lugar sin incorporar un visor WebGL. Un modelo 3D que se pueda rotar requeriría un archivo de geometría, materiales y otra interacción; queda fuera de esta mejora.

## Compactación de membresías

El modal utiliza un encabezado breve, una escena compacta y un pie separado del área de desplazamiento. El botón Continuar permanece visible desde el inicio, deshabilitado hasta elegir una bici, y no tapa la segunda fila. Seleccionar una bicicleta no desplaza ni cambia la altura del mapa.

La bici **4 es la única favorita**, tanto en membresías como en clase individual. La bici 9 ya no lleva estrella de favorita.

Se verificaron packs y suscripciones en 320×568, 360×640, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1440×900, 1920×1080 y 844×390. En los tamaños verticales y de escritorio se ven las 11 bicis sin desplazamiento horizontal, con objetivos táctiles de al menos 44×44 px. En horizontal de poca altura, el salón se desplaza verticalmente dentro de su área, manteniendo encabezado y botón fuera del mapa.

El script comprueba los límites reales de las bicicletas, el encabezado y el pie para detectar solapamientos, además de comprobar que solo la bici 4 está marcada como favorita.

## Recurso visual

Archivo utilizado: [bike-studio-v2.webp](../public/bike-studio-v2.webp), 320 × 397 px, transparencia alfa, 29,430 bytes (aproximadamente 98% menos que el PNG original). El original se conserva.

Generado con la herramienta integrada `image_gen`, a partir de `public/bike-3d.png`; luego reducido y codificado en WebP con Sharp. Prompt exacto:

```text
Use case: background-extraction
Asset type: transparent spinning bicycle sprite for the RideOn booking seat selector, displayed at 45–110 CSS pixels wide on a dark teal studio floor.
Input images: Image 1 is the edit target, the existing rear three-quarter stationary spinning bicycle.
Primary request: produce a clean refined transparent cutout of this same black stationary spinning bicycle. Remove the entire red background, the mist, the cyan glowing circular platform and all floor reflections. Keep the entire bicycle, its saddle, handlebars, flywheel, pedals and two stabilizer feet intact, preserving its rear three-quarter orientation and geometry. Refine the product render with crisp readable edges, realistic charcoal metal and subtle cyan rim lighting, brighter neutral metal highlights so the frame reads at small size.
Composition: single isolated bicycle centered, tightly framed with about 5 percent transparent padding, no cropping of handlebars or base. True transparent alpha background including gaps inside the frame. No ground plane, no pedestal, no cast shadow, no glow outside the bicycle silhouette, no text, no logo, no watermark. Do not render a checkerboard as background.
```

## Verificación

- `npm run build`: compilación de producción y TypeScript correctos.
- Playwright con Microsoft Edge en modo headless y respuestas de API simuladas: selección por teclado, número/fila y precio de la clase individual, reserva con pack y suscripción, coexistencia de ambos selectores, carga, error/reintento, respuesta inválida, cambio de horario y salón lleno.
- Se comprobó la recuperación ante un conflicto 409 en suscripción: la bici pasa a ocupada y se permite elegir otra.
- Se comprobaron anchos de 320, 375, 768 y 1440 px en la página y 320, 375, 390/1440 px en el modal: botones de al menos 44 px y sin desbordamiento horizontal del selector/modal.
- No se realizaron cobros ni reservas reales. Los resultados y capturas están en [output/bike-selector](../output/bike-selector/).

Capturas: [clase individual](../output/bike-selector/individual-desktop.png), [móvil](../output/bike-selector/individual-mobile.png), [pack](../output/bike-selector/pack.png), [suscripción](../output/bike-selector/subscription.png).

Para repetir las pruebas con Edge instalado, iniciar la compilación local en el puerto 3100 y ejecutar:

```powershell
npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
# En otra terminal:
npm exec --yes --package=@playwright/test -- node scripts/verify-bike-selector.cjs
```

El script admite la variable `BIKE_PREVIEW_URL` para cambiar la URL local. Intercepta las llamadas a API y a servicios externos; genera las capturas y `verification.json`.
