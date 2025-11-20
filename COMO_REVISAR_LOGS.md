# 📋 Cómo Revisar los Logs del Backend

## 🚀 En Render (Producción)

### Opción 1: Dashboard de Render
1. Ve a https://dashboard.render.com
2. Inicia sesión en tu cuenta
3. Selecciona el servicio del backend (`agenta-rh` o similar)
4. Haz clic en la pestaña **"Logs"** en el menú lateral
5. Los logs aparecen en tiempo real

### Opción 2: Render CLI (si lo tienes instalado)
```bash
# Instalar Render CLI (si no lo tienes)
npm install -g render-cli

# Ver logs en tiempo real
render logs --service <nombre-del-servicio>
```

### Opción 3: Desde el navegador
- Los logs también están disponibles en la URL del servicio + `/logs` (si Render lo permite)

## 💻 Localmente

### Si estás corriendo con Docker:
```bash
cd agent-rh
docker-compose logs -f backend
```

### Si estás corriendo directamente con Python:
```bash
cd agent-rh/backend
python -m uvicorn main:app --reload
# Los logs aparecen directamente en la terminal
```

### Ver logs de un archivo específico (si guardas logs en archivo):
```bash
tail -f backend/logs/app.log
```

## 🔍 Qué buscar en los logs

Cuando veas el error, busca estas líneas:

1. **Error de parsing JSON:**
   ```
   ❌ ERROR: No se pudo parsear respuesta de IA para candidato: ...
   📄 Respuesta completa de IA (primeros 3000 chars):
   ```

2. **KeyError específico:**
   ```
   ❌ KeyError analizando candidato ...
   📋 Traceback completo del KeyError:
   ```

3. **Respuesta de IA completa:**
   - Busca la sección que dice "Respuesta completa de IA"
   - Esto te mostrará exactamente qué devolvió la IA

## 📊 Niveles de Log

- **ERROR**: Errores críticos (aparecen siempre)
- **WARNING**: Advertencias (aparecen siempre)
- **INFO**: Información general (aparecen siempre)
- **DEBUG**: Detalles de debugging (solo si `LOG_LEVEL=DEBUG`)

## ⚙️ Cambiar nivel de log

En Render, agrega esta variable de entorno:
- **Nombre**: `LOG_LEVEL`
- **Valor**: `DEBUG` (para ver todos los detalles)

Esto mostrará logs más detallados incluyendo tracebacks completos.

