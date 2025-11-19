# Mejoras al Prompt de Análisis de Candidatos

## Problema Identificado
El prompt anterior daba porcentajes muy altos aunque los CVs no tuvieran relación con la vacante, debido a:
- Falta de comparación directa y estricta entre JD y CV
- Ausencia de penalización por requisitos no cumplidos
- Instrucciones vagas sobre cuándo usar niveles bajos de confianza
- No se requería coincidencia específica, solo "experiencia general"

## Mejoras Implementadas

### 1. **Método de Análisis Estructurado**
- **Identificación de requisitos clave**: El prompt ahora instruye a identificar primero los requisitos específicos del JD
- **Comparación punto por punto**: Compara cada requisito del JD con el CV
- **Evaluación de coincidencias**: Distingue entre coincidencia EXACTA, PARCIAL o NINGUNA
- **Penalización de ausencias**: Si faltan requisitos obligatorios, el score no puede ser alto

### 2. **Niveles de Confianza Más Estrictos**
```
- "high": TODOS los requisitos principales cumplidos + experiencia directa relevante
- "medium": Mayoría de requisitos cumplidos pero faltan algunos importantes
- "low": Pocos requisitos cumplidos o experiencia en área diferente pero transferible
- "insufficient": NO cumple requisitos principales o está en área completamente diferente
```

### 3. **Comparación Directa Obligatoria**
- El prompt ahora requiere comparar QUÉ del JD con QUÉ del CV
- Ejemplo: "JD requiere: 5 años en Python. CV muestra: 2 años en Java. Coincidencia: PARCIAL"
- Prohíbe lenguaje vago como "tiene experiencia" sin especificar

### 4. **Sistema de Pesos Mejorado**
- Pesos altos (0.4-0.5) para requisitos OBLIGATORIOS
- Pesos medios (0.2-0.3) para requisitos importantes
- Pesos bajos (0.1-0.15) para requisitos deseables
- Suma aproximada a 1.0

### 5. **Instrucciones Más Específicas**
- "Si el CV NO menciona algo que el JD requiere, indícalo claramente"
- "Si hay más requisitos NO cumplidos que cumplidos, el nivel debe ser 'low' o 'insufficient'"
- "NO asumas que 'experiencia general' es suficiente si el JD requiere algo específico"

### 6. **Temperature Reducida**
- Cambiado de 0.2 a 0.1 para respuestas más deterministas y consistentes
- Max tokens aumentado a 2500 para permitir análisis más detallados

### 7. **System Message Mejorado**
- Ahora enfatiza "comparación estricta" y "no das puntajes altos si no hay coincidencias reales"

## Recomendaciones Adicionales

### 1. **Validación Post-Análisis (Opcional)**
Considera agregar validación en el backend para verificar que:
- Si `confidence_level` es "high" pero hay muchos `missing_information`, ajustar automáticamente
- Si el score calculado es >80 pero hay más de 2 requisitos faltantes, revisar

### 2. **Ejemplos en el Prompt (Opcional)**
Podrías agregar ejemplos de buenas y malas comparaciones:
```python
EJEMPLO BUENO:
JD requiere: "5 años en desarrollo Python, experiencia en Django"
CV muestra: "6 años desarrollando en Python, 4 años usando Django"
Coincidencia: EXACTA

EJEMPLO MALO:
JD requiere: "5 años en desarrollo Python"
CV muestra: "3 años en Java, 2 años en C++"
Coincidencia: NINGUNA (lenguajes diferentes)
```

### 3. **Análisis de Área Funcional**
Considera agregar una instrucción para verificar si el área funcional coincide:
- Si el JD es para "Desarrollador Backend" y el CV es de "Diseñador UX", debe ser "insufficient"
- Si el JD es para "Analista Financiero" y el CV es de "Marketing", debe ser "insufficient"

### 4. **Métricas de Coincidencia**
Podrías agregar un campo adicional en la respuesta que indique:
- Porcentaje de requisitos cumplidos
- Número de requisitos obligatorios faltantes
- Nivel de transferibilidad de la experiencia

### 5. **Testing con Casos Edge**
Prueba el prompt mejorado con:
- CV completamente fuera del área (ej: diseñador para puesto de desarrollador)
- CV con experiencia parcial pero en área relacionada
- CV con todos los requisitos cumplidos
- CV con requisitos cumplidos pero en diferentes tecnologías

## Resultados Esperados

Con estas mejoras, deberías ver:
- ✅ Puntajes más bajos cuando los CVs no coinciden con la vacante
- ✅ Análisis más detallados que muestran QUÉ falta específicamente
- ✅ Niveles de confianza más precisos ("insufficient" cuando no hay coincidencias)
- ✅ Criterios objetivos que muestran la comparación directa JD vs CV
- ✅ Menos falsos positivos (candidatos con puntajes altos sin razón)

## Próximos Pasos

1. **Probar con casos reales**: Usa CVs que claramente no coinciden y verifica que den scores bajos
2. **Ajustar según resultados**: Si aún hay falsos positivos, refuerza las instrucciones sobre penalización
3. **Monitorear métricas**: Revisa la distribución de confidence_levels y ajusta si es necesario
4. **Feedback de usuarios**: Pide a RH que reporten casos donde el análisis no fue preciso

