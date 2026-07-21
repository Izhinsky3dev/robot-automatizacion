/**
 * Script de prueba — Etapa 1.
 *
 * Este es el primer contacto REAL con el portal de SUNAT: abre el
 * navegador, llena el formulario con los datos de ejemplo, espera el
 * token de reCAPTCHA v3, envía la consulta y muestra el resultado.
 *
 * Cómo correrlo:
 *   node test.js
 *
 * La primera vez, te recomiendo poner headless: false en la llamada de
 * abajo para VER el navegador mientras trabaja (útil para depurar si
 * algún selector no coincide). Una vez que funcione, vuelve a headless: true.
 */

const { ejecutarConsulta } = require('./src/engine/browserEngine');
const { crearAdapterSunat } = require('./src/adapters/sunatDua');
const { encolar } = require('./src/queue/jobQueue');

async function probarConsultaDua() {
  console.log('Iniciando prueba de consulta a SUNAT...\n');

  const adapter = crearAdapterSunat({
    regimen: '40 - Dua Exportacion Provisional',
    aduana: '235',
    anio: '2026',
    numero: '43163',
  });

  const resultado = await encolar(() =>
    ejecutarConsulta({
      url: adapter.url,
      llenarFormulario: adapter.llenarFormulario,
      extraerResultado: adapter.extraerResultado,
      headless: false, // cámbialo a true una vez que confirmes que funciona
    })
  );

  console.log('Resultado:');
  console.log(JSON.stringify(resultado, null, 2));

  if (resultado.exito) {
    console.log(`\n✅ Código de almacén obtenido: ${resultado.resultado.codigoAlmacen}`);
  } else {
    console.log(`\n❌ Falló la consulta: ${resultado.error}`);
  }
}

probarConsultaDua();
