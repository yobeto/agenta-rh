# Solución: Variables de Entorno en Build de Render

## Problema

El frontend está intentando conectarse a `localhost:8000` aunque la variable `NEXT_PUBLIC_API_URL` esté configurada en Render. Esto ocurre porque **Next.js necesita las variables `NEXT_PUBLIC_*` en BUILD TIME**, no en runtime.

## Solución

### Opción 1: Configurar Build Arguments en Render (Recomendado)

Render puede pasar variables como **build arguments** durante el build de Docker:

1. **Ve a tu servicio del frontend en Render**
2. **Ve a "Settings" → "Environment"**
3. **Asegúrate de que la variable esté configurada:**
   ```
   NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com
   ```

4. **IMPORTANTE: Verifica el tipo de servicio:**
   - Si es un **Web Service** con Docker: Render debería pasar automáticamente las variables al build
   - Si es un **Static Site**: Las variables se pasan automáticamente

5. **Haz un nuevo deploy:**
   - Ve a "Manual Deploy" → "Deploy latest commit"
   - O haz un commit nuevo para trigger automático

### Opción 2: Usar Build Command con Variables (Alternativa)

Si Render no está pasando las variables automáticamente, puedes configurar el build command para pasarlas explícitamente:

1. **Ve a "Settings" → "Build & Deploy"**
2. **En "Build Command", usa:**
   ```bash
   NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL npm run build
   ```
   (Esto asegura que la variable esté disponible durante el build)

### Opción 3: Verificar que el Dockerfile esté correcto

El Dockerfile actualizado ahora acepta `NEXT_PUBLIC_API_URL` como build argument:

```dockerfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
```

Esto debería funcionar si Render pasa las variables como build args.

## Verificación

### 1. Verificar en los Logs de Build

Después de hacer un nuevo deploy, revisa los logs del build en Render. Deberías ver:

```
✅ NEXT_PUBLIC_API_URL configurada: https://agenta-rh.onrender.com
```

Si ves:
```
⚠️  ADVERTENCIA: NEXT_PUBLIC_API_URL no está configurada
```

Significa que la variable no se está pasando durante el build.

### 2. Verificar en el Navegador

1. Abre el frontend desplegado
2. Abre la consola del navegador (F12)
3. Busca el log que agregamos:
   ```
   🔍 API_URL actual: https://agenta-rh.onrender.com
   ```

Si ves `localhost:8000`, el build no recibió la variable.

## Pasos Detallados para Render

### Si usas Docker (Web Service):

1. **Configura la variable de entorno:**
   - Dashboard → Tu servicio → Environment
   - Agrega: `NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com`

2. **Render debería pasar automáticamente las variables al build**
   - Si no funciona, verifica que el Dockerfile tenga:
     ```dockerfile
     ARG NEXT_PUBLIC_API_URL
     ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
     ```

3. **Haz un nuevo deploy**

### Si usas Build Command (Static Site o sin Docker):

1. **Configura la variable de entorno** (igual que arriba)

2. **Modifica el Build Command en Render:**
   ```
   NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL npm run build
   ```

3. **Haz un nuevo deploy**

## Troubleshooting

### El build sigue usando localhost

1. **Verifica que la variable esté escrita correctamente:**
   - Sin espacios: `NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com`
   - Sin comillas
   - Sin trailing slash

2. **Verifica los logs del build en Render:**
   - Busca el mensaje del script `build.sh`
   - Si no aparece, la variable no se está pasando

3. **Intenta hacer un "Clear build cache" en Render:**
   - Settings → Clear build cache
   - Luego haz un nuevo deploy

### Render no pasa las variables al build

Si Render no está pasando las variables automáticamente:

1. **Verifica el tipo de servicio:**
   - Web Service con Docker: Debería funcionar automáticamente
   - Static Site: Debería funcionar automáticamente
   - Si no funciona, usa la Opción 2 (modificar Build Command)

2. **Contacta a Render Support:**
   - Puede ser un problema de configuración del servicio
   - O puede necesitar una configuración especial

## Cambios Realizados

1. **Dockerfile actualizado:**
   - Ahora acepta `NEXT_PUBLIC_API_URL` como build argument
   - Usa un script de build que verifica las variables

2. **Script de build (`build.sh`):**
   - Verifica que las variables estén configuradas
   - Muestra advertencias si faltan

3. **Logs de depuración:**
   - El frontend ahora muestra en consola qué URL está usando

## Próximos Pasos

1. ✅ Configura `NEXT_PUBLIC_API_URL` en Render
2. ✅ Haz un nuevo deploy
3. ✅ Verifica los logs del build
4. ✅ Verifica en el navegador que use la URL correcta

