/**
 * Cola de trabajos con límite de concurrencia.
 *
 * Compartida por todos los robots (SUNAT y los que se agreguen después).
 * Evita que, si llegan varias solicitudes al mismo tiempo, se abran
 * demasiados navegadores Chromium en simultáneo y se agote la memoria.
 */

const cola = [];
let enEjecucion = 0;

// Ajusta este número según la memoria real disponible en BTP.
// Cada navegador headless activo consume aprox. 512MB-1GB.
const LIMITE_CONCURRENCIA = 2;

function encolar(trabajo) {
  return new Promise((resolve, reject) => {
    cola.push({ trabajo, resolve, reject });
    procesarSiguiente();
  });
}

function procesarSiguiente() {
  if (enEjecucion >= LIMITE_CONCURRENCIA || cola.length === 0) return;

  const { trabajo, resolve, reject } = cola.shift();
  enEjecucion++;

  trabajo()
    .then(resolve)
    .catch(reject)
    .finally(() => {
      enEjecucion--;
      procesarSiguiente();
    });
}

function estado() {
  return { enEjecucion, enEspera: cola.length, limite: LIMITE_CONCURRENCIA };
}

module.exports = { encolar, estado };
