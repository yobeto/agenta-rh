# 🔍 Verificación de Conexión Frontend-Backend

## Problema: Frontend no se conecta al Backend

### ✅ PASO 1: Verificar Backend en Render

**URL del Backend:** `https://agenta-rh.onrender.com`

1. Ve a Render → Tu servicio backend (`agenta-rh`)
2. Verifica que el estado sea **"Live"**
3. Abre en el navegador: https://agenta-rh.onrender.com/api/health
   - Debe responder con JSON: `{"status": "ok", ...}`
   - Si no responde, el backend está dormido o tiene problemas

### ✅ PASO 2: Configurar CORS en el Backend

**En Render → Backend → Environment**, asegúrate de tener:

```bash
CORS_ORIGINS=https://agenta-rh-front-end.onrender.com,https://agenta-rh.onrender.com
```

**⚠️ IMPORTANTE:**
- Debe incluir la URL exacta del frontend: `https://agenta-rh-front-end.onrender.com`
- Sin espacios adicionales
- Separado por comas si hay múltiples URLs

**Si quieres permitir todos los orígenes temporalmente (solo para testing):**
```bash
CORS_ORIGINS=*
```

### ✅ PASO 3: Configurar URL del Backend en el Frontend

**En Render → Frontend → Environment**, asegúrate de tener:

```bash
NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com
```

**⚠️ IMPORTANTE:**
- Debe ser la URL exacta del backend
- Sin barra final (`/`)
- Debe empezar con `https://`

### ✅ PASO 4: Verificar Variables Completas

#### Backend (agenta-rh.onrender.com):
```bash
JWT_SECRET_KEY=tu-clave-secreta-de-32-caracteres-minimo
OPENAI_API_KEY=sk-proj-...
CORS_ORIGINS=https://agenta-rh-front-end.onrender.com,https://agenta-rh.onrender.com
ENVIRONMENT=production
```

#### Frontend (agenta-rh-front-end.onrender.com):
```bash
NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com
```

### ✅ PASO 5: Reiniciar Servicios

Después de cambiar variables de entorno:

1. **Backend:** Render → Backend → Manual Deploy (o espera auto-deploy)
2. **Frontend:** Render → Frontend → Manual Deploy (o espera auto-deploy)

### ✅ PASO 6: Verificar en el Navegador

1. Abre: https://agenta-rh-front-end.onrender.com
2. Abre DevTools (F12) → Pestaña **Console**
3. Busca errores como:
   - `CORS policy: No 'Access-Control-Allow-Origin' header`
   - `Failed to fetch`
   - `Network Error`

### 🔧 Solución Rápida si Persiste el Problema

1. **Verificar que el backend responda:**
   ```bash
   curl https://agenta-rh.onrender.com/api/health
   ```

2. **Verificar CORS desde el navegador:**
   - Abre DevTools → Network
   - Intenta hacer login
   - Revisa la petición a `/api/auth/login`
   - Si falla con CORS, el backend no tiene configurado el origen correcto

3. **Verificar logs del backend:**
   - Render → Backend → Logs
   - Busca: `CORS configurado con orígenes permitidos:`
   - Debe mostrar la URL del frontend

4. **Verificar logs del frontend:**
   - Render → Frontend → Logs
   - Busca errores de build o runtime

### 📝 Checklist Final

- [ ] Backend está "Live" en Render
- [ ] Backend responde en `/api/health`
- [ ] `CORS_ORIGINS` incluye la URL del frontend
- [ ] `NEXT_PUBLIC_API_URL` apunta al backend correcto
- [ ] Ambos servicios fueron redeployados después de cambiar variables
- [ ] No hay errores de CORS en la consola del navegador
- [ ] No hay errores de "Failed to fetch" en la consola

### 🆘 Si Nada Funciona

1. **Verifica que ambos servicios estén en la misma cuenta de Render**
2. **Revisa los logs en tiempo real durante una petición**
3. **Prueba con `CORS_ORIGINS=*` temporalmente para aislar el problema**
4. **Verifica que no haya firewalls bloqueando las conexiones**

