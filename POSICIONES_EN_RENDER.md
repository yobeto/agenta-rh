# Cómo Funcionan las Posiciones en Render

## 🚀 Funcionamiento Automático

El sistema **carga automáticamente los PDFs** cuando el backend inicia en Render. No necesitas ejecutar ningún script manualmente.

### Proceso Automático:

1. **Al iniciar el backend en Render:**
   - El servicio `position_service` se inicializa automáticamente
   - Escanea la carpeta `backend/positions/pdfs/`
   - Encuentra todos los PDFs (`.pdf`)
   - Extrae el texto de cada PDF
   - Crea archivos JSON en `backend/positions/data/`
   - Las posiciones quedan disponibles inmediatamente

2. **Logs en Render:**
   ```
   INFO: Encontrados 3 PDFs. Procesando automáticamente...
   INFO: ✅ 3 posiciones cargadas automáticamente desde PDFs
   ```

---

## 📁 Estructura en Render

```
backend/
└── positions/
    ├── data/                    # JSON generados automáticamente
    │   ├── position_JD _ Data Architect - Mesh & BIAN.json
    │   ├── position_Manual de Funciones y responsabilidades - Jefe Admin & financiero.json
    │   └── position_DP_Gerente de Contraloría_.json
    └── pdfs/                    # Tus PDFs (incluidos en el deploy)
        ├── JD _ Data Architect - Mesh & BIAN.pdf
        ├── Manual de Funciones y responsabilidades - Jefe Admin & financiero.pdf
        └── DP_Gerente de Contraloría_.pdf
```

---

## ✅ Verificar que Funciona

### 1. Ver Logs en Render

Después de hacer deploy, revisa los logs del backend. Deberías ver:

```
INFO: Servicios inicializados. Posiciones cargadas automáticamente desde PDFs.
INFO: Encontrados 3 PDFs. Procesando automáticamente...
INFO: Creada nueva posición: position_JD _ Data Architect - Mesh & BIAN
INFO: Creada nueva posición: position_Manual de Funciones y responsabilidades - Jefe Admin & financiero
INFO: Creada nueva posición: position_DP_Gerente de Contraloría_
INFO: ✅ 3 posiciones cargadas automáticamente desde PDFs
```

### 2. Probar Endpoint

```bash
# Listar posiciones (requiere autenticación)
curl -H "Authorization: Bearer TU_TOKEN" \
  https://agenta-rh.onrender.com/api/positions
```

Respuesta esperada:
```json
{
  "positions": [
    {
      "id": "position_JD _ Data Architect - Mesh & BIAN",
      "title": "Data Architect - Mesh & BIAN",
      "department": "RH",
      "location": "CDMX",
      "status": "active",
      ...
    },
    ...
  ],
  "total": 3
}
```

---

## 🔄 Agregar Nuevos PDFs

### Opción 1: Automático (Recomendado)

1. **Agrega el PDF al repositorio:**
   ```bash
   git add backend/positions/pdfs/nueva_posicion.pdf
   git commit -m "Agregar nueva posición"
   git push
   ```

2. **Render hace deploy automáticamente:**
   - El backend se reinicia
   - El servicio detecta el nuevo PDF
   - Lo procesa automáticamente
   - Crea el JSON correspondiente

### Opción 2: Recarga Manual (Solo Admin)

Si agregaste PDFs directamente en Render (sin commit), puedes recargar manualmente:

```bash
# Endpoint para recargar (solo admin)
POST https://agenta-rh.onrender.com/api/positions/reload
Authorization: Bearer ADMIN_TOKEN
```

---

## 📋 Endpoints Disponibles

### 1. Listar Posiciones
```
GET /api/positions?status=active&department=Tecnología&search=arquitecto
```
- **Filtros opcionales:**
  - `status`: `active`, `closed`, `draft`
  - `department`: Filtrar por departamento
  - `search`: Buscar en título o descripción

### 2. Obtener Posición Específica
```
GET /api/positions/{position_id}
```

### 3. Recargar Posiciones (Solo Admin)
```
POST /api/positions/reload
```

---

## ⚠️ Notas Importantes

1. **Los PDFs deben estar en el repositorio:**
   - Render solo tiene acceso a archivos que están en Git
   - Asegúrate de hacer commit de los PDFs

2. **Nombres de archivos:**
   - Los nombres de los PDFs se convierten en IDs de posición
   - Evita caracteres especiales que puedan causar problemas
   - Ejemplo: `JD _ Data Architect.pdf` → ID: `position_JD _ Data Architect`

3. **Actualizaciones:**
   - Si actualizas un PDF existente, el sistema lo detecta y actualiza el JSON
   - No se crean duplicados

4. **Persistencia:**
   - Los JSON se guardan en `backend/positions/data/`
   - Estos archivos también deberían estar en Git para persistencia

---

## 🐛 Solución de Problemas

### Los PDFs no se cargan

1. **Verifica que los PDFs estén en Git:**
   ```bash
   git ls-files backend/positions/pdfs/
   ```

2. **Revisa los logs en Render:**
   - Busca mensajes de error
   - Verifica que la carpeta exista

3. **Verifica permisos:**
   - Los PDFs deben ser legibles
   - La carpeta debe tener permisos de escritura

### Los PDFs se cargan pero no aparecen

1. **Verifica el endpoint:**
   ```bash
   curl https://agenta-rh.onrender.com/api/positions
   ```

2. **Revisa el filtro de status:**
   - Por defecto solo muestra `active`
   - Verifica que las posiciones tengan `"status": "active"`

3. **Recarga manualmente:**
   ```bash
   POST /api/positions/reload
   ```

---

## ✅ Checklist para Deploy

- [ ] PDFs agregados a `backend/positions/pdfs/`
- [ ] PDFs incluidos en commit de Git
- [ ] Push realizado al repositorio
- [ ] Render hace deploy automáticamente
- [ ] Revisar logs en Render para confirmar carga
- [ ] Probar endpoint `/api/positions` para verificar

---

**¡Listo!** El sistema cargará automáticamente tus PDFs cada vez que el backend inicie en Render. 🚀

