# Solución: Error de Conexión con el Backend

## Problema
El frontend muestra el error: **"No se pudo conectar con el servidor. Verifica que el backend esté funcionando."**

Esto ocurre porque el frontend está intentando conectarse a `http://localhost:8000` en lugar de `https://agenta-rh.onrender.com`.

## Causa
Las variables de entorno `NEXT_PUBLIC_*` en Next.js se inyectan en **BUILD TIME** (cuando se construye la aplicación), no en runtime. Si el frontend fue desplegado antes de configurar la variable `NEXT_PUBLIC_API_URL` en Render, seguirá usando el valor por defecto (`localhost:8000`).

## Solución

### Paso 1: Verificar Variable de Entorno en Render

1. Ve al dashboard de Render: https://dashboard.render.com
2. Selecciona tu servicio del **frontend** (no el backend)
3. Ve a la sección **"Environment"** o **"Environment Variables"**
4. Verifica que exista la variable:
   ```
   NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com
   ```

### Paso 2: Configurar la Variable (si no existe)

1. En la sección de **Environment Variables** del frontend en Render
2. Haz clic en **"Add Environment Variable"**
3. Agrega:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://agenta-rh.onrender.com`
4. Haz clic en **"Save Changes"**

### Paso 3: Hacer un Nuevo Deploy

**IMPORTANTE**: Después de agregar o modificar `NEXT_PUBLIC_API_URL`, debes hacer un **nuevo deploy** para que la variable se inyecte en el build.

#### Opción A: Deploy Manual
1. En el dashboard de Render, ve a tu servicio del frontend
2. Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**
3. Espera a que el build termine (puede tardar 5-10 minutos)

#### Opción B: Deploy Automático (si tienes Git conectado)
1. Haz un commit vacío o modifica cualquier archivo:
   ```bash
   git commit --allow-empty -m "Trigger rebuild with NEXT_PUBLIC_API_URL"
   git push
   ```
2. Render detectará el cambio y hará un deploy automático

### Paso 4: Verificar que Funcionó

1. Una vez que el deploy termine, abre tu frontend en el navegador
2. Abre la consola del navegador (F12 → Console)
3. Deberías ver un log que muestra la URL del backend
4. Intenta hacer login con:
   - Usuario: `admin`
   - Contraseña: `Admin@2024!`

Si aún ves el error, verifica:
- Que el backend esté funcionando: https://agenta-rh.onrender.com/api/health
- Que la variable de entorno esté correctamente escrita (sin espacios, sin comillas)
- Que hayas esperado a que el deploy termine completamente

## Verificación Rápida

Ejecuta este comando para verificar que el backend esté funcionando:

```bash
curl https://agenta-rh.onrender.com/api/health
```

Deberías ver:
```json
{"status":"healthy","service":"agente-rh"}
```

## Notas Importantes

1. **No uses `.env.local` en producción**: Este archivo no se sube a Render y solo es para desarrollo local.

2. **Las variables `NEXT_PUBLIC_*` son públicas**: Se incluyen en el bundle de JavaScript que se envía al navegador. No uses estas variables para secretos.

3. **Reconstrucción necesaria**: Cada vez que cambies `NEXT_PUBLIC_API_URL`, debes hacer un nuevo deploy. Render no puede cambiar estas variables en runtime.

4. **Tiempo de deploy**: El deploy puede tardar 5-10 minutos. Sé paciente.

## Troubleshooting

### El error persiste después del deploy

1. **Verifica los logs del build en Render**:
   - Ve a tu servicio del frontend en Render
   - Haz clic en "Logs"
   - Busca errores durante el build

2. **Verifica la consola del navegador**:
   - Abre F12 → Console
   - Busca el log que muestra la URL del backend
   - Si dice `localhost:8000`, la variable no se configuró correctamente

3. **Verifica que el backend esté activo**:
   - Render puede poner servicios inactivos en "sleep"
   - La primera petición después del sleep puede tardar 30-60 segundos
   - Intenta hacer login nuevamente después de esperar

### El frontend sigue usando localhost

1. Verifica que la variable esté escrita exactamente así:
   ```
   NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com
   ```
   (Sin espacios, sin comillas, sin trailing slash)

2. Verifica que hayas hecho un nuevo deploy después de configurar la variable

3. Limpia la caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)

## Comandos Útiles

```bash
# Verificar backend
curl https://agenta-rh.onrender.com/api/health

# Verificar login
curl -X POST https://agenta-rh.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}'

# Usar el script de verificación
cd agent-rh
./verify_backend.sh
```

