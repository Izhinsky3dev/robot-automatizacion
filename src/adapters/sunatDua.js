/**
 * Adaptador específico para la consulta de DUA en SUNAT (Punto 10).
 *
 * Este es el ÚNICO archivo que sabe detalles concretos del formulario de
 * SUNAT (nombres de campos, URL, cómo leer la respuesta). El motor genérico
 * (browserEngine.js) no conoce nada de esto.
 *
 * Cuando lleguen los robots 2 y 3, se crea un archivo equivalente a este
 * (por ejemplo robotDos.js) con su propia versión de llenarFormulario y
 * extraerResultado, sin tocar el motor ni la cola.
 */

const URL_CONSULTA = 'https://ww3.sunat.gob.pe/aduanas/informli/ildua.htm';

// Posición del código de almacén dentro del array de argumentos que la
// página de SUNAT pasa a document.write(DUA(...)). Confirmada a partir del
// análisis del HTML real (ver documento técnico) — IMPORTANTE: valida este
// número contra la primera respuesta real que obtengas en la Etapa 1, por si
// SUNAT cambia el orden en algún régimen distinto al probado.
const POSICION_CODIGO_ALMACEN = 27;

function crearAdapterSunat(datos) {
  // datos = { regimen, aduana, anio, numero }
  // regimen y aduana deben coincidir EXACTO con el atributo "value" de las
  // opciones del <select> en el HTML real de SUNAT. Ejemplos válidos:
  //   regimen: '40 - Dua Exportacion Provisional'
  //   aduana:  '235'   (235 = Aerea del Callao)

  async function llenarFormulario(page) {
    await page.selectOption('select[name="n"]', datos.regimen);
    await page.selectOption('select[name="codaduana"]', datos.aduana);
    await page.fill('input[name="anoprese"]', datos.anio);
    await page.fill('input[name="numecorre"]', datos.numero);
  }

  async function extraerResultado(page) {
    const html = await page.content();

    // Aísla el contenido entre document.write(DUA( ... ))
    const bloque = html.match(/document\.write\(DUA\(([\s\S]*?)\)\)/);
    if (!bloque) {
      throw new Error('No se encontró el patrón DUA(...) en la respuesta de SUNAT. Puede que la DUA no exista o que SUNAT haya cambiado su formato de respuesta.');
    }

    // Extrae todos los valores entre comillas simples, en orden.
    // (Más robusto que separar por comas, porque algunos campos —como la
    // dirección— podrían contener comas dentro del texto.)
    const valores = [...bloque[1].matchAll(/'([^']*)'/g)].map((m) => m[1].trim());

    const codigoAlmacen = valores[POSICION_CODIGO_ALMACEN];

    if (!codigoAlmacen) {
      throw new Error(`No se pudo leer el código de almacén en la posición ${POSICION_CODIGO_ALMACEN}. Total de valores encontrados: ${valores.length}.`);
    }

    return { codigoAlmacen, totalValoresEncontrados: valores.length };
  }

  return { url: URL_CONSULTA, llenarFormulario, extraerResultado };
}

module.exports = { crearAdapterSunat };
