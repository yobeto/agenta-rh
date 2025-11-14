# agente-rh - Asistente de Preselección de Candidatos

Aplicación web que asiste al equipo de Recursos Humanos en la preselección de candidatos para puestos de nivel medio, aplicando criterios objetivos y éticos.

## Propósito

Este agente de IA tiene un **propósito limitado**: solo analiza información laboral relevante (experiencia, educación, certificaciones y logros) para apoyar la preselección. **No toma decisiones finales** - todas las recomendaciones deben ser revisadas por humanos.

## Formato de Respuesta

El agente devuelve sus análisis en este formato:

- **(a) Recomendación**: Sugerencia basada en criterios objetivos
- **(b) Criterios objetivos**: Factores medibles considerados
- **(c) Nivel de confianza / incertidumbre**: Indicador de certeza del análisis

## Tecnologías

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js 14 (React + TypeScript)
- **IA**: OpenAI GPT-4 / Claude / Gemini
- **Docker**: Containerización completa (imágenes separadas para backend y frontend)

## Características Principales

- **Carga 100% basada en PDFs**: el Job Description y cada CV se procesan automáticamente; solo se muestran confirmaciones con el conteo de palabras extraídas.
- **Análisis múltiple**: un único Job Description se compara con tantos CVs como subas en la misma ejecución.
- **Resultado resumido + calificación**: cada candidato recibe una síntesis corta, una calificación global (0‑100) y detalle ampliable de criterios objetivos, nivel de confianza y áreas con información faltante.
- **Chat ético contextual**: panel flotante en esquina superior derecha con cierre visible y atajo `Esc`; usa el modelo seleccionado para resolver dudas sobre criterios o interpretación de resultados.
- **Validaciones éticas**: se bloquean datos personales sensibles y lenguaje subjetivo; cualquier infracción genera advertencias o ajustes automáticos.

## Variables de Entorno

El archivo `.env` en la raíz debe contener las claves necesarias para cada proveedor de IA:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...
DEFAULT_AI_MODEL=gpt-4
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

> **Nota:** el backend fija `httpx==0.24.1` para asegurar compatibilidad con `openai==1.3.0`. Si añades dependencias, respeta esas versiones o actualiza el SDK de OpenAI a una versión más reciente que soporte `httpx>=0.28`.

## Estructura del Proyecto

```
agente-rh/
├── backend/          # API FastAPI
│   ├── services/     # Servicios de IA y análisis
│   ├── models/       # Modelos de datos
│   └── utils/        # Utilidades y validaciones éticas
├── frontend/         # Aplicación Next.js
│   ├── app/          # Páginas y rutas
│   ├── components/   # Componentes React
│   └── lib/          # Utilidades y API client
└── docker-compose.yml
```

## Instalación

### Con Docker (Recomendado)

```bash
# Crear archivo .env con las API keys
cp .env.example .env
# Editar .env y agregar tus API keys

# Construir (forzando dependencias actualizadas) y ejecutar
docker-compose build --no-cache
docker-compose up

# Detener y limpiar contenedores
docker-compose down
```

### Desarrollo Local

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Uso

1. Accede a la aplicación: http://localhost:3000
2. Sube la **descripción del puesto** en PDF; se mostrará una confirmación con las palabras extraídas (no se edita manualmente).
3. Sube uno o varios **CVs en PDF**; cada uno queda listado con su conteo de palabras y advertencias si la extracción fue limitada.
4. Selecciona el modelo de IA y pulsa **Generar análisis**.
5. Revisa los resultados: verás una síntesis breve, la calificación global (barra de color) y, si necesitas más detalle, despliega los criterios objetivos y explicaciones.
6. Abre el **chat ético** para aclarar dudas; puedes cerrarlo con el botón “Cerrar” o presionando `Esc`.
7. Recuerda que las decisiones finales siempre son humanas. Usa los hallazgos como apoyo al juicio experto.

## Scripts Útiles

```bash
# Formateo y linter del frontend
cd frontend && npm run lint

# Ejecutar pruebas rápidas del backend (si agregas tests)
cd backend && source .venv/bin/activate && pytest
```

## Valores de agente-rh

Este sistema refleja los valores de **confianza, transparencia y ética**, apoyando un proceso de selección justo y objetivo.

## Licencia

Propietario - agente-rh
