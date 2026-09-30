# MedEx interface redesign

The `temp` branch uses a navy, ice-blue and coral visual system, with a matching light theme. Space Grotesk sets headlines, DM Sans sets interface text, and IBM Plex Mono sets compact data labels. Theme choice continues to persist in local storage.

Shared navigation, page headers, cards, inputs, tabs, status colors and chart labels apply across all ten screens. The risk screen includes a new priority queue with mobile cards, URL-backed filters, and the existing detail drawer.

## Earth

The locally served Earth textures support terrain normals, ocean reflections, night-side city lights, cloud shading, an independently drifting cloud layer and an atmospheric rim. Facility markers use the risk response's coordinates and most severe status per facility. Demo data is explicitly labeled.

Drag or use arrow keys to orbit, use the zoom buttons or +/- keys to zoom, press Space to pause/resume, and use Home or the reset button to return to India. Wheel scrolling remains available for the page.

Rendering pauses offscreen and in background tabs. Pixel density is capped, texture anisotropy is bounded, and geometry, controls, textures, observers and animation frames are released when unmounted. Reduced-motion users start with rotation paused and can explicitly resume it. WebGL or texture failures show a static Earth while the risk queue remains operational.

The Earth illustration is not live satellite imagery. Nearby facilities can overlap at planetary scale; the priority queue provides individual details.

## Verification

```sh
npm ci
npm run build
npx playwright install chromium
npm run test:ui
```

Browser checks cover all ten routes at desktop and mobile widths, globe animation and controls, filters, the risk drawer, theme switching, keyboard navigation, reduced motion, missing textures and unavailable WebGL. Screenshots are written to the ignored `test-results` directory. Tests use the app's existing demonstration data; they do not validate a live backend.
