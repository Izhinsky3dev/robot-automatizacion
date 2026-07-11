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

## Notas importantes

- `POSICION_CODIGO_ALMACEN` en `sunatDua.js` está en 27 según el análisis
  previo del HTML de SUNAT. Si el resultado no trae el dato esperado, lo
  primero a revisar es ese número contra el `totalValoresEncontrados` que
  imprime la consola.
- `LIMITE_CONCURRENCIA` en `jobQueue.js` está en 2 por defecto. No afecta
  esta prueba individual, pero sí importa cuando haya varias solicitudes
  simultáneas (más relevante una vez desplegado).
