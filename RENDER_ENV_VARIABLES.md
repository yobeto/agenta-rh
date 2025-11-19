# Variables de Entorno para Render

## 🔴 BACKEND (agenta-rh.onrender.com)

### Variables OBLIGATORIAS

```bash
# JWT - CRÍTICO: Debe tener al menos 32 caracteres
JWT_SECRET_KEY=tu-clave-secreta-super-larga-y-aleatoria-minimo-32-caracteres

# Generar una clave segura:
# python -c 'import secrets; print(secrets.token_urlsafe(32))'

# API Keys de IA (al menos una es necesaria para que funcione)
OPENAI_API_KEY=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
# OPCIONAL: Si quieres usar otros proveedores
# ANTHROPIC_API_KEY=tu-clave-anthropic
# GOOGLE_API_KEY=tu-clave-google
```

### Variables OPCIONALES (con valores por defecto)

```bash
# Entorno
ENVIRONMENT=production

# CORS - IMPORTANTE: Agrega la URL de tu frontend
CORS_ORIGINS=https://tu-frontend.onrender.com,https://agenta-rh.onrender.com
# O temporalmente para desarrollo:
# CORS_ORIGINS=*

# Trusted Hosts (solo si ENVIRONMENT=production)
ALLOWED_HOSTS=*.inbursa.com,agenta-rh.onrender.com

# JWT Expiration (por defecto: 480 minutos = 8 horas)
JWT_EXPIRE_MINUTES=480

# Modelo de IA por defecto
DEFAULT_AI_MODEL=gpt-4
```

### Resumen Backend

**Mínimo necesario:**
- ✅ `JWT_SECRET_KEY` (generar una clave segura de 32+ caracteres)
- ✅ `OPENAI_API_KEY` (o ANTHROPIC_API_KEY o GOOGLE_API_KEY)
- ✅ `CORS_ORIGINS` (incluir la URL del frontend)

---

## 🟢 FRONTEND

### Variables OBLIGATORIAS

```bash
# URL del backend
NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com
```

### Resumen Frontend

**Mínimo necesario:**
- ✅ `NEXT_PUBLIC_API_URL` (apuntar al backend en Render)

---

## 📋 Checklist de Despliegue

### Backend en Render

- [ ] `JWT_SECRET_KEY` configurada (32+ caracteres, generada de forma segura)
- [ ] `OPENAI_API_KEY` configurada (o otro proveedor de IA)
- [ ] `CORS_ORIGINS` incluye la URL del frontend
- [ ] `ENVIRONMENT=production` (opcional pero recomendado)
- [ ] Verificar que el backend responde: https://agenta-rh.onrender.com/api/health

### Frontend en Render

- [ ] `NEXT_PUBLIC_API_URL=https://agenta-rh.onrender.com` configurada
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Root Directory: `frontend`

---

## 🔐 Generar JWT_SECRET_KEY Seguro

Ejecuta este comando para generar una clave segura:

```bash
python -c 'import secrets; print(secrets.token_urlsafe(32))'
```

O desde Python:
```python
import secrets
print(secrets.token_urlsafe(32))
```

Copia el resultado y úsalo como valor de `JWT_SECRET_KEY`.

---

## ⚠️ IMPORTANTE

1. **JWT_SECRET_KEY**: Si no configuras una clave segura, el backend fallará en producción (hay validación que requiere 32+ caracteres).

2. **CORS**: Si no configuras `CORS_ORIGINS` correctamente, el frontend no podrá hacer peticiones al backend.

3. **API Keys**: Sin al menos una API key de IA configurada, las funcionalidades de análisis y chat no funcionarán.

4. **Variables NEXT_PUBLIC_**: Solo las variables que empiezan con `NEXT_PUBLIC_` son accesibles en el cliente del frontend.

