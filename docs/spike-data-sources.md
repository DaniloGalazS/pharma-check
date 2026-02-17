# SPIKE: Fuentes de datos — Hallazgos

> PRO-50 + PRO-51 | Research & Architecture Milestone

## Resumen ejecutivo

| Fuente | Estrategia | Dificultad | Frecuencia | Auth |
|--------|-----------|-----------|------------|------|
| **MINSAL Farmanet** | API directa (FHIR) | Media | Tiempo real | OAuth 2 (registro formal) |
| **Tu Farmacia MINSAL** | Scraping | Media-Alta | Mensual | Ninguna |
| **Cruz Verde** | Playwright | Alta | Tiempo real | Ninguna |
| **Salcobrand** | Playwright | Alta | Tiempo real | Ninguna |
| **Ahumada** | Playwright | Alta | Tiempo real | Ninguna |
| **Dr. Simi** | Playwright | Media-Alta | Tiempo real | Ninguna |
| **datos.gob.cl** | API directa (CKAN) | Baja | Periódica | Ninguna |

---

## 1. MINSAL Farmanet API (midas.minsal.cl)

**Qué entrega:** Ubicaciones de farmacias, farmacias de turno, horarios, georreferencias.

**Arquitectura:** FHIR (HL7 Fast Healthcare Interoperability Resources), compatible con estándares internacionales. Partnership con Google Cloud.

**Autenticación:** OAuth 2. Requiere registro en el portal de desarrolladores:
- Portal: https://devportal.minsal.cl/
- Credenciales: https://credenciales-devportal.minsal.cl/
- Flujo: Registro → Seleccionar productos → Recibir credenciales → Token OAuth 2

**Recursos FHIR disponibles:**
- `Location` — datos físicos de la farmacia (dirección, georreferencia)
- `Organization` — cadena/entidad de la farmacia
- `HealthcareService` — servicios (turno, horario)

**Recomendación:** Usar como fuente principal de ubicaciones y turnos. No entrega precios.

---

## 2. Tu Farmacia MINSAL (tufarmacia.gob.cl)

**Qué entrega:** Catálogo de precios oficiales (~11,726 medicamentos), farmacia más barata por producto.

**API pública:** No existe API documentada. El sitio es un comparador web.

**Estrategia:** Scraping con Playwright + análisis de Network tab para detectar endpoints internos.

**Frecuencia de actualización:** Mensual (datos de SERNAC e ISP).

**Recomendación:** Sincronizar mensualmente. Alta prioridad por cobertura amplia y datos oficiales.

---

## 3. Cruz Verde (cruzverde.cl)

**Tecnología detectada:** Kendo UI, jQuery, Cloudflare (confirmado).

**Anti-bot:** Cloudflare WAF. Requiere técnicas modernas de evasión.

**Estrategia:**
1. Playwright con modo headless desactivado o stealth mode
2. Inspeccionar Network tab para detectar endpoints internos (JSON)
3. Rotación de IPs si hay rate limiting

**Riesgo:** Alto. Cloudflare puede bloquear bots.

---

## 4. Salcobrand (salcobrand.cl)

**Tecnología detectada:** Cloudflare Rocket Loader, reCAPTCHA, Amazon CloudFront.

**Anti-bot:** Cloudflare + reCAPTCHA activo.

**Estrategia:** Igual que Cruz Verde, más posible integración con servicio de resolución de CAPTCHA (2captcha, anti-captcha).

**Riesgo:** Alto.

---

## 5. Farmacias Ahumada (farmaciasahumada.cl)

**Tecnología detectada:** PHP, Queue-it (sistema de gestión de cola de usuarios).

**Anti-bot:** Queue-it puede identificar bots por comportamiento.

**Estrategia:** Playwright con delays aleatorios y simulación de comportamiento humano.

**Riesgo:** Medio-Alto.

---

## 6. Dr. Simi (drsimi.cl)

**Qué entrega:** Precios y stock en tiempo real. App móvil disponible.

**Anti-bot:** Menor que las cadenas anteriores (no se detectó Cloudflare).

**Estrategia alternativa:** Reverse engineering de la API de la app móvil (más estable que scraping web).

**Riesgo:** Medio.

---

## 7. datos.gob.cl

**Qué entrega:** Directorio de farmacias (nombre, dirección, georreferencia, horario). Sin precios.

**API:** CKAN estándar, sin autenticación.

**Endpoint base:** `https://datos.gob.cl/api/3/action/`

**Recomendación:** Usar como seed inicial del catálogo de farmacias. Bajo riesgo.

---

## Plan de implementación de scrapers (Milestone 2)

### Orden recomendado:
1. `datos.gob.cl` — seed del directorio de farmacias
2. MINSAL Farmanet API — ubicaciones y turnos
3. Tu Farmacia MINSAL — catálogo de precios oficiales
4. Dr. Simi — menor protección anti-bot
5. Cruz Verde / Salcobrand / Ahumada — requieren más trabajo de evasión

### Stack técnico:
- **Playwright** para todos los scrapers (ya en el stack del proyecto)
- **`playwright-extra` + `puppeteer-extra-plugin-stealth`** para evasión de Cloudflare
- Estructura: un archivo por cadena en `src/lib/scrapers/`
- Interfaz común: `export async function scrape(): Promise<ScrapedPrice[]>`

### Consideraciones legales:
- Los ToS de las farmacias privadas generalmente prohíben scraping automatizado
- Evaluar si las APIs internas (JSON) son más estables que scraping de HTML
- Tu Farmacia MINSAL es datos públicos del gobierno, sin restricciones

---

## Referencias
- [MINSAL DevPortal](https://devportal.minsal.cl/)
- [GitHub: listado-apis-publicas-en-chile](https://github.com/juanbrujo/listado-apis-publicas-en-chile)
- [datos.gob.cl — Farmacias](https://datos.gob.cl/dataset?tags=farmacias)
- [MINSAL FHIR Implementation](https://packages.fhir.org/packages/hl7.fhir.cl.minsal.nid/0.4.8)
