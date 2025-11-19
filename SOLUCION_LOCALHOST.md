# Solución: Frontend sigue apuntando a localhost en Render

## 🔴 Problema

El frontend desplegado en Render sigue intentando conectarse a `http://localhost:8000` en lugar de `https://agenta-rh.onrender.com`.

## 🔍 Causa

En Next.js, las variables de entorno que empiezan con `NEXT_PUBLIC_` se **inyectan en tiempo de build**, no en runtime. Esto significa:

1. Si configuraste la variable **después** de hacer el build, el código seguirá usando el valor por defecto
2. El build se hace con las variables de entorno disponibles en ese momento
3. Cambiar la variable después del build **NO** actualiza el código ya compilado

## ✅ Solución

### Paso 1: Verificar que la variable esté configurada ANTES del build

En Render, para el servicio del **frontend**:

1. Ve a **Environment** (Variables de Entorno)
2. Verifica que tengas:
   ```
   NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com
   ```
3. **IMPORTANTE**: La variable debe estar configurada **ANTES** de que Render haga el build

### Paso 2: Forzar un nuevo build

Después de configurar la variable:

1. En Render, ve a tu servicio del frontend
2. Haz clic en **Manual Deploy** → **Deploy latest commit**
3. O simplemente **reinicia el servicio** (Render reconstruirá automáticamente)

### Paso 3: Verificar en los logs del build

Durante el build, deberías ver en los logs algo como:

```
> next build
...
Creating an optimized production build...
...
```

Si la variable está configurada, Next.js la inyectará durante este proceso.

### Paso 4: Verificar en el navegador

1. Abre la consola del navegador (F12)
2. Deberías ver logs como:
   ```
   🔧 AuthContext - API_URL: https://agenta-rh.onrender.com
   🔧 AuthContext - NEXT_PUBLIC_API_URL: https://agenta-rh.onrender.com
   ```
3. Si ves `http://localhost:8000`, significa que el build se hizo sin la variable

### Paso 5: Usar el componente DebugInfo

He agregado un componente `DebugInfo` que:
- Muestra un **warning rojo** en producción si detecta que está usando localhost
- Muestra información de debug en desarrollo
- Te ayuda a identificar el problema rápidamente

## 🛠️ Verificación Rápida

### En Render (Frontend):

1. **Variables de Entorno:**
   - ✅ `NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com`

2. **Build Logs:**
   - Busca si hay algún error relacionado con variables de entorno
   - Verifica que el build se completó exitosamente

3. **Runtime Logs:**
   - Abre la consola del navegador en tu app desplegada
   - Deberías ver los logs con 🔧 mostrando la URL correcta

### En el Navegador:

1. Abre la consola (F12)
2. Busca los logs que empiezan con 🔧
3. Verifica que `API_URL` sea `https://agenta-rh.onrender.com`

## ⚠️ Errores Comunes

### Error 1: Variable configurada después del build
**Síntoma:** El código sigue usando localhost  
**Solución:** Haz un nuevo deploy después de configurar la variable

### Error 2: Variable con espacios o caracteres especiales
**Síntoma:** La variable no se lee correctamente  
**Solución:** Asegúrate de que no haya espacios:
```
✅ CORRECTO: NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com
❌ INCORRECTO: NEXT_PUBLIC_API_URL = https://agenta-rh.onrender.com
```

### Error 3: Variable en el lugar incorrecto
**Síntoma:** La variable está en el backend en lugar del frontend  
**Solución:** La variable `NEXT_PUBLIC_API_URL` debe estar en el **servicio del frontend**, no del backend

## 📋 Checklist Final

- [ ] Variable `NEXT_PUBLIC_API_URL` configurada en el **frontend** de Render
- [ ] Valor: `https://agenta-rh.onrender.com` (sin espacios)
- [ ] Se hizo un nuevo deploy después de configurar la variable
- [ ] Los logs del build muestran que el build se completó
- [ ] La consola del navegador muestra la URL correcta (no localhost)
- [ ] El componente DebugInfo no muestra el warning rojo

## 🆘 Si aún no funciona

1. **Verifica los logs del build en Render:**
   - ¿Se completó el build exitosamente?
   - ¿Hay algún error relacionado con variables de entorno?

2. **Verifica la consola del navegador:**
   - ¿Qué URL muestra el log con 🔧?
   - ¿Hay errores de CORS o conexión?

3. **Verifica que el backend esté funcionando:**
   - Abre: `https://agenta-rh.onrender.com/api/health`
   - Debe responder: `{"status":"healthy","service":"agente-rh"}`

4. **Contacta con los logs:**
   - Copia los logs del build de Render
   - Copia los logs de la consola del navegador
   - Esto ayudará a identificar el problema exacto

