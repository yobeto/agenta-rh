# Estructura de Almacenamiento de Posiciones

## 📁 Estructura de Carpetas

```
agent-rh/
├── backend/
│   ├── positions/                    # Carpeta principal de posiciones
│   │   ├── data/                     # Archivos JSON con metadata
│   │   │   ├── position_001.json
│   │   │   ├── position_002.json
│   │   │   └── ...
│   │   ├── pdfs/                     # PDFs originales (opcional)
│   │   │   ├── position_001.pdf
│   │   │   ├── position_002.pdf
│   │   │   └── ...
│   │   └── .gitkeep                  # Para mantener la carpeta en git
│   └── services/
│       └── position_service.py        # Servicio de gestión
```

## 📄 Formato de Archivo JSON

**Ejemplo: `backend/positions/data/position_001.json`**

```json
{
  "id": "position_001",
  "code": "ANALISTA-DATOS-001",
  "title": "Analista de Datos Senior",
  "department": "Tecnología",
  "location": "CDMX - Híbrido",
  "status": "active",
  "created_at": "2024-01-15T10:00:00Z",
  "created_by": "admin",
  "updated_at": "2024-01-20T15:30:00Z",
  "updated_by": "admin",
  "job_description": {
    "raw_text": "ANALISTA DE DATOS SENIOR\n\nDepartamento: Tecnología\nUbicación: CDMX - Híbrido\n\nDescripción:\nBuscamos un Analista de Datos Senior para unirse a nuestro equipo de tecnología...\n\nResponsabilidades:\n- Analizar grandes volúmenes de datos...\n- Crear reportes y dashboards...\n\nRequisitos:\n- 3-5 años de experiencia en análisis de datos\n- Conocimiento en Python y SQL\n- Experiencia con herramientas de BI...",
    "pdf_path": "positions/pdfs/position_001.pdf",
    "word_count": 450,
    "extracted_at": "2024-01-15T10:05:00Z"
  },
  "metadata": {
    "salary_range": "Competitivo",
    "experience_required": "3-5 años",
    "education_level": "Licenciatura en áreas afines",
    "employment_type": "Tiempo completo"
  },
  "statistics": {
    "times_used": 5,
    "candidates_analyzed": 23,
    "last_used": "2024-01-25T14:30:00Z"
  }
}
```

## 🎨 Cómo se Mostrarían las Posiciones

### Vista de Selección (Para Usuarios)

**Diseño propuesto:**

```
┌─────────────────────────────────────────────────────────┐
│  📋 Seleccionar Posición Abierta                        │
│                                                          │
│  🔍 [Buscar posiciones...]                              │
│                                                          │
│  Filtros:                                               │
│  [Todos] [Tecnología] [RH] [Finanzas] [Operaciones]     │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ✅ Analista de Datos Senior                      │  │
│  │    Tecnología · CDMX - Híbrido                   │  │
│  │    📊 23 candidatos analizados                   │  │
│  │    Último uso: hace 2 días                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ✅ Desarrollador Full Stack                      │  │
│  │    Tecnología · Remoto                           │  │
│  │    📊 15 candidatos analizados                   │  │
│  │    Último uso: hace 5 días                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ✅ Gerente de Proyectos                          │  │
│  │    Operaciones · CDMX                            │  │
│  │    📊 8 candidatos analizados                     │  │
│  │    Último uso: hace 1 semana                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Vista de Preview (Al seleccionar)

```
┌─────────────────────────────────────────────────────────┐
│  📄 Preview: Analista de Datos Senior                   │
│                                                          │
│  Departamento: Tecnología                              │
│  Ubicación: CDMX - Híbrido                              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Descripción:                                      │  │
│  │ Buscamos un Analista de Datos Senior para...     │  │
│  │                                                   │  │
│  │ Responsabilidades:                               │  │
│  │ • Analizar grandes volúmenes de datos            │  │
│  │ • Crear reportes y dashboards                    │  │
│  │                                                   │  │
│  │ Requisitos:                                      │  │
│  │ • 3-5 años de experiencia                        │  │
│  │ • Conocimiento en Python y SQL                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  [Cancelar]  [Seleccionar esta posición]                │
└─────────────────────────────────────────────────────────┘
```

## 💾 Dónde Guardar los JD por Defecto

### Opción 1: Archivos JSON (Recomendado para empezar)

**Ventajas:**
- Simple de implementar
- Fácil de versionar con Git
- No requiere base de datos

**Ubicación:**
```
backend/positions/data/
```

**Cómo cargar:**
- Al iniciar el backend, leer todos los archivos `.json` de `positions/data/`
- Cargar en memoria o cachear
- Servir a través de API

### Opción 2: Base de Datos (Para producción)

**Ventajas:**
- Mejor rendimiento
- Búsquedas complejas
- Escalabilidad

**Tabla SQL sugerida:**
```sql
CREATE TABLE positions (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    job_description_text TEXT NOT NULL,
    pdf_path VARCHAR(500),
    metadata JSONB,
    statistics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_at TIMESTAMP,
    updated_by VARCHAR(100)
);
```

## 🚀 Implementación Inicial

### Paso 1: Crear Estructura de Carpetas

```bash
mkdir -p backend/positions/data
mkdir -p backend/positions/pdfs
touch backend/positions/data/.gitkeep
touch backend/positions/pdfs/.gitkeep
```

### Paso 2: Crear JD de Ejemplo

Crear `backend/positions/data/position_001.json` con el formato mostrado arriba.

### Paso 3: Servicio Backend

El servicio leerá los archivos JSON y los servirá a través de la API.

---

## 📝 Notas Importantes

1. **Los PDFs son opcionales**: El texto puede estar solo en el JSON
2. **Versionado**: Considerar versiones de posiciones (v1, v2)
3. **Backup**: Los archivos JSON pueden estar en Git para versionado
4. **Migración futura**: Fácil migrar de JSON a BD cuando sea necesario

