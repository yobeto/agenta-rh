# Posiciones Abiertas - Job Descriptions

Esta carpeta contiene las posiciones abiertas (Job Descriptions) que están disponibles para que los usuarios seleccionen al analizar candidatos.

## 📁 Estructura

```
positions/
├── data/          # Archivos JSON con metadata y JD
└── pdfs/          # PDFs originales (opcional)
```

## 📄 Formato de Archivos

Cada posición se guarda como un archivo JSON en `data/` con el siguiente formato:

- `position_001.json` - Analista de Datos Senior
- `position_002.json` - Desarrollador Full Stack
- `position_003.json` - Gerente de Proyectos
- etc.

## 🔧 Gestión

- **Crear nueva posición**: Solo administradores pueden crear nuevas posiciones
- **Editar posición**: Solo administradores pueden modificar posiciones existentes
- **Usar posición**: Todos los usuarios pueden seleccionar posiciones activas

## 📝 Notas

- Los archivos JSON contienen el texto completo del JD
- Los PDFs en `pdfs/` son opcionales (solo para referencia)
- El campo `status` puede ser: `active`, `closed`, `draft`

