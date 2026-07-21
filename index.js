/**
 * Servidor mínimo para poder desplegar en Cloud Foundry.
 *
 * En esta etapa (Etapa 2) el objetivo NO es integrar todavía con CAP —
 * eso es la Etapa 5. El único objetivo aquí es confirmar que:
 *   1) La app arranca correctamente dentro de Cloud Foundry.
 *   2) Chromium puede ejecutarse ahí (las librerías del sistema están OK).
 *   3) El consumo real de memoria es el esperado.
 *
 * El endpoint /test-sunat es temporal, solo para esta validación manual.
 */

const express = require('express');
const { ejecutarConsulta } = require('./src/engine/browserEngine');
const { crearAdapterSunat } = require('./src/adapters/sunatDua');
const { encolar } = require('./src/queue/jobQueue');

const app = express();
const PORT = process.env.PORT || 3000;

// Cloud Foundry usa esto para saber que la app sigue viva.
app.get('/', (req, res) => {
  res.json({ status: 'ok', mensaje: 'Robot SUNAT - servicio activo' });
});

// Endpoint temporal para validar manualmente que Chromium funciona
// dentro de Cloud Foundry. Se elimina o se reemplaza en la Etapa 5,
// cuando esto se conecte de verdad al backend CAP.
app.get('/test-sunat', async (req, res) => {
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
      headless: true,
    })
  );

  res.json(resultado);
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
