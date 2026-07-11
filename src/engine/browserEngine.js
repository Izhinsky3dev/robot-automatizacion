const { chromium } = require('playwright');

/**
 * Motor genérico de automatización.
 *
 * Este archivo NO sabe nada de SUNAT ni de ningún sitio en particular.
 * Recibe funciones específicas (llenarFormulario, extraerResultado) que le
 * entrega el adaptador correspondiente (ver src/adapters/).
 *
 * Responsabilidades:
 *  - Abrir y cerrar el navegador de forma segura, incluso si algo falla.
 *  - Aplicar un timeout general a toda la operación.
 *  - Devolver siempre una respuesta estructurada (nunca lanzar un error suelto).
 */

async function ejecutarConsulta({ url, llenarFormulario, extraerResultado, timeoutMs = 25000, headless = true }) {
  const browser = await chromium.launch({ headless });
  let page;

  try {
    const context = await browser.newContext({
      // Un user-agent de Chrome "normal" (sin la palabra Headless), para
      // reducir la probabilidad de que el WAF de SUNAT distinga el tráfico
      // automatizado del de un navegador de escritorio común.
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'es-PE',
    });

    // Oculta la señal más común que delata a un navegador automatizado.
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    page = await context.newPage();
    page.setDefaultTimeout(timeoutMs);

    // Útil para depurar: descomenta para ver los mensajes de consola
    // del navegador (por ejemplo, errores de JavaScript de la página).
    // page.on('console', (msg) => console.log('[navegador]', msg.text()));

    await page.goto(url, { waitUntil: 'load' });

    // El adaptador llena los campos específicos del formulario de ese sitio.
    await llenarFormulario(page);

    // Dispara el envío del formulario. En el caso de SUNAT, el botón
    // "Consultar" ejecuta una función JavaScript (enviar()) que internamente
    // espera a que se genere el token de reCAPTCHA v3 antes de enviar el
    // formulario y navegar a la página de resultado — por eso esperamos la
    // navegación en paralelo al clic, con margen de tiempo suficiente.
    await Promise.all([
      page.waitForNavigation({ timeout: timeoutMs }),
      page.click('input[value="Consultar"]'),
    ]);

    // El adaptador sabe cómo leer el resultado de la página de respuesta.
    const resultado = await extraerResultado(page);

    return { exito: true, resultado };
  } catch (error) {
    // Captura de pantalla y título de la página en el momento del fallo,
    // para poder diagnosticar sin tener que adivinar qué se sirvió.
    if (page) {
      try {
        await page.screenshot({ path: 'debug-error.png', fullPage: true });
        console.log('🔍 Captura de depuración guardada en debug-error.png');
        console.log('🔍 Título de la página al fallar:', await page.title());
      } catch (screenshotError) {
        // Si ni siquiera se pudo tomar la captura, seguimos sin bloquear el flujo.
      }
    }
    return { exito: false, error: error.message };
  } finally {
    await browser.close();
  }
}

module.exports = { ejecutarConsulta };
