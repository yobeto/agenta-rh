# Resumen: Sistema de Posiciones desde PDFs

## 🎯 Respuesta Rápida

### ¿Dónde se guardan los JD por defecto?

**Los PDFs se colocan en:**
```
backend/positions/pdfs/
```

**Los JSON generados se guardan en:**
```
backend/positions/data/
```

### ¿Cómo se muestran las posiciones?

**Para Usuarios (RH):**
- Selector con lista de posiciones activas
- Búsqueda y filtros por departamento
- Preview del JD antes de seleccionar
- Estadísticas de uso (candidatos analizados, último uso)

**Para Administradores:**
- Gestor completo de posiciones
- Crear nuevas posiciones desde PDFs
- Editar posiciones existentes
- Activar/Desactivar posiciones

---

## 📂 Estructura Completa

```
backend/
└── positions/
    ├── data/                    ← JSON generados automáticamente
    │   ├── position_001.json
    │   ├── position_002.json
    │   └── ...
    └── pdfs/                    ← TUS PDFs van aquí
        ├── analista_datos.pdf
        ├── desarrollador.pdf
        └── ...
```

---

## 🚀 Proceso Completo

### Paso 1: Colocar PDFs

```
1. Coloca tus PDFs en: backend/positions/pdfs/
   
   Ejemplo:
   - analista_datos_senior.pdf
   - desarrollador_fullstack.pdf
   - gerente_proyectos.pdf
```

### Paso 2: Ejecutar Script

```bash
cd agent-rh/backend
python scripts/load_positions_from_pdfs.py
```

### Paso 3: Resultado

```
✅ El script:
   - Lee todos los PDFs
   - Extrae el texto
   - Crea archivos JSON en data/
   - Las posiciones quedan disponibles
```

### Paso 4: Usar en el Sistema

```
✅ Los usuarios pueden:
   - Ver lista de posiciones
   - Seleccionar una posición
   - Analizar candidatos para esa posición
```

---

## 🎨 Vista de Usuario

### Antes (Actual):
```
[Subir PDF del Job Description]
```

### Después (Propuesto):
```
┌─────────────────────────────────────────┐
│  Seleccionar Posición Abierta           │
│                                          │
│  🔍 [Buscar...]                          │
│  [Todos] [Tecnología] [RH] [Operaciones]│
│                                          │
│  ✅ Analista de Datos Senior            │
│     🏢 Tecnología · 📍 CDMX             │
│     📊 23 candidatos analizados         │
│     [Seleccionar]                       │
│                                          │
│  ✅ Desarrollador Full Stack            │
│     🏢 Tecnología · 📍 Remoto           │
│     📊 15 candidatos analizados         │
│     [Seleccionar]                       │
└─────────────────────────────────────────┘
```

---

## 📋 Checklist de Implementación

- [x] Estructura de carpetas creada
- [x] Servicio de posiciones (`position_service.py`)
- [x] Script para cargar PDFs automáticamente
- [ ] Endpoints API en `main.py`
- [ ] Componente `PositionSelector.tsx` (frontend)
- [ ] Componente `PositionManager.tsx` (admin, frontend)
- [ ] Integración en flujo actual

---

## 💡 Ventajas de este Enfoque

1. **Simple**: Solo coloca PDFs en una carpeta
2. **Automático**: El script procesa todo
3. **Flexible**: Puedes editar los JSON después
4. **Escalable**: Fácil agregar más posiciones
5. **Versionable**: Los JSON pueden estar en Git

---

¿Quieres que implemente los endpoints API y los componentes del frontend ahora?

