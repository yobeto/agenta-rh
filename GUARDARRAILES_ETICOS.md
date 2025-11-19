# Guardarrailes Éticos y Prevención de Sesgos

## Mejoras Implementadas

### 1. **Prompt Mejorado con Enfoque en Equidad**

#### Variables Prohibidas Expandidas
Ahora el sistema prohíbe explícitamente:
- ✅ Edad, género, raza, etnia, color de piel
- ✅ Religión, creencias, orientación sexual
- ✅ Estado civil, situación familiar, hijos
- ✅ Nacionalidad, origen étnico, lugar de nacimiento
- ✅ Discapacidad, condición médica, salud
- ✅ Apariencia física, peso, altura
- ✅ Nombres que puedan indicar género u origen

#### Principios de Equidad Agregados
- **Evaluación justa de experiencia transferible**: No penaliza por industria "menos prestigiosa"
- **Sin estereotipos**: No asume que ciertos tipos de experiencia son "mejores"
- **Lenguaje inclusivo**: Usa "la persona" en lugar de asumir género
- **Verificación de sesgos**: Instrucciones explícitas para revisar sesgos antes de responder

### 2. **EthicalValidator Mejorado**

#### Nuevas Validaciones de Sesgos

**Detección de Indicadores de Sesgo:**
- Términos como "sobrecalificado", "subcalificado", "muy joven", "muy mayor"
- Términos que pueden indicar discriminación por industria
- Validación en criterios objetivos, no solo en recomendaciones

**Limpieza Automática:**
- Remueve términos de sesgo de recomendaciones
- Limpia criterios objetivos de lenguaje sesgado
- Crea criterios genéricos si todos quedan vacíos después de limpieza

### 3. **System Messages Mejorados**

Los system messages ahora incluyen:
- "Eres consciente de sesgos y los evitas activamente"
- "Aplicas principios de equidad y no discriminación"
- "Evalúas solo competencias y habilidades relevantes"

## Guardarrailes Adicionales Recomendados

### 1. **Validación de Job Description (Recomendado)**

Agregar validación para detectar sesgos en el JD mismo:

```python
def validate_job_description(self, job_description: str) -> ValidationResult:
    """Valida que el JD no contenga requisitos discriminatorios"""
    jd_lower = job_description.lower()
    
    # Detectar requisitos de edad implícitos
    age_indicators = ["joven", "reciente graduado", "menos de X años", "más de X años"]
    
    # Detectar requisitos de género
    gender_indicators = ["preferiblemente", "idealmente", "se busca"]
    
    # Detectar requisitos discriminatorios
    discriminatory = ["solo", "exclusivamente", "preferentemente"]
    
    warnings = []
    for indicator in age_indicators + gender_indicators:
        if indicator in jd_lower:
            warnings.append(f"Posible requisito discriminatorio detectado: '{indicator}'")
    
    return ValidationResult(
        is_valid=len(warnings) == 0,
        warnings=warnings
    )
```

### 2. **Análisis de Equidad Estadística (Opcional)**

Para monitoreo a largo plazo:

```python
def analyze_fairness_metrics(self, analyses: List[CandidateAnalysisResult]) -> dict:
    """Analiza métricas de equidad en un lote de análisis"""
    # Distribución de confidence_levels
    # Promedio de scores por tipo de experiencia
    # Detección de patrones que puedan indicar sesgos sistemáticos
    pass
```

### 3. **Logging de Advertencias de Sesgo**

Mejorar el logging para rastrear advertencias:

```python
if warnings:
    logger.warning(
        "Análisis con advertencias de sesgo potencial",
        extra={
            "candidate_id": analysis.candidateId,
            "warnings": warnings,
            "recommendation_preview": analysis.recommendation[:100]
        }
    )
```

### 4. **Validación de Nombres (Opcional pero Controversial)**

⚠️ **CUIDADO**: Esto puede ser contraproducente. Solo si es necesario:

```python
# NO recomiendo esto a menos que sea absolutamente necesario
# Puede crear más problemas de los que resuelve
def anonymize_names(self, text: str) -> str:
    """Anonimiza nombres en el texto para evitar sesgos por nombre"""
    # Usar NER (Named Entity Recognition) para detectar nombres
    # Reemplazar con [CANDIDATO] o similar
    pass
```

### 5. **Auditoría Periódica de Decisiones**

Implementar revisión periódica:

```python
def audit_decisions(self, time_period: str) -> dict:
    """Audita decisiones para detectar patrones de sesgo"""
    # Revisar distribución de acciones (interview/rejected/on_hold)
    # Por tipo de experiencia, industria previa, etc.
    # Detectar si hay patrones que indiquen sesgos sistemáticos
    pass
```

## Mejores Prácticas Implementadas

### ✅ **Lo que YA está implementado:**

1. **Validación de entrada**: Rechaza CVs con información personal
2. **Validación de salida**: Verifica que análisis no contenga sesgos
3. **Limpieza automática**: Remueve términos problemáticos
4. **Prompt estricto**: Instrucciones claras sobre qué evaluar y qué no
5. **System messages**: Enfoque en equidad y no discriminación
6. **Advertencias**: Detecta y reporta posibles sesgos

### 🔄 **Mejoras Continuas Recomendadas:**

1. **Monitoreo de métricas**: Revisar periódicamente distribución de scores
2. **Feedback loop**: Permitir que usuarios reporten análisis sesgados
3. **Testing con casos diversos**: Probar con CVs de diferentes perfiles
4. **Actualización de términos**: Mantener listas de términos prohibidos actualizadas
5. **Capacitación**: Documentar principios éticos para usuarios

## Checklist de Cumplimiento Ético

Antes de cada análisis, el sistema verifica:

- [x] No contiene información personal protegida
- [x] No usa lenguaje subjetivo
- [x] No infiere atributos personales
- [x] Evalúa solo competencias relevantes
- [x] No discrimina por tipo de experiencia
- [x] Usa lenguaje inclusivo
- [x] Proporciona razonamiento verificable
- [x] Indica incertidumbre cuando aplica
- [x] No toma decisiones finales (solo apoyo)

## Recursos Adicionales

### Estándares de Referencia:
- **EEOC (Equal Employment Opportunity Commission)**: Guías sobre selección no discriminatoria
- **GDPR**: Protección de datos personales
- **ISO/IEC 23053**: Framework for AI Systems Using Machine Learning
- **NIST AI Risk Management Framework**: Gestión de riesgos en IA

### Principios Éticos de IA en Reclutamiento:
1. **Transparencia**: El sistema explica cómo evalúa
2. **Equidad**: Trata a todos los candidatos de manera justa
3. **Privacidad**: No almacena ni comparte datos personales
4. **Responsabilidad**: Humanos toman decisiones finales
5. **Verificabilidad**: Cada evaluación es auditable

## Próximos Pasos Sugeridos

1. **Implementar validación de JD** (detección de requisitos discriminatorios)
2. **Agregar métricas de equidad** (monitoreo estadístico)
3. **Crear dashboard de auditoría** (para administradores)
4. **Documentar casos de uso** (ejemplos de análisis éticos)
5. **Capacitar usuarios** (sobre uso ético del sistema)

