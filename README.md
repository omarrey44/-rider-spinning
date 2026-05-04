# Rideon Spinning Studio — Mockup

Mockup HTML estático de la landing page para validar dirección visual antes de migrar a Next.js.

## Cómo abrir en VS Code

```bash
code C:\Users\omar_\rideon-mockup
```

Luego abre `index.html` con la extensión **Live Server** (clic derecho → "Open with Live Server") para ver cambios en tiempo real. Si no la tienes, abre el archivo directamente con doble clic.

## Estructura

```
rideon-mockup/
├── index.html    ← marcado de la página (todas las secciones)
├── styles.css    ← estilos (paleta y tokens en :root al inicio)
├── script.js     ← interacciones (filtros, contadores, selector de bikes)
└── README.md
```

## Qué editar para personalizar

| Quiero cambiar... | Archivo | Dónde |
|---|---|---|
| Colores de la marca | `styles.css` | `:root` (líneas 6-15) |
| Headline del hero | `index.html` | `.hero-title` |
| Horarios de clases | `index.html` | sección `#horarios`, cada `<article class="slot">` |
| Cantidad de bikes / posición | `script.js` | objeto `bikeConfig` |
| Bikes ocupadas (mock) | `script.js` | `bikeConfig.taken` |
| Precios | `index.html` | sección `#precios` |
| Logo | `index.html` | `.logo-mark` (reemplaza el SVG por `<img src="logo.png">`) |

## Secciones implementadas

1. Navbar sticky con blur al scroll
2. Hero con trail del conejo + card flotante mostrando salón en vivo
3. Stats band con contadores animados
4. Cómo funciona (3 pasos)
5. Horarios filtrables por intensidad (HIIT / Climb / Endurance / Recovery)
6. Selector visual de bicicletas (24 bikes, 4×6) — clic para seleccionar
7. Instructores (4 cards)
8. Precios (3 planes con destacado)
9. CTA final
10. Footer

## Próximos pasos sugeridos

- [ ] Reemplazar el SVG del logo por la imagen real cuando esté lista
- [ ] Subir foto real del estudio para el hero (reemplazar el `hero-card` placeholder)
- [ ] Validar copy con el cliente
- [ ] Migrar a Next.js + Supabase + Stripe (siguiente fase)
