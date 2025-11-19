# Propuesta: Sistema de Posiciones Centralizadas

## 🎯 Objetivo

Centralizar la gestión de Job Descriptions (JD) en posiciones predefinidas que solo los administradores pueden crear/modificar, mientras que los usuarios seleccionan de una lista de posiciones disponibles.

---

## 📋 Arquitectura Propuesta

### 1. **Estructura de Datos**

```
backend/
  └── positions/
      ├── position_001_analista_datos.json
      ├── position_002_desarrollador_fullstack.json
      ├── position_003_gerente_proyectos.json
      └── ...
```

**Formato de archivo JSON:**
```json
{
  "id": "position_001",
  "title": "Analista de Datos Senior",
  "department": "Tecnología",
  "location": "CDMX",
  "status": "active", // active, closed, draft
  "created_at": "2024-01-15T10:00:00Z",
  "created_by": "admin",
  "updated_at": "2024-01-20T15:30:00Z",
  "updated_by": "admin",
  "job_description": {
    "raw_text": "...", // Texto extraído del PDF
    "pdf_path": "positions/pdfs/position_001.pdf", // Opcional: PDF original
    "extracted_criteria": [ // Criterios clave extraídos
      {
        "criterion": "Experiencia en Python",
        "weight": 0.3,
        "required": true
      }
    ]
  },
  "metadata": {
    "salary_range": "Competitivo",
    "experience_required": "3-5 años",
    "education_level": "Licenciatura"
  }
}
```

---

### 2. **Backend - Nuevos Endpoints**

```python
# GET /api/positions
# Lista todas las posiciones activas (para usuarios)
# Filtros: department, status, search

# GET /api/positions/{position_id}
# Obtiene detalles de una posición específica

# POST /api/positions (solo admin)
# Crea una nueva posición
# Valida plantilla ética
# Extrae texto del PDF si se proporciona

# PUT /api/positions/{position_id} (solo admin)
# Actualiza una posición existente

# DELETE /api/positions/{position_id} (solo admin)
# Marca posición como "closed" (soft delete)

# GET /api/positions/template
# Obtiene la plantilla para crear posiciones
```

---

### 3. **Frontend - Componentes Nuevos**

#### **PositionSelector.tsx** (Reemplaza JobDescriptionInput para usuarios)
- Dropdown/Select con búsqueda
- Muestra: título, departamento, estado
- Filtros rápidos
- Vista previa del JD antes de seleccionar

#### **PositionManager.tsx** (Solo para admin)
- Lista de todas las posiciones
- Crear nueva posición
- Editar posición existente
- Subir PDF y validar plantilla
- Activar/desactivar posiciones

#### **PositionForm.tsx** (Solo para admin)
- Formulario con plantilla ética
- Campos:
  - Título de la posición
  - Departamento
  - Ubicación
  - Subir PDF del JD
  - Campos adicionales (opcional)
- Validación en tiempo real
- Preview del texto extraído

---

### 4. **Plantilla Ética para JD**

**Validaciones automáticas:**
- ✅ Solo información laboral (experiencia, educación, habilidades)
- ✅ Sin referencias a edad, género, raza, etc.
- ✅ Criterios objetivos y medibles
- ✅ Lenguaje neutral
- ✅ Requisitos verificables

**Estructura sugerida:**
```
1. Título de la Posición
2. Departamento y Ubicación
3. Descripción General
4. Responsabilidades Clave
5. Requisitos Técnicos (objetivos)
6. Educación y Certificaciones
7. Experiencia Requerida (años, no edad)
8. Habilidades Deseables
```

---

## 🔄 Flujo de Trabajo Propuesto

### Para Administradores:

1. **Crear Nueva Posición:**
   ```
   Admin → PositionManager → Crear Nueva
   → Subir PDF del JD
   → Sistema extrae texto y valida plantilla
   → Admin revisa y ajusta si es necesario
   → Guardar como "active" o "draft"
   ```

2. **Gestionar Posiciones:**
   ```
   Admin → PositionManager
   → Ver todas las posiciones
   → Editar/Activar/Desactivar
   → Ver estadísticas de uso
   ```

### Para Usuarios (RH):

1. **Seleccionar Posición:**
   ```
   Usuario → PositionSelector
   → Buscar/Filtrar posiciones activas
   → Seleccionar posición
   → Ver preview del JD
   → Confirmar selección
   → Continuar con carga de CVs
   ```

2. **Analizar Candidatos:**
   ```
   Usuario → Selecciona posición
   → Carga CVs
   → Genera análisis
   → (El análisis queda vinculado a la posición)
   ```

---

## 📊 Beneficios Adicionales

