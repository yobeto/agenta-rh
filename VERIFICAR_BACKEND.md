# Verificar Backend en Render

Este documento explica cómo verificar que el backend esté funcionando correctamente en Render.

## URL del Backend
```
https://agenta-rh.onrender.com
```

## Métodos de Verificación

### 1. Usando el Script Automático

Ejecuta el script de verificación:

```bash
cd agent-rh
./verify_backend.sh
```

O especifica una URL diferente:

```bash
BACKEND_URL=https://tu-backend.onrender.com ./verify_backend.sh
```

### 2. Verificación Manual con cURL

#### Verificar endpoint raíz
```bash
curl https://agenta-rh.onrender.com/
```

**Respuesta esperada:**
```json
{
  "message": "agente-rh API",
  "version": "1.0.0",
  "purpose": "Asistente de preselección de candidatos - Apoyo a decisiones humanas"
}
```

#### Verificar endpoint de salud
```bash
curl https://agenta-rh.onrender.com/api/health
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "service": "agente-rh"
}
```

#### Verificar autenticación (login)
```bash
curl -X POST https://agenta-rh.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2024!"}'
```

**Respuesta esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "username": "admin",
    "email": "admin@inbursa.com",
    "role": "admin",
    "department": "RH"
  }
}
```

### 3. Verificación en el Navegador

Abre estos enlaces en tu navegador:

- **Endpoint raíz:** https://agenta-rh.onrender.com/
- **Endpoint de salud:** https://agenta-rh.onrender.com/api/health

Ambos deberían mostrar JSON válido.

### 4. Verificar desde el Frontend

Si el frontend está desplegado, intenta hacer login. Si funciona, el backend está operativo.

## Códigos de Estado HTTP

- **200 OK**: Backend funcionando correctamente
- **404 Not Found**: Endpoint no existe o URL incorrecta
- **500 Internal Server Error**: Error en el servidor (revisa logs en Render)
- **503 Service Unavailable**: Servicio no disponible (puede estar iniciando)

## Solución de Problemas

### Backend no responde

1. **Verifica que el servicio esté activo en Render:**
   - Ve al dashboard de Render
   - Confirma que el servicio esté "Live" (no "Paused" o "Failed")

2. **Revisa los logs en Render:**
   - Ve a la sección "Logs" del servicio
   - Busca errores de inicio o runtime

3. **Verifica las variables de entorno:**
   - `JWT_SECRET_KEY` debe estar configurada
   - `OPENAI_API_KEY` debe estar configurada
   - `CORS_ORIGINS` debe incluir la URL del frontend

### Backend responde pero el login falla

1. **Verifica las credenciales:**
   - Usuario: `admin`
   - Contraseña: `Admin@2024!`

2. **Verifica que `JWT_SECRET_KEY` esté configurada:**
   - Debe tener al menos 32 caracteres
   - Si no está configurada, el backend usará una clave por defecto (no recomendado para producción)

### Backend responde lentamente

- Render puede poner servicios inactivos en "sleep" después de 15 minutos de inactividad
- La primera petición después del sleep puede tardar 30-60 segundos
- Considera usar un servicio "Always On" en Render (requiere plan de pago)

## Endpoints Disponibles

| Endpoint | Método | Descripción | Autenticación |
|----------|--------|-------------|---------------|
| `/` | GET | Información de la API | No |
| `/api/health` | GET | Estado de salud | No |
| `/api/auth/login` | POST | Iniciar sesión | No |
| `/api/auth/me` | GET | Información del usuario actual | Sí |
| `/api/auth/logout` | POST | Cerrar sesión | Sí |
| `/api/auth/create-user` | POST | Crear nuevo usuario | Admin |
| `/api/analyze` | POST | Analizar candidatos | Sí |
| `/api/chat` | POST | Chat con el asistente | Sí |
| `/api/candidates/action` | POST | Registrar acción de candidato | Sí |
| `/api/audit/log` | GET | Obtener bitácora | Admin |

## Notas

- El backend puede tardar unos segundos en responder si ha estado inactivo (Render "cold start")
- Los endpoints protegidos requieren un token JWT en el header `Authorization: Bearer <token>`
- El token expira después de 24 horas (configurable en `auth_service.py`)

