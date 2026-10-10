# Verificación / Verification

Fecha / Date: 2026-10-10.

## Español

La revisión de interfaz conserva los IDs de las actividades y la versión del progreso. Los respaldos creados antes del rediseño siguen siendo compatibles.

| Área                                | Comprobación                                                                                                                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cálculo, contenido y almacenamiento | 67 pruebas unitarias: soluciones ES/EN, variantes de datos, fórmulas equivalentes, rechazo de constantes y fórmulas incorrectas para las 27 actividades, seguridad, respaldos y puntos.                              |
| Worker                              | Límite de tiempo, terminación y recuperación, respuestas fuera de orden y rechazo de operaciones pendientes ante errores o cierre.                                                                                   |
| Interfaz y juego                    | 69 recorridos: 23 en Chromium, 23 en Firefox y 23 en WebKit. Resolución de las 27 actividades en cada motor, interpretación de casos, pistas, soluciones asistidas e insignias.                                      |
| Persistencia                        | Recarga, cierre del contexto, borradores sin enviar, exportación/importación, respaldos anteriores, archivos inválidos o demasiado grandes y almacenamiento bloqueado.                                               |
| Navegación                          | Selectores ES/EN independientes con teclado, menú móvil con Escape y restauración del foco, enlace para saltar al contenido, historial y filtros de estado excluyentes.                                              |
| Adaptación                          | Inicio, catálogo, casos, progreso y práctica en anchos de 320, 390, 768, 1024 y 1440 px; cuadrícula con desplazamiento interno.                                                                                      |
| Accesibilidad                       | 78 análisis con axe-core: seis pantallas en ambos idiomas, escritorio y móvil, en los tres motores; además, práctica con concepto, pistas, solución y resultado abiertos. Reglas WCAG 2/2.1 A/AA disponibles en axe. |
| Revisión visual                     | Capturas de portada en escritorio y móvil, práctica y vista previa social.                                                                                                                                           |
| Publicación                         | HTTPS, CSP, protección contra incrustación, MIME, metadatos e imagen social; navegación, cambio de idioma, fórmula real y progreso después de recargar en los tres motores.                                          |

Las auditorías automáticas no certifican conformidad completa con WCAG ni sustituyen pruebas con tecnologías de asistencia. WebKit es el motor probado por Playwright; no implica haber probado cada versión de Safari en dispositivos reales.

Correcciones verificadas durante esta revisión: el idioma importado se aplica sin recargar; un borrador deja de aparecer como pendiente; Escape cierra el menú incluso cuando WebKit no enfoca el botón al pulsarlo. El foco inicial se establece antes de pintar la práctica para que no interrumpa las primeras teclas del usuario. Se mejoró el contraste de textos detectados por las auditorías.

## English

Activity IDs and the progress version are unchanged. Backups from before the redesign remain compatible.

The suite contains **67 unit tests and 69 browser journeys**, with 23 journeys per browser engine. It covers all 27 activities, alternate formulas and datasets, required formulas, financial interpretation, hints, assisted solutions, badges, persistence, legacy backups, invalid imports, Worker recovery, keyboard navigation and independent language controls.

Responsive checks cover five widths from 320 to 1440 px. **78 axe-core analyses** cover six screens in both languages at desktop and mobile sizes in all three engines, plus expanded worksheet states. Screenshots receive visual review. Automated accessibility checks do not establish full WCAG conformance or replace assistive-technology testing. Playwright WebKit is not a test of every Safari version or physical Apple device.

Production verification checks security headers, social metadata, navigation, language changes, real formula calculation and persisted progress in Chromium, Firefox and WebKit.

## Ejecutar / Run

```bash
npm ci
npm test
npm run build
npm run test:install
npm run test:e2e
npm run format:check
npm audit
node scripts/verify-deployment.mjs
```

The deployment script defaults to the public demo. Set `SITE_URL` to verify another deployed origin. GitHub Actions repeats installation, unit tests, build and browser journeys on Linux; its browser report is retained for seven days.