### 1. **Trazabilidad Mejorada**
- Cada análisis queda vinculado a una posición específica
- Historial de candidatos por posición
- Métricas por posición (tiempo de contratación, tasa de éxito)

### 2. **Reutilización**
- Misma posición puede usarse para múltiples procesos de selección
- Comparar candidatos de diferentes momentos para la misma posición
- Aprendizaje: mejorar JD basado en resultados

### 3. **Consistencia**
- Todos los usuarios ven el mismo JD para la misma posición
- Evita variaciones en criterios de evaluación
- Facilita comparación justa de candidatos

### 4. **Reportes Mejorados**
- Análisis por posición
- Tendencias de mercado por tipo de posición
- Efectividad de JD (qué posiciones atraen mejores candidatos)

---

## 🛠️ Implementación Técnica

### Backend (Python/FastAPI)

```python
# backend/services/position_service.py
class PositionService:
    def __init__(self):
        self.positions_dir = "backend/positions"
        self.template_validator = EthicalTemplateValidator()
    
    def list_positions(self, status="active", filters=None):
        """Lista posiciones disponibles"""
        pass
    
    def get_position(self, position_id: str):
        """Obtiene una posición específica"""
        pass
    
    def create_position(self, position_data, pdf_file=None, admin_user: str):
        """Crea nueva posición (solo admin)"""
        # 1. Validar plantilla ética
        # 2. Extraer texto del PDF si existe
        # 3. Guardar en archivo JSON
        # 4. Retornar posición creada
        pass
    
    def update_position(self, position_id: str, updates, admin_user: str):
        """Actualiza posición (solo admin)"""
        pass
```

### Frontend (React/Next.js)

```typescript
// components/PositionSelector.tsx
export function PositionSelector({ 
  onPositionSelect 
}: { 
  onPositionSelect: (position: Position) => void 
}) {
  // Dropdown con búsqueda
  // Filtros por departamento
  // Preview del JD
}

// components/PositionManager.tsx (Admin)
export function PositionManager() {
  // Lista de posiciones
  // Crear/Editar/Activar/Desactivar
  // Subir PDFs
}
```

---

## 🔐 Seguridad y Permisos

- **Usuarios normales:** Solo lectura de posiciones activas
- **Administradores:** CRUD completo de posiciones
- **Validación:** Plantilla ética obligatoria al crear/editar
- **Auditoría:** Log de quién creó/modificó cada posición

---

## 📈 Métricas y Analytics

Con este sistema se pueden agregar:
- Posiciones más utilizadas
- Tiempo promedio de contratación por posición
- Tasa de éxito por posición
- Candidatos analizados por posición
- Efectividad de JD (correlación JD → calidad de candidatos)

---

## 🚀 Plan de Migración

### Fase 1: Backend
1. Crear `position_service.py`
2. Implementar endpoints de API
3. Sistema de validación de plantilla
4. Migrar JD existentes a formato de posiciones

### Fase 2: Frontend - Admin
1. Crear `PositionManager` component
2. Crear `PositionForm` con validación
3. Integrar en `AdminMenu`

### Fase 3: Frontend - Usuarios
1. Crear `PositionSelector` component
2. Reemplazar `JobDescriptionInput` con selector
3. Mantener compatibilidad con JD manual (temporal)

### Fase 4: Migración de Datos
1. Convertir JD existentes a posiciones
2. Vincular análisis previos a posiciones
3. Deprecar carga manual de JD

---

## ✅ Checklist de Implementación

- [ ] Backend: Servicio de posiciones
- [ ] Backend: Endpoints API
- [ ] Backend: Validación de plantilla ética
- [ ] Backend: Almacenamiento de posiciones (JSON/BD)
- [ ] Frontend: PositionManager (Admin)
- [ ] Frontend: PositionForm (Admin)
- [ ] Frontend: PositionSelector (Usuarios)
- [ ] Frontend: Integración en flujo actual
- [ ] Migración: Convertir JD existentes
- [ ] Documentación: Guía de uso para admins
- [ ] Testing: Validar flujo completo

---

## 💡 Consideraciones Adicionales

### Versiones de Posiciones
- Permitir versiones de una posición (v1, v2)
- Comparar candidatos entre versiones
- Historial de cambios

### Plantillas Predefinidas
- Plantillas por tipo de posición (técnica, gerencial, operativa)
- Auto-completado inteligente
- Sugerencias basadas en mejores prácticas

### Integración con ATS
- Exportar posiciones a sistemas ATS
- Sincronización bidireccional
- Mapeo de campos

---

¿Te parece bien esta propuesta? ¿Quieres que implemente alguna parte específica?

