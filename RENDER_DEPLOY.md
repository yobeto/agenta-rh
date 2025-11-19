# Guía de Despliegue en Render

> 📋 **Ver también:** `RENDER_ENV_VARIABLES.md` para la lista completa de variables de entorno

## Backend (Ya desplegado)
✅ Backend en: https://agenta-rh.onrender.com

## Frontend - Configuración para Render

### 1. Variables de Entorno en Render

Cuando despliegues el frontend en Render, configura estas variables de entorno:

```
NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com
```

### 2. Configuración del Backend (CORS)

Asegúrate de que el backend en Render tenga configurado CORS para aceptar peticiones del frontend:

**Variable de entorno en el backend:**
```
CORS_ORIGINS=https://tu-frontend.onrender.com,https://agenta-rh.onrender.com
```

O si quieres permitir cualquier origen del frontend:
```
CORS_ORIGINS=*
```

### ⚠️ Variables Críticas del Backend

Asegúrate de que el backend tenga configuradas estas variables:

```bash
# OBLIGATORIO: JWT Secret Key (32+ caracteres)
JWT_SECRET_KEY=tu-clave-secreta-generada

# OBLIGATORIO: API Key de OpenAI (o otro proveedor)
OPENAI_API_KEY=sk-proj-...

# OBLIGATORIO: CORS Origins (incluir URL del frontend)
CORS_ORIGINS=https://tu-frontend.onrender.com
```

**Ver `RENDER_ENV_VARIABLES.md` para la lista completa.**

### 3. Build Command en Render

Para el frontend en Render, usa:
```
npm install && npm run build
```

### 4. Start Command en Render

```
npm start
```

### 5. Verificaciones

1. **Backend funcionando:**
   - Verifica: https://agenta-rh.onrender.com/api/health
   - Debe responder: `{"status":"healthy","service":"agente-rh"}`

2. **CORS configurado:**
   - El backend debe aceptar peticiones del dominio del frontend
   - Verifica que la variable `CORS_ORIGINS` incluya la URL del frontend

3. **Frontend:**
   - Configura `NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com`
   - El frontend usará esta URL para todas las peticiones al backend

### 6. Archivos Necesarios

El frontend ya está configurado para usar `process.env.NEXT_PUBLIC_API_URL` en:
- `frontend/lib/api.ts`
- `frontend/contexts/AuthContext.tsx`

No necesitas cambiar código, solo configurar la variable de entorno en Render.

### 7. Notas Importantes

- Las variables de entorno que empiezan con `NEXT_PUBLIC_` son accesibles en el cliente
- Después de configurar la variable, Render reconstruirá automáticamente
- Si cambias la variable, necesitas hacer un nuevo deploy

