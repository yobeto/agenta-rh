# Troubleshooting - Problemas en Render

## Error: "Failed to fetch" o "ERR_CONNECTION_REFUSED"

### 1. Verificar Variables de Entorno en Render

#### Backend (agenta-rh.onrender.com)

Asegúrate de tener estas variables configuradas:

```bash
# OBLIGATORIAS
JWT_SECRET_KEY=tu-clave-de-32-caracteres-minimo
OPENAI_API_KEY=sk-proj-...
CORS_ORIGINS=https://tu-frontend.onrender.com

# OPCIONALES pero recomendadas
ENVIRONMENT=production
ALLOWED_HOSTS=*.onrender.com,*.inbursa.com
```

**⚠️ IMPORTANTE sobre CORS_ORIGINS:**
- Debe incluir la URL EXACTA de tu frontend (con https://)
- Sin espacios antes o después de las comas
- Ejemplo correcto: `https://agente-rh-frontend.onrender.com`
- Ejemplo incorrecto: `https://agente-rh-frontend.onrender.com ` (espacio al final)

#### Frontend

```bash
NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com
```

### 2. Verificar que el Backend esté Funcionando

Abre en tu navegador:
```
https://agenta-rh.onrender.com/api/health
```

Debe responder:
```json
{"status":"healthy","service":"agente-rh"}
```

Si no responde, el backend no está corriendo correctamente.

### 3. Verificar CORS en los Logs del Backend

En Render, ve a los **Logs** del backend. Deberías ver algo como:

```
CORS configurado con orígenes permitidos: ['https://tu-frontend.onrender.com']
```

Si ves `['http://localhost:3000']`, significa que la variable `CORS_ORIGINS` no se está leyendo correctamente.

### 4. Verificar la URL en el Frontend

Abre la consola del navegador (F12) y verifica:

1. **Network tab**: Las peticiones deben ir a `https://agenta-rh.onrender.com`
2. **Console**: No debe haber errores de CORS como:
   - `Access to fetch at '...' from origin '...' has been blocked by CORS policy`
   - `ERR_CONNECTION_REFUSED`

### 5. Solución Temporal: Permitir Todos los Orígenes

Si necesitas debuggear rápidamente, puedes configurar temporalmente:

**En el backend:**
```bash
CORS_ORIGINS=*
```

⚠️ **Solo para debugging**. En producción, usa orígenes específicos.

### 6. Verificar que las Variables se Aplicaron

Después de cambiar variables de entorno en Render:

1. **Reinicia el servicio** (Render debería hacerlo automáticamente)
2. Espera a que termine el deploy
3. Verifica los logs para confirmar que las variables se leyeron

### 7. Problemas Comunes

#### Problema: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solución:**
- Verifica que `CORS_ORIGINS` incluya la URL exacta del frontend
- Asegúrate de que no haya espacios en la variable
- Reinicia el backend después de cambiar la variable

#### Problema: "ERR_CONNECTION_REFUSED"

**Solución:**
- Verifica que `NEXT_PUBLIC_API_URL` en el frontend apunte a `https://agenta-rh.onrender.com`
- Verifica que el backend esté corriendo (usa `/api/health`)
- Revisa los logs del backend para ver si hay errores de inicio

#### Problema: "Failed to fetch"

**Solución:**
- Puede ser un problema de red o que el backend esté caído
- Verifica que el backend responda en `/api/health`
- Revisa los logs del frontend y backend en Render

### 8. Checklist Final

- [ ] Backend responde en `/api/health`
- [ ] `CORS_ORIGINS` incluye la URL exacta del frontend (sin espacios)
- [ ] `NEXT_PUBLIC_API_URL` apunta a `https://agenta-rh.onrender.com`
- [ ] `JWT_SECRET_KEY` tiene 32+ caracteres
- [ ] `OPENAI_API_KEY` está configurada
- [ ] Ambos servicios se desplegaron correctamente
- [ ] Los logs no muestran errores de CORS

### 9. Contacto y Logs

Si el problema persiste:

1. Revisa los **Logs** en Render (tanto frontend como backend)
2. Busca errores relacionados con:
   - CORS
   - Variables de entorno no encontradas
   - Errores de conexión
3. Copia los logs y revisa los mensajes de error específicos

