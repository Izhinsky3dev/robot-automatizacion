# Robot de automatización — SUNAT (Punto 10)

## Estructura del proyecto

```
robot-automatizacion/
  src/
    engine/
      browserEngine.js   ← Motor genérico (reutilizable por todos los robots)
    adapters/
      sunatDua.js         ← Lógica específica de SUNAT (único archivo que cambia por robot)
    queue/
      jobQueue.js         ← Cola de trabajos con límite de concurrencia
  test.js                 ← Script de prueba (punto de entrada)
  package.json
```

## Pasos para correrlo en tu máquina (VS Code)

1. Abre esta carpeta en VS Code.
2. Instala las dependencias:
   ```
   npm install
   npx playwright install chromium
   ```
3. Corre la prueba:
   ```
   node test.js
   ```
   (o `npm test`)

La primera vez, el script abre el navegador de forma VISIBLE (`headless: false`
en `test.js`) para que puedas ver exactamente qué está haciendo. Si todo
funciona bien, cambia esa línea a `headless: true` antes de subirlo a BAS.

## Qué esperar en la consola

Si todo sale bien, verás algo como:

```
Resultado:
{
  "exito": true,
  "resultado": {
    "codigoAlmacen": "4372",
    "totalValoresEncontrados": 47
  }
}

✅ Código de almacén obtenido: 4372
```

Si algo falla, el mensaje de error te dirá en qué paso ocurrió (selector no
encontrado, timeout, DUA no encontrada, etc.) — no debería nunca "colgarse"
sin explicación, gracias al timeout configurado en el motor.

## Próximos pasos (después de que esta prueba funcione)

1. Cambiar `headless: false` a `headless: true` en `test.js`.
2. Probar con más casos: una DUA inexistente, un año distinto, etc.
3. Subir el proyecto a BAS (mismo código, sin cambios) y repetir la prueba ahí.
4. Recién después de validado en BAS, se pasa a la Etapa 3 del cronograma:
   desplegar en Cloud Foundry.

## Etapa 2 — Desplegar en Cloud Foundry (primero en tu propio trial)

Antes de tocar el subaccount real de SAASA, prueba este despliegue en tu
propia cuenta trial de BTP. No hay ningún riesgo en probar ahí.

1. Instala el CLI de Cloud Foundry si no lo tienes:
   https://docs.cloudfoundry.org/cf-cli/install-go-cli.html

2. Conéctate a tu trial:
   ```
   cf login -a https://api.cf.us10-001.hana.ondemand.com
   ```
   (ajusta el endpoint al que te muestra tu propio Cockpit, en
   Subaccount → Overview → Cloud Foundry Environment → API Endpoint)

3. Despliega:
   ```
   cf push
   ```
   Esto usa el `manifest.yml` incluido en el proyecto.

4. Qué observar durante el despliegue:
   - Que el `apt-buildpack` instale las librerías del `Aptfile` sin errores.
   - Que `npm install` corra bien (incluye la descarga de Chromium vía el
     script `postinstall`).
   - Que la app arranque y quede en estado `running`.

5. Una vez desplegada, prueba el endpoint temporal de validación:
   ```
   curl https://robot-sunat-<algo-generado>.cfapps.us10-001.hana.ondemand.com/test-sunat
   ```
   (la URL exacta te la da `cf push` al terminar, o `cf apps`)

6. Revisa el consumo real de memoria:
   ```
   cf app robot-sunat
   ```

7. Si algo fallara por librerías faltantes de Chromium, el error en los
   logs (`cf logs robot-sunat --recent`) generalmente menciona el nombre
   del archivo `.so` que falta — se agrega al `apt.yml` y se vuelve a
   desplegar.

**Importante:** el endpoint `/test-sunat` es solo para esta validación
manual de la Etapa 2. Se reemplaza en la Etapa 5 por la integración real
con el backend CAP.


## Notas importantes

- `POSICION_CODIGO_ALMACEN` en `sunatDua.js` está en 27 según el análisis
  previo del HTML de SUNAT. Si el resultado no trae el dato esperado, lo
  primero a revisar es ese número contra el `totalValoresEncontrados` que
  imprime la consola.
- `LIMITE_CONCURRENCIA` en `jobQueue.js` está en 2 por defecto. No afecta
  esta prueba individual, pero sí importa cuando haya varias solicitudes
  simultáneas (más relevante una vez desplegado).
