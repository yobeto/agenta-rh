# Cómo Cargar Posiciones desde PDFs

## 📁 Dónde Colocar los PDFs

Tienes dos opciones:

### Opción 1: Carpeta por Defecto (Recomendado)

Coloca tus PDFs en:
```
backend/positions/pdfs/
```

Ejemplo:
```
backend/positions/pdfs/
├── analista_datos_senior.pdf
├── desarrollador_fullstack.pdf
├── gerente_proyectos.pdf
└── ...
```

### Opción 2: Carpeta Personalizada

Puedes usar cualquier carpeta y especificarla al ejecutar el script.

---

## 🚀 Cómo Cargar los PDFs

### Método 1: Script Automático (Recomendado)

1. **Coloca tus PDFs** en `backend/positions/pdfs/` (o en tu carpeta personalizada)

2. **Ejecuta el script:**
   ```bash
   cd agent-rh/backend
   python scripts/load_positions_from_pdfs.py
   ```

   O con una carpeta personalizada:
   ```bash
   python scripts/load_positions_from_pdfs.py /ruta/a/tus/pdfs
   ```

3. **El script automáticamente:**
   - Lee todos los PDFs de la carpeta
   - Extrae el texto de cada PDF
   - Crea archivos JSON en `backend/positions/data/`
   - Genera IDs y códigos únicos
   - Intenta extraer el título del JD

4. **Resultado:**
   - Cada PDF se convierte en un archivo JSON
   - Las posiciones quedan disponibles en el sistema
   - Puedes editarlas manualmente después si es necesario

### Método 2: Carga Automática al Iniciar (Futuro)

El servicio puede configurarse para escanear automáticamente la carpeta de PDFs al iniciar el backend.

---

## 📝 Formato de Nombres de Archivos

**Recomendado:** Usa nombres descriptivos que se convertirán en códigos:

```
analista_datos_senior.pdf     → position_analista_datos_senior
desarrollador_fullstack.pdf   → position_desarrollador_fullstack
gerente_proyectos.pdf         → position_gerente_proyectos
```

El sistema:
- Usa el nombre del archivo (sin extensión) como base del ID
- Convierte guiones bajos a espacios para el título
- Genera un código único automáticamente

---

## 🔧 Configuración Avanzada

### Variables de Entorno

Puedes configurar las rutas con variables de entorno:

```bash
# En .env o variables de entorno
POSITIONS_DATA_DIR=backend/positions/data
POSITIONS_PDFS_DIR=backend/positions/pdfs
```

O usar rutas absolutas:
```bash
POSITIONS_PDFS_DIR=/ruta/completa/a/tus/pdfs
```

---

## 📋 Después de Cargar los PDFs

### 1. Revisar Posiciones Creadas

Los archivos JSON se crean en:
```
backend/positions/data/
├── position_analista_datos_senior.json
├── position_desarrollador_fullstack.json
└── ...
```

### 2. Editar Metadata (Opcional)

Puedes editar los archivos JSON para:
- Ajustar el título
- Cambiar departamento y ubicación
- Agregar información adicional
- Corregir información extraída

### 3. Usar en el Sistema

Una vez cargadas, las posiciones estarán disponibles en:
- Selector de posiciones para usuarios
- Gestor de posiciones para administradores

---

## ⚠️ Notas Importantes

1. **Los PDFs originales se mantienen** en `backend/positions/pdfs/`
2. **El texto extraído se guarda** en los archivos JSON
3. **Si actualizas un PDF**, vuelve a ejecutar el script para actualizar el JSON
4. **Los nombres de archivo** deben ser únicos (no duplicados)
5. **El sistema intenta extraer el título** automáticamente, pero puedes editarlo después

---

## 🔄 Actualizar Posiciones Existentes

Si ya tienes posiciones creadas y quieres actualizar el texto desde el PDF:

1. Reemplaza el PDF en `backend/positions/pdfs/`
2. Ejecuta el script nuevamente
3. El sistema detectará el PDF y actualizará el JSON correspondiente

---

## 📊 Estructura Final

Después de cargar los PDFs, tendrás:

```
backend/positions/
├── data/                           # Archivos JSON (generados)
│   ├── position_001.json
│   ├── position_002.json
│   └── ...
└── pdfs/                           # PDFs originales (tus archivos)
    ├── analista_datos_senior.pdf
    ├── desarrollador_fullstack.pdf
    └── ...
```

---

## 🐛 Solución de Problemas

### Error: "No se encontraron PDFs"
- Verifica que los PDFs estén en la carpeta correcta
- Verifica que los archivos tengan extensión `.pdf`
- Verifica permisos de lectura

### Error: "PDF no tiene suficiente texto"
- El PDF puede estar escaneado (imagen) sin OCR
- El PDF puede estar vacío o corrupto
- Intenta con otro PDF

### Error: "No se pudo extraer texto"
- Verifica que el PDF no esté protegido con contraseña
- Verifica que el PDF no esté corrupto
- Intenta abrir el PDF manualmente para verificar

---

¿Listo para cargar tus PDFs? Colócalos en `backend/positions/pdfs/` y ejecuta el script!

