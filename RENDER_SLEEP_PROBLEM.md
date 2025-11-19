# Problema: Backend en "Sleep" en Render

## ¿Qué está pasando?

El backend está funcionando correctamente, pero Render pone los servicios gratuitos en **"sleep"** (inactivos) después de **15 minutos de inactividad**.

Cuando el backend está en sleep:
- La primera petición después del sleep puede tardar **30-90 segundos** (o más) en responder
- Durante este tiempo, el backend está "despertando" y Render está iniciando el servicio
- El frontend tiene un timeout de **2 minutos** para dar tiempo al backend de despertar

## Síntomas

1. **Error en el frontend**: "La petición tardó demasiado. El servidor puede estar iniciando..."
2. **Backend responde con 502 Bad Gateway** durante el despertar
3. **Tiempo de respuesta muy alto** (puede llegar a 5+ minutos en casos extremos)

## Soluciones

### Opción 1: Esperar y Reintentar (Gratis)

**Ventajas:**
- No requiere cambios ni costos adicionales
- El backend se despertará automáticamente

**Desventajas:**
- La primera petición después del sleep puede tardar mucho
- Mala experiencia de usuario

**Qué hacer:**
1. Si ves el error, espera 1-2 minutos
2. Intenta hacer login nuevamente
3. El backend debería estar despierto y responder rápidamente

### Opción 2: Servicio "Always On" en Render (Recomendado para Producción)

**Ventajas:**
- El backend nunca entra en sleep
- Respuesta inmediata siempre
- Mejor experiencia de usuario

**Desventajas:**
- Requiere plan de pago en Render (aproximadamente $7/mes por servicio)

**Cómo configurar:**
1. Ve a tu servicio del backend en Render
2. Ve a "Settings" → "Instance Type"
3. Selecciona un plan de pago (no el plan gratuito)
4. El servicio permanecerá siempre activo

### Opción 3: Health Check Endpoint (Mejora la Experiencia)

Puedes configurar un health check en Render para que el servicio se mantenga más activo:

1. Ve a tu servicio del backend en Render
2. Ve a "Settings" → "Health Check Path"
3. Configura: `/api/health`
4. Render hará peticiones periódicas a este endpoint para mantener el servicio activo

**Nota:** Esto no garantiza que el servicio nunca entre en sleep, pero puede ayudar.

### Opción 4: Ping Externo (Alternativa Gratis)

Puedes usar un servicio externo (como UptimeRobot, cron-job.org, etc.) para hacer peticiones periódicas al endpoint `/api/health` cada 10-14 minutos. Esto mantendrá el servicio activo.

**Ejemplo con cron-job.org:**
- URL: `https://agenta-rh.onrender.com/api/health`
- Frecuencia: Cada 10 minutos
- Método: GET

## Cambios Realizados

1. **Timeout aumentado a 2 minutos** en el frontend para dar tiempo al backend de despertar
2. **Mensaje de error mejorado** que explica el problema de Render sleep
3. **Documentación** sobre el problema y soluciones

## Verificación

Para verificar si el backend está en sleep:

```bash
# Primera petición (puede tardar mucho si está en sleep)
time curl https://agenta-rh.onrender.com/api/health

# Segunda petición (debería ser rápida si ya está despierto)
time curl https://agenta-rh.onrender.com/api/health
```

Si la primera tarda mucho y la segunda es rápida, el backend estaba en sleep.

## Recomendación

Para **desarrollo/testing**: Usa la Opción 1 (esperar y reintentar)

Para **producción**: Usa la Opción 2 (servicio Always On) o la Opción 4 (ping externo)

## Notas Adicionales

- El frontend también puede entrar en sleep si está en el plan gratuito
- Si ambos servicios están en sleep, el tiempo de respuesta puede ser aún mayor
- Render tiene un límite de horas gratuitas por mes (750 horas), así que un servicio Always On puede consumir todas las horas rápidamente

