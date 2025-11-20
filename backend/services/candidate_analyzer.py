"""
Servicio de análisis de candidatos usando IA
Aplica principios éticos estrictos y formato de respuesta específico
"""
import os
import logging
from typing import List, Optional
from string import Template
from openai import OpenAI
from anthropic import Anthropic
import google.generativeai as genai
from dotenv import load_dotenv

from models.schemas import (
    CandidateAnalysisResult,
    ObjectiveCriterion,
    ConfidenceLevel,
    CandidateDocument
)

load_dotenv()
logger = logging.getLogger(__name__)


class CandidateAnalyzer:
    """
    Analiza candidatos usando IA, aplicando principios éticos estrictos.
    
    Formato de respuesta:
    (a) Recomendación
    (b) Criterios objetivos
    (c) Nivel de confianza / incertidumbre
    """
    
    def __init__(self):
        # Inicializar clientes de IA
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if os.getenv("OPENAI_API_KEY") else None
        self.anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY")) if os.getenv("ANTHROPIC_API_KEY") else None
        
        if os.getenv("GOOGLE_API_KEY"):
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            self.gemini_configured = True
        else:
            self.gemini_configured = False
        
        # Usar modelos con contextos grandes por defecto para soportar CVs y JDs sin restricciones
        self.default_model = os.getenv("DEFAULT_AI_MODEL", "gpt-4-turbo-preview")  # 128k tokens
    
    async def analyze_batch(
        self,
        job_description: str,
        candidates: List[CandidateDocument],
        model_id: Optional[str] = None
    ) -> List[CandidateAnalysisResult]:
        """
        Analiza múltiples candidatos a partir del texto extraído de sus CVs.
        """
        # Validar que hay al menos una API key configurada
        if not self.openai_client and not self.anthropic_client and not self.gemini_configured:
            raise ValueError(
                "No hay servicio de IA configurado. "
                "Configura al menos una de: OPENAI_API_KEY, ANTHROPIC_API_KEY, o GOOGLE_API_KEY"
            )
        
        # Validar que hay candidatos
        if not candidates or len(candidates) == 0:
            raise ValueError("No se proporcionaron candidatos para analizar")
        
        # Validar que hay job description
        if not job_description or not job_description.strip():
            raise ValueError("No se proporcionó la descripción del puesto (Job Description)")

        analyses: List[CandidateAnalysisResult] = []

        for candidate in candidates:
            try:
                prompt = self._build_ethical_prompt(
                    job_description=job_description,
                    cv_content=candidate.content,
                    filename=candidate.filename
                )

                raw_response = await self._call_ai(prompt, model_id=model_id)
                
                # Logging de la respuesta de IA para debugging
                logger.info(f"✅ Respuesta de IA recibida para {candidate.filename} ({len(raw_response)} caracteres)")
                logger.debug(f"📄 Primeros 500 chars de respuesta: {raw_response[:500]}")
                
                analysis = self._parse_response(
                    raw_response=raw_response,
                    candidate_id=candidate.candidateId,
                    filename=candidate.filename
                )
                analyses.append(analysis)
                logger.info(f"✅ Análisis completado exitosamente para {candidate.filename}")
            except KeyError as ke:
                # Capturar KeyError específicamente antes de que se propague
                error_msg = f"Error de formato en respuesta de IA: {str(ke)}"
                error_type = "KeyError"
                logger.error(
                    f"❌ KeyError analizando candidato {candidate.candidateId or candidate.filename}: {str(ke)}"
                )
                logger.error(f"📋 Traceback completo del KeyError:", exc_info=True)
                # Logging adicional para diagnóstico
                logger.error(f"🔍 Este error indica que la respuesta de IA no tenía el formato JSON esperado")
                logger.error(f"🔍 Revisa los logs anteriores para ver la respuesta completa de la IA")
                
                # Crear un resultado de error específico para KeyError
                recommendation_msg = (
                    f"Error al procesar la respuesta de IA para este candidato. "
                    "El formato de la respuesta no fue el esperado. "
                    "Por favor, intenta nuevamente. Si el problema persiste, contacta al administrador del sistema."
                )
                
                analyses.append(CandidateAnalysisResult(
                    candidateId=candidate.candidateId,
                    filename=candidate.filename,
                    recommendation=recommendation_msg,
                    objective_criteria=[
                        ObjectiveCriterion(
                            name="Error técnico (KeyError)",
                            value=f"Error de formato en respuesta de IA: {str(ke)[:300]}",
                            weight=0.0
                        )
                    ],
                    confidence_level=ConfidenceLevel.INSUFFICIENT,
                    confidence_explanation=f"Error durante el análisis: KeyError. La respuesta de IA no tenía el formato esperado.",
                    missing_information=["Análisis no completado debido a error técnico en formato de respuesta"],
                    ethical_compliance=True,
                    risks=[{
                        "category": "cumplimiento",
                        "level": "alto",
                        "description": f"Error técnico durante el análisis (KeyError): {str(ke)[:200]}"
                    }]
                ))
            except Exception as e:
                error_msg = str(e)
                error_type = type(e).__name__
                logger.error(
                    f"Error analizando candidato {candidate.candidateId or candidate.filename}: {error_type} - {error_msg}"
                )
                logger.debug(f"Traceback completo del error: {repr(e)}", exc_info=True)
                
                # Crear un resultado de error más informativo
                # No mencionar tamaño ya que no hay restricciones de tamaño
                recommendation_msg = (
                    f"Error al analizar este candidato: {error_msg[:200]}. "
                    "Por favor, revisa el CV e intenta nuevamente. "
                    "Si el problema persiste, contacta al administrador del sistema."
                )
                
                analyses.append(CandidateAnalysisResult(
                    candidateId=candidate.candidateId,
                    filename=candidate.filename,
                    recommendation=recommendation_msg,
                    objective_criteria=[
                        ObjectiveCriterion(
                            name="Error técnico",
                            value=f"Error tipo {error_type}: {error_msg[:300]}",
                            weight=0.0
                        )
                    ],
                    confidence_level=ConfidenceLevel.INSUFFICIENT,
                    confidence_explanation=f"Error durante el análisis: {error_type}. {error_msg[:200]}",
                    missing_information=["Análisis no completado debido a error técnico"],
                    ethical_compliance=True,
                    risks=[{
                        "category": "cumplimiento",
                        "level": "alto",
                        "description": f"Error técnico durante el análisis ({error_type}): {error_msg[:200]}"
                    }]
                ))

        return analyses

    def _estimate_tokens(self, text: str) -> int:
        """
        Estima el número de tokens en un texto.
        Aproximación: 1 token ≈ 4 caracteres (conservador para español)
        """
        return len(text) // 4
    
    def _truncate_text_intelligently(self, text: str, max_tokens: int) -> str:
        """
        Trunca texto de manera inteligente, manteniendo el inicio y final.
        El inicio suele tener información clave (título, resumen, requisitos principales).
        El final puede tener información adicional importante.
        """
        max_chars = max_tokens * 4  # Convertir tokens a caracteres
        
        if len(text) <= max_chars:
            return text
        
        # Calcular cuánto espacio tenemos
        # Dividir: 60% inicio, 40% final
        start_chars = int(max_chars * 0.6)
        end_chars = int(max_chars * 0.4)
        
        # Obtener las partes
        start_part = text[:start_chars]
        end_part = text[-end_chars:]
        
        # Buscar el último punto/punto y coma/salto de línea antes del corte para no cortar palabras
        start_cut_pos = start_part.rfind('.')
        if start_cut_pos == -1:
            start_cut_pos = start_part.rfind(';')
        if start_cut_pos == -1:
            start_cut_pos = start_part.rfind('\n')
        if start_cut_pos == -1:
            start_cut_pos = len(start_part)
        else:
            start_cut_pos += 1  # Incluir el carácter de corte
        
        # Buscar el primer punto/punto y coma/salto de línea después del inicio del final
        end_cut_pos = end_part.find('.')
        if end_cut_pos == -1:
            end_cut_pos = end_part.find(';')
        if end_cut_pos == -1:
            end_cut_pos = end_part.find('\n')
        if end_cut_pos == -1:
            end_cut_pos = 0
        else:
            end_cut_pos += 1  # Incluir el carácter de corte
        
        # Ajustar las partes
        start_part = text[:start_cut_pos]
        
        # Para el final, tomar desde el final menos los caracteres disponibles
        # Si encontramos un punto de corte, empezar desde ahí
        if end_cut_pos > 0:
            # Empezar desde el punto de corte encontrado
            end_start_idx = len(text) - end_chars + end_cut_pos
            end_part = text[end_start_idx:]
        else:
            # No encontramos punto de corte, tomar los últimos caracteres
            end_part = text[-end_chars:]
        
        return f"{start_part}\n\n[... contenido truncado para cumplir límite de tokens ...]\n\n{end_part}"

    def _build_ethical_prompt(
        self,
        job_description: str,
        cv_content: str,
        filename: str
    ) -> str:
        """
        Construye un prompt que aplica estrictamente los principios éticos
        y realiza comparación directa y estricta entre JD y CV.
        Trunca el contenido si es necesario para cumplir con el límite de tokens.
        """
        # SIN RESTRICCIONES DE TAMAÑO: Usar modelos con contextos grandes
        # GPT-4 Turbo: 128k tokens, Claude Sonnet 4: 200k tokens, Gemini 2.5 Pro: 1M tokens
        # Dejamos un margen para la respuesta (10k tokens) y usamos el resto para el prompt
        # Esto permite analizar CVs y JDs de cualquier tamaño sin truncamiento
        MAX_PROMPT_TOKENS = 100000  # 100k tokens para el prompt (suficiente para CVs muy largos)
        
        # Construir el prompt base (sin JD y CV)
        # Usar $job_description, $cv_content, $filename como placeholders para Template
        prompt_base = """Eres un asistente de Recursos Humanos para agente-rh. Tu función es COMPARAR DIRECTAMENTE el CV del candidato con los REQUISITOS ESPECÍFICOS del Job Description.

MÉTODO DE ANÁLISIS (OBLIGATORIO - SEGUIR EN ORDEN):

PASO 1: IDENTIFICA REQUISITOS CLAVE del Job Description:
   - Título del puesto y área funcional (ej: "Desarrollador Backend", "Analista Financiero")
   - Años de experiencia requeridos (específicos, no aproximados)
   - Educación/certificaciones obligatorias (títulos, certificaciones específicas)
   - Habilidades técnicas específicas (lenguajes, herramientas, tecnologías)
   - Competencias o conocimientos especializados (dominios, metodologías)
   - Responsabilidades principales (qué hará en el puesto)

PASO 2: VERIFICA ÁREA FUNCIONAL (CRÍTICO):
   - Identifica el área funcional del JD (ej: Desarrollo de Software, Finanzas, Marketing, RH)
   - Identifica el área funcional del CV (basado en experiencia previa)
   - Si las áreas son COMPLETAMENTE DIFERENTES y NO transferibles:
     * Ejemplo: JD es "Desarrollador Backend" y CV es "Diseñador UX" → "insufficient"
     * Ejemplo: JD es "Analista Financiero" y CV es "Marketing" → "insufficient"
     * Ejemplo: JD es "Gerente de RH" y CV es "Desarrollador" → "insufficient"
   - Si las áreas son DIFERENTES pero POTENCIALMENTE TRANSFERIBLES:
     * Ejemplo: JD es "Analista de Datos en Banca" y CV es "Analista de Datos en Retail" → evaluar habilidades transferibles
     * Ejemplo: JD es "Desarrollador Python" y CV es "Desarrollador Java" → evaluar si las habilidades son transferibles

PASO 3: COMPARA PUNTO POR PUNTO con el CV:
   Para CADA requisito del JD, verifica:
   - ¿El candidato tiene la experiencia requerida? (años EXACTOS, tipo de experiencia ESPECÍFICO)
   - ¿Tiene la educación/certificaciones necesarias? (título ESPECÍFICO, certificación ESPECÍFICA)
   - ¿Posee las habilidades técnicas mencionadas en el JD? (lenguaje/herramienta ESPECÍFICA)
   - ¿Su experiencia previa está relacionada con las responsabilidades del puesto? (responsabilidades ESPECÍFICAS)

PASO 4: EVALÚA COINCIDENCIAS REALES (SÉ ESTRICTO):
   - Coincidencia EXACTA: El CV menciona ESPECÍFICAMENTE lo que el JD requiere
     * Ejemplo: JD requiere "5 años en Python", CV muestra "6 años en Python" → EXACTA
   - Coincidencia PARCIAL: El CV tiene algo relacionado pero NO exacto
     * Ejemplo: JD requiere "5 años en Python", CV muestra "3 años en Java" → PARCIAL (lenguaje diferente)
     * Ejemplo: JD requiere "Ingeniería en Sistemas", CV muestra "Ingeniería en Computación" → PARCIAL (similar pero no exacto)
   - Sin coincidencia: El CV NO menciona nada relacionado
     * Ejemplo: JD requiere "Python", CV muestra solo "Java y C++" → NINGUNA
     * Ejemplo: JD requiere "Experiencia en banca", CV muestra solo "Retail" → NINGUNA (a menos que sea transferible)

PASO 5: CALCULA MÉTRICAS DE COINCIDENCIA:
   - Cuenta cuántos requisitos OBLIGATORIOS del JD se cumplen
   - Cuenta cuántos requisitos OBLIGATORIOS del JD NO se cumplen
   - Calcula el porcentaje: (requisitos cumplidos / total requisitos obligatorios) × 100
   - Si el porcentaje es < 50%, el nivel DEBE ser "low" o "insufficient"
   - Si el porcentaje es 50-70%, el nivel DEBE ser "medium" o "low"
   - Si el porcentaje es > 70% Y hay coincidencias EXACTAS, puede ser "high" o "medium"

PASO 6: PENALIZA AUSENCIAS (OBLIGATORIO):
   - Si faltan requisitos OBLIGATORIOS del JD, el candidato NO puede tener un score alto
   - Si el CV está en un área completamente diferente, usa "insufficient"
   - Si hay más requisitos NO cumplidos que cumplidos, el nivel DEBE ser "low" o "insufficient"
   - Si faltan MÁS DE 2 requisitos obligatorios, el nivel NO puede ser "high"
   - Si el área funcional es diferente y NO transferible, el nivel DEBE ser "insufficient"

REGLAS ESTRICTAS DE ÉTICA Y EQUIDAD:

1. PROPÓSITO LIMITADO: Solo analiza información laboral (experiencia, educación, certificaciones, logros). 
   IMPORTANTE: NO tomas decisiones finales. Tu función es proporcionar análisis objetivo y recomendaciones 
   basadas en criterios medibles. La decisión final de contratar, rechazar o entrevistar SIEMPRE la toma un humano.

2. VARIABLES VÁLIDAS: Considera SOLO:
   - Experiencia profesional (años, tipo, relevancia)
   - Educación y formación (títulos, áreas de estudio)
   - Certificaciones profesionales
   - Habilidades técnicas específicas
   - Logros profesionales medibles
   
   PROHIBIDO usar, inferir o mencionar:
   - Edad, género, raza, etnia, color de piel
   - Religión, creencias, orientación sexual
   - Estado civil, situación familiar, hijos
   - Nacionalidad, origen étnico, lugar de nacimiento
   - Discapacidad, condición médica, salud
   - Apariencia física, peso, altura
   - Nombre que pueda indicar género u origen
   - Cualquier dato que no sea directamente relevante para el desempeño laboral

3. EQUIDAD Y NO DISCRIMINACIÓN:
   - Evalúa SOLO competencias y habilidades relevantes para el puesto
   - NO penalices por "sobrecalificación" o "subcalificación" si las habilidades son transferibles
   - NO asumas que ciertos tipos de experiencia son "mejores" que otros sin justificación objetiva
   - Considera experiencia transferible de manera justa (ej: experiencia en retail puede ser relevante para banca en ciertos roles)
   - NO uses estereotipos sobre industrias, empresas o tipos de experiencia
   - Evalúa habilidades, no el "prestigio" de universidades o empresas previas

4. LENGUAJE INCLUSIVO Y NEUTRO:
   - Usa lenguaje que no asuma género (ej: "la persona" en lugar de "el candidato")
   - Evita términos que puedan tener connotaciones negativas sobre grupos
   - NO uses términos como "joven", "maduro", "fresco", "experimentado" de manera que pueda indicar edad
   - NO uses términos que puedan indicar género o características personales

3. COMPARACIÓN ESTRICTA:
   - NO asumas que un candidato es "bueno" solo porque tiene experiencia general
   - REQUIERE coincidencias específicas entre JD y CV
   - Si el JD pide "5 años en desarrollo Python" y el CV tiene "3 años en Java", es INSUFICIENTE
   - Si el JD pide "Ingeniería en Sistemas" y el CV tiene "Administración", es INSUFICIENTE
   - Si el JD pide "Experiencia en banca" y el CV tiene "Experiencia en retail", evalúa si es TRANSFERIBLE o NO

4. NIVELES DE CONFIANZA (USA ESTRICTAMENTE):
   - "high": El CV cumple con TODOS los requisitos principales del JD y tiene experiencia directa relevante
   - "medium": El CV cumple con la mayoría de requisitos pero faltan algunos importantes o la experiencia es parcialmente relevante
   - "low": El CV cumple con pocos requisitos o la experiencia es en un área diferente pero potencialmente transferible
   - "insufficient": El CV NO cumple con los requisitos principales, está en un área completamente diferente, o falta información crítica

5. RAZONAMIENTO VERIFICABLE: 
   - Para cada criterio, indica QUÉ del JD se compara con QUÉ del CV
   - Ejemplo: "JD requiere: 5 años en Python. CV muestra: 2 años en Java. Coincidencia: PARCIAL (lenguaje diferente)"
   - NO uses lenguaje vago como "tiene experiencia" sin especificar qué y cuánta

6. LENGUAJE NEUTRAL: 
   - Usa descripciones objetivas y comparativas
   - PROHIBIDO usar adjetivos subjetivos como: excelente, malo, bueno, terrible, perfecto, increíble, etc.
   - Usa: "cumple", "no cumple", "parcialmente", "específicamente menciona", "no menciona"

7. PESOS DE CRITERIOS:
   - Asigna pesos más altos (0.4-0.5) a requisitos OBLIGATORIOS del JD
   - Asigna pesos medios (0.2-0.3) a requisitos importantes pero no críticos
   - Asigna pesos bajos (0.1-0.15) a requisitos deseables o complementarios
   - La suma de pesos debe aproximarse a 1.0

EJEMPLOS DE COMPARACIÓN (REFERENCIA):

EJEMPLO 1 - COINCIDENCIA EXACTA (BUENO):
JD requiere: "5 años en desarrollo Python, experiencia en Django, Ingeniería en Sistemas"
CV muestra: "6 años desarrollando en Python, 4 años usando Django, Ingeniería en Sistemas"
Resultado: Coincidencia EXACTA en todos los requisitos → "high"

EJEMPLO 2 - SIN COINCIDENCIA (MALO):
JD requiere: "5 años en desarrollo Python, experiencia en banca"
CV muestra: "3 años en Java, 2 años en C++, experiencia en retail"
Resultado: Lenguaje diferente (Python vs Java), industria diferente (banca vs retail) → "insufficient"

EJEMPLO 3 - COINCIDENCIA PARCIAL:
JD requiere: "5 años en desarrollo Python"
CV muestra: "3 años en Java, conocimiento básico de Python"
Resultado: Experiencia insuficiente (3 años vs 5 requeridos), lenguaje parcialmente relacionado → "low"

EJEMPLO 4 - ÁREA FUNCIONAL DIFERENTE:
JD requiere: "Desarrollador Backend Python"
CV muestra: "Diseñador UX con 5 años de experiencia"
Resultado: Área funcional completamente diferente (desarrollo vs diseño) → "insufficient"

EJEMPLO 5 - TRANSFERIBLE:
JD requiere: "Analista de Datos en sector financiero, Python, SQL"
CV muestra: "Analista de Datos en retail, Python, SQL, 4 años"
Resultado: Mismas habilidades técnicas, industria diferente pero transferible → "medium"

JOB DESCRIPTION (referencia principal - REQUISITOS A CUMPLIR):

$job_description

CV ANALIZADO ($filename - COMPARAR CON REQUISITOS ARRIBA):

$cv_content

INSTRUCCIONES FINALES (SEGUIR EN ORDEN):

1. PRIMERO: Verifica el área funcional. Si es completamente diferente y NO transferible → "insufficient" inmediatamente

2. SEGUNDO: Compara CADA requisito OBLIGATORIO del JD con el CV de manera objetiva y justa
   - Para cada requisito, indica: "JD requiere X, CV muestra Y, Coincidencia: EXACTA/PARCIAL/NINGUNA"

3. TERCERO: Calcula métricas:
   - Total requisitos obligatorios en JD: ___
   - Requisitos cumplidos (EXACTA o PARCIAL relevante): ___
   - Requisitos NO cumplidos: ___
   - Porcentaje de cumplimiento: ___%
   - Si porcentaje < 50% → "insufficient" o "low"
   - Si porcentaje 50-70% → "low" o "medium"
   - Si porcentaje > 70% y hay coincidencias EXACTAS → "medium" o "high"

4. CUARTO: Si el CV NO menciona algo que el JD requiere, indícalo claramente en "missing_information" pero sin juicios de valor

5. QUINTO: Si el CV está en un área diferente, evalúa transferibilidad:
   - Si las habilidades técnicas son las mismas pero la industria es diferente → puede ser transferible
   - Si las habilidades técnicas son diferentes → NO es transferible
   - Si el área funcional es diferente (ej: desarrollo vs diseño) → NO es transferible

6. SEXTO: Reglas de penalización ESTRICTAS:
   - Si hay MÁS requisitos NO cumplidos que cumplidos → nivel DEBE ser "low" o "insufficient"
   - Si faltan MÁS DE 2 requisitos obligatorios → nivel NO puede ser "high"
   - Si el área funcional es diferente y NO transferible → nivel DEBE ser "insufficient"
   - NO des puntajes altos por "buena actitud", "experiencia general" o "potencial" si no cumple requisitos específicos

7. SÉPTIMO: EQUIDAD Y NO DISCRIMINACIÓN:
   - Si un candidato tiene experiencia transferible pero en diferente industria, evalúa las habilidades técnicas, NO el "prestigio" de la industria
   - NO penalices por tener experiencia en industrias "menos prestigiosas" si las habilidades son relevantes
   - Evalúa competencias, NO el nombre de la universidad o empresa previa

8. OCTAVO: VERIFICA SESGOS antes de responder:
   - ¿Estoy asumiendo que ciertos tipos de experiencia son "mejores" sin justificación objetiva?
   - ¿Estoy penalizando por industria o tipo de empresa sin razón técnica?
   - ¿Estoy usando estereotipos sobre tipos de educación o formación?
   - ¿Mi análisis está basado en hechos objetivos o en prejuicios?

EVALUACIÓN DE RIESGOS (OBLIGATORIO):

Identifica y categoriza los riesgos encontrados en el análisis. Los riesgos pueden ser:

1. RIESGOS TÉCNICOS:
   - Falta de habilidades técnicas específicas requeridas
   - Experiencia insuficiente en tecnologías críticas
   - Brechas en conocimientos técnicos obligatorios

2. RIESGOS DE EXPERIENCIA:
   - Años de experiencia por debajo del mínimo requerido
   - Falta de experiencia en industria/sector específico
   - Ausencia de experiencia en responsabilidades clave

3. RIESGOS DE FORMACIÓN:
   - Falta de educación/certificaciones obligatorias
   - Título/área de estudio no alineada con requisitos
   - Certificaciones vencidas o no mencionadas

4. RIESGOS DE ÁREA FUNCIONAL:
   - Área funcional completamente diferente y no transferible
   - Cambio de carrera sin justificación de transferibilidad
   - Falta de experiencia en el tipo de rol

5. RIESGOS DE CUMPLIMIENTO:
   - Múltiples requisitos obligatorios no cumplidos
   - Porcentaje de cumplimiento muy bajo (<50%)
   - Más requisitos faltantes que cumplidos

Para cada riesgo identificado, indica:
- "category": "técnico|experiencia|formación|área_funcional|cumplimiento"
- "level": "alto|medio|bajo" (alto: bloqueante, medio: importante, bajo: menor)
- "description": "Descripción específica del riesgo y su impacto"

FORMATO DE RESPUESTA (OBLIGATORIO):

Responde EXACTAMENTE en este formato JSON:

{{
  "recommendation": "(a) Tu recomendación objetiva. DEBE incluir: 1) Área funcional del JD vs CV y si es transferible, 2) Lista específica de qué requisitos del JD cumple (con detalles), 3) Lista específica de qué requisitos NO cumple (con detalles), 4) Porcentaje estimado de cumplimiento. Si no cumple requisitos principales, indícalo claramente.",
  "objective_criteria": [
    {{
      "name": "Nombre del criterio (ej: 'Experiencia en Python')",
      "value": "Comparación específica: JD requiere X, CV muestra Y. Coincidencia: EXACTA/PARCIAL/NINGUNA. Justificación: [por qué es exacta/parcial/ninguna]",
      "weight": 0.35
    }}
  ],
  "confidence_level": "high|medium|low|insufficient",
  "confidence_explanation": "Explicación detallada DEBE incluir: 1) Área funcional: [coincide/diferente/transferible], 2) Requisitos cumplidos: X de Y, 3) Porcentaje de cumplimiento: Z%, 4) Razón del nivel asignado basado en las métricas calculadas",
  "missing_information": ["Requisito OBLIGATORIO del JD que NO está en el CV (específico)", "Otro requisito obligatorio faltante (específico)"],
  "risks": [
    {{
      "category": "técnico|experiencia|formación|área_funcional|cumplimiento",
      "level": "alto|medio|bajo",
      "description": "Descripción específica del riesgo y su impacto potencial en el desempeño del puesto"
    }}
  ]
}}

VALIDACIÓN FINAL (ANTES DE RESPONDER):

✓ Verifiqué el área funcional: [coincide/diferente/transferible]
✓ Conté requisitos obligatorios del JD: [número]
✓ Conté requisitos cumplidos: [número]
✓ Calculé porcentaje de cumplimiento: [%]
✓ Verifiqué que el nivel de confianza coincida con las métricas
✓ Verifiqué que no haya sesgos en mi evaluación
✓ Verifiqué que no use lenguaje subjetivo
✓ Verifiqué que no infiera atributos personales
✓ Verifiqué que cada criterio muestre comparación específica JD vs CV

IMPORTANTE:
- La recomendación DEBE mencionar: área funcional, requisitos cumplidos (lista), requisitos NO cumplidos (lista), porcentaje de cumplimiento
- Los criterios DEBEN mostrar: "JD requiere X, CV muestra Y, Coincidencia: [tipo], Justificación: [razón]"
- El nivel de confianza DEBE reflejar las métricas calculadas (porcentaje de cumplimiento)
- Si faltan requisitos OBLIGATORIOS, el nivel DEBE ser "low" o "insufficient"
- Si el porcentaje de cumplimiento es < 50%, el nivel DEBE ser "insufficient" o "low"
- Si el área funcional es diferente y NO transferible, el nivel DEBE ser "insufficient"
- NO uses lenguaje subjetivo ni adjetivos de valor
- NO infieras atributos personales
- NO asumas que "experiencia general" es suficiente si el JD requiere algo específico
- NO des puntajes altos sin coincidencias reales y específicas
- Recuerda: esto es APOYO, no una decisión final"""
        
        # SIN RESTRICCIONES: Usar CV y JD completos sin truncamiento
        # Los modelos modernos (GPT-4 Turbo, Claude Sonnet 4, Gemini 2.5 Pro) tienen contextos
        # suficientemente grandes para manejar CVs y JDs de cualquier tamaño razonable
        logger.info(
            f"Analizando candidato {filename} con JD de {len(job_description)} caracteres "
            f"y CV de {len(cv_content)} caracteres (sin restricciones de tamaño)"
        )
        
        # Usar Template en lugar de .format() para evitar problemas con llaves {}
        # Template usa $variable en lugar de {variable}, lo que es más seguro cuando el contenido tiene llaves
        # NO necesitamos escapar llaves porque Template no las interpreta como placeholders
        try:
            template = Template(prompt_base)
            final_prompt = template.safe_substitute(
                job_description=job_description,
                cv_content=cv_content,
                filename=filename
            )
        except Exception as e:
            # Si hay un error, registrar información de diagnóstico
            logger.error(f"❌ Error al construir prompt con Template: {type(e).__name__} - {str(e)}")
            logger.error(f"🔍 JD tiene {len(job_description)} caracteres")
            logger.error(f"🔍 CV tiene {len(cv_content)} caracteres")
            logger.error(f"🔍 JD (primeros 500 chars): {job_description[:500]}")
            logger.error(f"🔍 CV (primeros 500 chars): {cv_content[:500]}")
            raise
        
        # Logging informativo (no restrictivo)
        final_tokens = self._estimate_tokens(final_prompt)
        logger.debug(
            f"Prompt final para {filename}: ~{final_tokens} tokens estimados "
            f"(JD: ~{self._estimate_tokens(job_description)}, CV: ~{self._estimate_tokens(cv_content)})"
        )
        
        return final_prompt
    
    async def _call_ai(self, prompt: str, model_id: Optional[str] = None) -> str:
        """
        Llama al servicio de IA configurado
        """
        model = (model_id or self.default_model).lower()

        if model.startswith("gpt") and self.openai_client:
            return await self._call_openai(prompt, model_id or self.default_model)
        elif model.startswith("claude") and self.anthropic_client:
            return await self._call_anthropic(prompt, model_id or self.default_model)
        elif model.startswith("gemini") and self.gemini_configured:
            return await self._call_gemini(prompt, model_id or self.default_model)
        else:
            raise ValueError("No hay servicio de IA configurado o modelo no válido")
    
    async def _call_openai(self, prompt: str, model: str) -> str:
        """Llamar a OpenAI"""
        try:
            # Mapear modelos a versiones con contextos grandes
            model_map = {
                "gpt-4": "gpt-4-turbo-preview",  # 128k tokens
                "gpt-4-turbo": "gpt-4-turbo-preview",  # 128k tokens
                "gpt-4-turbo-preview": "gpt-4-turbo-preview",  # 128k tokens
            }
            actual_model = model_map.get(model.lower(), model)
            
            response = self.openai_client.chat.completions.create(
                model=actual_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un asistente ético de Recursos Humanos especializado en comparación estricta entre Job Descriptions y CVs. Evalúas candidatos comparando DIRECTAMENTE los requisitos del JD con la experiencia del CV. Eres ESTRICTO: no das puntajes altos si no hay coincidencias reales. Aplicas principios de objetividad, neutralidad, equidad, no discriminación y privacidad. NO usas, infieres ni mencionas datos personales protegidos. Evalúas solo competencias y habilidades relevantes para el desempeño laboral. Eres consciente de sesgos y los evitas activamente. IMPORTANTE: NO tomas decisiones finales, solo proporcionas análisis y recomendaciones para que un humano tome la decisión."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=4000,  # Aumentado para respuestas más completas
            )
            content = response.choices[0].message.content
            if not content or content.strip() == "":
                raise ValueError("La respuesta de OpenAI está vacía")
            return content
        except Exception as e:
            logger.error(f"Error llamando OpenAI: {e}")
            raise
    
    async def _call_anthropic(self, prompt: str, model: str) -> str:
        """Llamar a Anthropic Claude"""
        try:
            # Claude Sonnet 4 tiene 200k tokens de contexto, suficiente para CVs y JDs grandes
            model_map = {
                "claude-opus-4": "claude-opus-4-20250514",  # 200k tokens
                "claude-sonnet-4": "claude-sonnet-4-20250514",  # 200k tokens
                "claude-haiku-3.5": "claude-3-5-haiku-20241022",  # 200k tokens
            }
            anthropic_model = model_map.get(model.lower(), "claude-sonnet-4-20250514")
            
            message = self.anthropic_client.messages.create(
                model=anthropic_model,
                max_tokens=4000,  # Aumentado para respuestas más completas
                temperature=0.1,
                system="Eres un asistente ético de Recursos Humanos especializado en comparación estricta entre Job Descriptions y CVs. Evalúas candidatos comparando DIRECTAMENTE los requisitos del JD con la experiencia del CV. Eres ESTRICTO: no das puntajes altos si no hay coincidencias reales. Aplicas principios de objetividad, neutralidad, equidad, no discriminación y privacidad. NO usas, infieres ni mencionas datos personales protegidos. Evalúas solo competencias y habilidades relevantes para el desempeño laboral. Eres consciente de sesgos y los evitas activamente. IMPORTANTE: NO tomas decisiones finales, solo proporcionas análisis y recomendaciones para que un humano tome la decisión.",
                messages=[{"role": "user", "content": prompt}],
            )
            if not message.content or len(message.content) == 0:
                raise ValueError("La respuesta de Anthropic está vacía")
            content = message.content[0].text
            if not content or content.strip() == "":
                raise ValueError("La respuesta de Anthropic está vacía")
            return content
        except Exception as e:
            logger.error(f"Error llamando Anthropic: {e}")
            raise
    
    async def _call_gemini(self, prompt: str, model: str) -> str:
        """Llamar a Google Gemini"""
        try:
            # Gemini 2.5 Pro tiene 1M tokens de contexto, más que suficiente
            model_map = {
                "gemini-2.5-pro": "gemini-2.5-pro",  # 1M tokens
                "gemini-2.5-flash": "gemini-2.5-flash",  # 1M tokens
                "gemini-1.5-pro": "gemini-1.5-pro",  # 1M tokens
            }
            gemini_model_id = model_map.get(model.lower(), "gemini-2.5-pro")
            
            genai_model = genai.GenerativeModel(gemini_model_id)
            response = genai_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=4000,  # Aumentado para respuestas más completas
                ),
                safety_settings=[
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_NONE"
                    },
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_NONE"
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_NONE"
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_NONE"
                    }
                ]
            )
            if not response or not response.text:
                raise ValueError("La respuesta de Gemini está vacía")
            content = response.text
            if not content or content.strip() == "":
                raise ValueError("La respuesta de Gemini está vacía")
            return content
        except Exception as e:
            logger.error(f"Error llamando Gemini: {e}")
            raise
    
    def _normalize_dict_keys(self, obj):
        """
        Normaliza recursivamente todas las claves de un diccionario,
        removiendo espacios, saltos de línea y caracteres problemáticos.
        Esto previene KeyError por claves con formato extraño como '\n "recommendation"'
        """
        if isinstance(obj, dict):
            normalized = {}
            for key, value in obj.items():
                try:
                    # Normalizar la clave de forma MUY agresiva
                    normalized_key = str(key)
                    
                    # Paso 1: Remover TODOS los saltos de línea, retornos de carro y tabs
                    normalized_key = normalized_key.replace('\n', '').replace('\r', '').replace('\t', '')
                    
                    # Paso 2: Remover espacios al inicio y final
                    normalized_key = normalized_key.strip()
                    
                    # Paso 3: Remover comillas al inicio y final (puede haber múltiples)
                    # Manejar casos como: '\n  "recommendation"' o '"recommendation"' o "'recommendation'"
                    while len(normalized_key) >= 2:
                        if (normalized_key.startswith('"') and normalized_key.endswith('"')) or \
                           (normalized_key.startswith("'") and normalized_key.endswith("'")):
                            normalized_key = normalized_key[1:-1].strip()
                        else:
                            break
                    
                    # Paso 4: Remover espacios múltiples y normalizar
                    normalized_key = ' '.join(normalized_key.split())
                    
                    # Paso 5: Si después de todo esto la clave está vacía, usar un nombre por defecto
                    if not normalized_key:
                        normalized_key = f"key_{len(normalized)}"
                    
                    # Paso 6: Si hay claves duplicadas después de normalizar, agregar sufijo
                    if normalized_key in normalized:
                        counter = 1
                        original_key = normalized_key
                        while normalized_key in normalized:
                            normalized_key = f"{original_key}_{counter}"
                            counter += 1
                    
                    # Normalizar recursivamente el valor
                    normalized[normalized_key] = self._normalize_dict_keys(value)
                    
                except Exception as e:
                    # Si hay cualquier error normalizando esta clave, usar un nombre seguro
                    logger.warning(f"⚠️ Error normalizando clave '{key}': {str(e)}. Usando nombre por defecto.")
                    safe_key = f"key_{len(normalized)}_{hash(str(key)) % 10000}"
                    normalized[safe_key] = self._normalize_dict_keys(value)
            
            return normalized
        elif isinstance(obj, list):
            return [self._normalize_dict_keys(item) for item in obj]
        else:
            return obj
    
    def _parse_response(
        self,
        raw_response: str,
        candidate_id: Optional[str],
        filename: str
    ) -> CandidateAnalysisResult:
        """
        Parsea la respuesta de IA al formato requerido
        """
        import json
        import re
        
        # Validar que la respuesta no esté vacía
        if not raw_response or not raw_response.strip():
            logger.error(f"Respuesta de IA vacía para candidato {candidate_id or filename}")
            raise ValueError("La respuesta de IA está vacía")
        
        # Limpiar la respuesta: remover markdown code blocks si existen
        cleaned_response = raw_response.strip()
        
        # Remover markdown code blocks (```json ... ``` o ``` ... ```)
        cleaned_response = re.sub(r'```(?:json)?\s*\n?', '', cleaned_response, flags=re.IGNORECASE)
        cleaned_response = re.sub(r'```\s*$', '', cleaned_response, flags=re.MULTILINE)
        cleaned_response = cleaned_response.strip()
        
        # Verificar si la respuesta parece estar incompleta (termina abruptamente)
        if cleaned_response and not cleaned_response.endswith('}') and '{' in cleaned_response:
            # Contar llaves para ver si está balanceado
            open_braces = cleaned_response.count('{')
            close_braces = cleaned_response.count('}')
            if open_braces > close_braces:
                logger.warning(
                    f"Respuesta de IA parece incompleta para candidato {candidate_id or filename}. "
                    f"Llaves abiertas: {open_braces}, cerradas: {close_braces}"
                )
        
        # Intentar múltiples estrategias para extraer JSON
        data = None
        json_str = None
        
        # Estrategia 1: Buscar JSON entre llaves (más específico, busca desde la primera { hasta la última })
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', cleaned_response, re.DOTALL)
        if json_match:
            json_str = json_match.group()
        else:
            # Estrategia 2: Buscar desde la primera { hasta el final
            json_match = re.search(r'\{.*$', cleaned_response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
        
        # Si encontramos un candidato a JSON, intentar parsearlo
        if json_str:
            try:
                # Limpiar el JSON string de posibles caracteres problemáticos
                json_str_clean = json_str.strip()
                # Remover posibles saltos de línea al inicio que puedan causar problemas
                while json_str_clean.startswith('\n') or json_str_clean.startswith('\r'):
                    json_str_clean = json_str_clean[1:].strip()
                
                # Intentar parsear
                data = json.loads(json_str_clean)
                
                # LOGGING: Mostrar claves originales ANTES de normalizar
                if isinstance(data, dict):
                    original_keys_before = list(data.keys())
                    logger.info(f"🔑 Claves originales del JSON (antes de normalizar): {original_keys_before}")
                    logger.info(f"🔑 Tipos de claves: {[type(k).__name__ for k in original_keys_before]}")
                    logger.info(f"🔑 Representación de claves: {[repr(k) for k in original_keys_before[:5]]}")
                
                # NORMALIZAR TODAS LAS CLAVES DEL DICCIONARIO RECURSIVAMENTE INMEDIATAMENTE
                # Esto previene KeyError por claves con formato extraño como '\n "recommendation"'
                if isinstance(data, dict):
                    data = self._normalize_dict_keys(data)
                    
                    # LOGGING: Mostrar claves después de normalizar
                    normalized_keys_after = list(data.keys())
                    logger.info(f"✅ Claves normalizadas del JSON (después de normalizar): {normalized_keys_after}")
                
            except json.JSONDecodeError as e:
                logger.warning(f"Error parseando JSON (estrategia 1): {str(e)}")
                logger.debug(f"JSON intentado (primeros 500 chars): {json_str[:500]}...")
                
                # Estrategia 3: Intentar encontrar JSON válido buscando desde el inicio
                # Buscar el primer { y luego encontrar el } correspondiente balanceado
                start_idx = cleaned_response.find('{')
                if start_idx != -1:
                    brace_count = 0
                    end_idx = start_idx
                    for i in range(start_idx, len(cleaned_response)):
                        if cleaned_response[i] == '{':
                            brace_count += 1
                        elif cleaned_response[i] == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                end_idx = i + 1
                                break
                    
                    if brace_count == 0:
                        json_str = cleaned_response[start_idx:end_idx].strip()
                        # Limpiar nuevamente
                        while json_str.startswith('\n') or json_str.startswith('\r'):
                            json_str = json_str[1:].strip()
                        try:
                            data = json.loads(json_str)
                            # NORMALIZAR TODAS LAS CLAVES DESPUÉS DE PARSEAR INMEDIATAMENTE
                            if isinstance(data, dict):
                                data = self._normalize_dict_keys(data)
                        except json.JSONDecodeError as e2:
                            logger.warning(f"Error parseando JSON (estrategia 2): {str(e2)}")
                            logger.warning(f"JSON intentado (primeros 1000 chars): {json_str[:1000]}...")
                            logger.warning(f"JSON intentado (últimos 500 chars): {json_str[-500:] if len(json_str) > 500 else json_str}")
                            logger.warning(f"Posición del error: {e2.pos if hasattr(e2, 'pos') else 'N/A'}")
                            
                            # Estrategia 4: Intentar reparar JSON común malformado
                            try:
                                json_str_fixed = json_str
                                
                                # Reparación 1: Remover trailing commas antes de } o ]
                                json_str_fixed = re.sub(r',\s*}', '}', json_str_fixed)
                                json_str_fixed = re.sub(r',\s*]', ']', json_str_fixed)
                                
                                # Reparación 2: Remover comentarios de línea (// comentario)
                                json_str_fixed = re.sub(r'//.*?$', '', json_str_fixed, flags=re.MULTILINE)
                                
                                # Reparación 3: Remover comentarios de bloque (/* comentario */)
                                json_str_fixed = re.sub(r'/\*.*?\*/', '', json_str_fixed, flags=re.DOTALL)
                                
                                # Reparación 4: Escapar caracteres de control no válidos
                                json_str_fixed = json_str_fixed.replace('\x00', '').replace('\x01', '').replace('\x02', '')
                                
                                # Reparación 5: Arreglar comillas simples que deberían ser dobles en keys
                                json_str_fixed = re.sub(r"'(\w+)'\s*:", r'"\1":', json_str_fixed)
                                
                                # Reparación 6: Arreglar strings con comillas simples que deberían ser dobles
                                json_str_fixed = re.sub(r":\s*'([^']*)'", r': "\1"', json_str_fixed)
                                
                                # Reparación 7: Remover saltos de línea dentro de strings (mantener solo espacios)
                                # Esto es complejo, mejor intentar parsear primero
                                
                                data = json.loads(json_str_fixed)
                                if isinstance(data, dict):
                                    data = self._normalize_dict_keys(data)
                                    logger.info("JSON reparado exitosamente usando estrategia 4")
                            except Exception as e3:
                                logger.warning(f"Error reparando JSON (estrategia 4): {str(e3)}")
                                
                                # Estrategia 5: Intentar extraer JSON de texto mixto (texto + JSON)
                                try:
                                    # Buscar el bloque JSON más grande posible
                                    # Encontrar todos los bloques { ... } y tomar el más grande
                                    json_blocks = re.findall(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', cleaned_response, re.DOTALL)
                                    if json_blocks:
                                        # Ordenar por tamaño y tomar el más grande
                                        largest_block = max(json_blocks, key=len)
                                        data = json.loads(largest_block)
                                        if isinstance(data, dict):
                                            data = self._normalize_dict_keys(data)
                                            logger.info("JSON extraído exitosamente usando estrategia 5 (bloque más grande)")
                                except Exception as e4:
                                    logger.warning(f"Error en estrategia 5: {str(e4)}")
                                    logger.debug(f"Respuesta completa (primeros 2000 chars): {raw_response[:2000]}")
                    else:
                        logger.warning(f"JSON no balanceado: {brace_count} llaves abiertas sin cerrar")
        
        # Si logramos parsear el JSON, procesarlo
        if data:
            # Validar que data sea un diccionario ANTES de cualquier acceso
            if not isinstance(data, dict):
                logger.error(
                    f"El JSON parseado no es un diccionario para candidato {candidate_id or filename}. "
                    f"Tipo: {type(data)}, Valor: {str(data)[:200]}"
                )
                # Continuar al fallback
                data = None
            else:
                # Logging para debugging: mostrar las claves originales antes de normalizar
                original_keys = list(data.keys())
                logger.debug(
                    f"Claves originales del JSON parseado para {candidate_id or filename}: {original_keys}"
                )
                # La normalización ya se hizo arriba, solo validar campos
                # Validar que tenga al menos algunos campos esperados
                if not any(key in data for key in ["recommendation", "objective_criteria", "confidence_level"]):
                    logger.warning(
                        f"El JSON parseado no tiene los campos esperados para candidato {candidate_id or filename}. "
                        f"Campos encontrados: {list(data.keys()) if isinstance(data, dict) else 'N/A'}"
                    )
        
        # Si logramos parsear el JSON y es un diccionario válido, procesarlo
        if data and isinstance(data, dict):
            try:
                # Crear un wrapper seguro que siempre use .get() y maneje claves normalizadas
                # Esto previene cualquier KeyError, incluso si hay claves con formato extraño
                safe_data = {}
                # Usar .items() con try/except para manejar cualquier formato de clave
                try:
                    for key, value in data.items():
                        try:
                            # Normalizar la clave para buscar
                            normalized_key = str(key).strip().replace('\n', '').replace('\r', '')
                            # Remover comillas
                            while (normalized_key.startswith('"') and normalized_key.endswith('"')) or \
                                  (normalized_key.startswith("'") and normalized_key.endswith("'")):
                                if len(normalized_key) >= 2:
                                    normalized_key = normalized_key[1:-1].strip()
                                else:
                                    break
                            # Si después de normalizar la clave está vacía, usar un nombre por defecto
                            if not normalized_key:
                                normalized_key = f"key_{len(safe_data)}"
                            # Guardar con clave normalizada
                            safe_data[normalized_key] = value
                        except (KeyError, AttributeError, TypeError) as e:
                            # Si hay cualquier error al procesar esta clave, registrar y continuar
                            logger.warning(f"Error normalizando clave '{key}': {type(e).__name__} - {str(e)}. Omitiendo esta clave.")
                            continue
                        except Exception as e:
                            # Si hay cualquier otro error al procesar esta clave, registrar y continuar
                            logger.warning(f"Error inesperado normalizando clave '{key}': {type(e).__name__} - {str(e)}. Omitiendo esta clave.")
                            continue
                    
                    # Usar safe_data en lugar de data para todos los accesos
                    data = safe_data
                except (KeyError, AttributeError, TypeError) as e:
                    # Si hay un error al iterar sobre data.items(), registrar y usar data original
                    logger.error(f"Error iterando sobre claves del diccionario: {type(e).__name__} - {str(e)}")
                    logger.error(f"Tipo de data: {type(data)}, Claves disponibles: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
                    # Continuar con data original pero usando solo .get()
                    pass
                
                # Convertir criterios
                criteria = []
                objective_criteria_data = data.get("objective_criteria", [])
                if not isinstance(objective_criteria_data, list):
                    logger.warning(f"objective_criteria no es una lista, es {type(objective_criteria_data)}")
                    objective_criteria_data = []
                
                for crit in objective_criteria_data:
                    if not isinstance(crit, dict):
                        logger.warning(f"Criterio no es un diccionario: {type(crit)}")
                        continue
                    criteria.append(ObjectiveCriterion(
                        name=crit.get("name", ""),
                        value=crit.get("value", ""),
                        weight=crit.get("weight")
                    ))
                
                # Determinar nivel de confianza
                conf_str = data.get("confidence_level", "medium").lower()
                if conf_str == "high":
                    confidence = ConfidenceLevel.HIGH
                elif conf_str == "low":
                    confidence = ConfidenceLevel.LOW
                elif conf_str == "insufficient":
                    confidence = ConfidenceLevel.INSUFFICIENT
                else:
                    confidence = ConfidenceLevel.MEDIUM
                
                # VALIDACIÓN POST-ANÁLISIS: Ajustar nivel si hay inconsistencias
                missing_info = data.get("missing_information", [])
                if not isinstance(missing_info, list):
                    logger.warning(f"missing_information no es una lista, es {type(missing_info)}")
                    missing_info = []
                missing_count = len(missing_info) if missing_info else 0
                
                # Si el nivel es "high" pero hay más de 2 requisitos faltantes, ajustar
                if confidence == ConfidenceLevel.HIGH and missing_count > 2:
                    logger.warning(
                        f"Inconsistencia detectada: confidence_level='high' pero hay {missing_count} requisitos faltantes. "
                        f"Ajustando a 'medium' para candidato {candidate_id or filename}"
                    )
                    confidence = ConfidenceLevel.MEDIUM
                
                # Si el nivel es "high" o "medium" pero hay más de 3 requisitos faltantes, ajustar a "low"
                if confidence in [ConfidenceLevel.HIGH, ConfidenceLevel.MEDIUM] and missing_count > 3:
                    logger.warning(
                        f"Inconsistencia detectada: confidence_level='{confidence.value}' pero hay {missing_count} requisitos faltantes. "
                        f"Ajustando a 'low' para candidato {candidate_id or filename}"
                    )
                    confidence = ConfidenceLevel.LOW
                
                # Si hay más de 5 requisitos faltantes, forzar "insufficient"
                if missing_count > 5:
                    logger.warning(
                        f"Muchos requisitos faltantes ({missing_count}). Ajustando a 'insufficient' para candidato {candidate_id or filename}"
                    )
                    confidence = ConfidenceLevel.INSUFFICIENT
                
                # Verificar que haya criterios objetivos
                if not criteria or len(criteria) == 0:
                    logger.warning(f"No se encontraron criterios objetivos para {candidate_id or filename}")
                    # Crear criterio genérico
                    criteria = [
                        ObjectiveCriterion(
                            name="Análisis general",
                            value="Revisión manual requerida - criterios no especificados",
                            weight=1.0
                        )
                    ]
                
                # Extraer riesgos identificados
                risks_data = data.get("risks", [])
                if not isinstance(risks_data, list):
                    logger.warning(f"risks no es una lista, es {type(risks_data)}")
                    risks_data = []
                risks = []
                if risks_data:
                    for risk in risks_data:
                        if isinstance(risk, dict):
                            risks.append({
                                "category": risk.get("category", "cumplimiento"),
                                "level": risk.get("level", "medio"),
                                "description": risk.get("description", "Riesgo no especificado")
                            })
                
                # Si no hay riesgos explícitos pero hay muchos requisitos faltantes, generar riesgos automáticos
                if not risks and missing_count > 0:
                    if missing_count > 3:
                        risks.append({
                            "category": "cumplimiento",
                            "level": "alto",
                            "description": f"Faltan {missing_count} requisitos obligatorios del JD, lo que indica bajo nivel de alineación con el puesto"
                        })
                    elif missing_count > 1:
                        risks.append({
                            "category": "cumplimiento",
                            "level": "medio",
                            "description": f"Faltan {missing_count} requisitos obligatorios del JD que podrían afectar el desempeño"
                        })
                
                # Si el área funcional es diferente, agregar riesgo
                confidence_explanation = data.get("confidence_explanation", "")
                if not isinstance(confidence_explanation, str):
                    confidence_explanation = str(confidence_explanation) if confidence_explanation else ""
                confidence_explanation_lower = confidence_explanation.lower()
                if "área funcional" in confidence_explanation_lower and ("diferente" in confidence_explanation_lower or "no transferible" in confidence_explanation_lower):
                    risks.append({
                        "category": "área_funcional",
                        "level": "alto",
                        "description": "El área funcional del CV no coincide con el JD y no es transferible"
                    })
                
                # Obtener recommendation de forma segura
                recommendation = data.get("recommendation", "Análisis no disponible")
                if not isinstance(recommendation, str):
                    recommendation = str(recommendation) if recommendation else "Análisis no disponible"
                
                # Obtener confidence_explanation de forma segura
                confidence_explanation_final = data.get("confidence_explanation", "")
                if not isinstance(confidence_explanation_final, str):
                    confidence_explanation_final = str(confidence_explanation_final) if confidence_explanation_final else ""
                
                return CandidateAnalysisResult(
                    candidateId=candidate_id,
                    filename=filename,
                    recommendation=recommendation,
                    objective_criteria=criteria,
                    confidence_level=confidence,
                    confidence_explanation=confidence_explanation_final,
                    missing_information=missing_info,
                    ethical_compliance=True,
                    risks=risks if risks else None
                )
            except KeyError as ke:
                # Capturar KeyError específicamente
                logger.error(
                    f"KeyError al procesar datos parseados para {candidate_id or filename}: {str(ke)}"
                )
                logger.error(f"Claves disponibles en data: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
                logger.error(f"Tipo de datos: {type(data)}, Contenido: {str(data)[:500] if data else 'None'}")
                # Continuar al fallback
                data = None
            except (ValueError, TypeError, AttributeError) as ve:
                # Capturar errores de tipo y valor
                logger.error(
                    f"Error de tipo/valor al procesar datos parseados para {candidate_id or filename}: {type(ve).__name__} - {str(ve)}"
                )
                logger.error(f"Tipo de datos: {type(data)}, Contenido: {str(data)[:500] if data else 'None'}")
                # Continuar al fallback
                data = None
            except Exception as e:
                # Capturar cualquier otro error
                error_type = type(e).__name__
                error_msg = str(e)
                logger.error(
                    f"Error inesperado procesando datos parseados para {candidate_id or filename}: {error_type} - {error_msg}"
                )
                logger.error(f"Tipo de datos: {type(data)}, Contenido: {str(data)[:500] if data else 'None'}")
                logger.debug(f"Traceback completo:", exc_info=True)
                # Continuar al fallback
                data = None
        
        # Fallback: respuesta básica cuando no se puede parsear o procesar
        if data is None:
            # Logging detallado para diagnóstico - MEJORADO PARA VISIBILIDAD
            logger.error("=" * 80)
            logger.error(f"❌ ERROR: No se pudo parsear respuesta de IA para candidato: {candidate_id or filename}")
            logger.error("=" * 80)
            logger.error(f"📏 Longitud total de respuesta: {len(raw_response)} caracteres")
            logger.error(f"📄 Respuesta completa de IA (primeros 3000 chars):")
            logger.error("-" * 80)
            logger.error(raw_response[:3000])
            logger.error("-" * 80)
            if len(raw_response) > 3000:
                logger.error(f"📄 Respuesta completa de IA (últimos 1000 chars):")
                logger.error("-" * 80)
                logger.error(raw_response[-1000:])
                logger.error("-" * 80)
            logger.error("=" * 80)
            
            # Intentar extraer información parcial incluso si el JSON está malformado
            partial_data = {}
            
            # Buscar campos clave usando regex como último recurso
            recommendation_match = re.search(r'"recommendation"\s*:\s*"([^"]+)"', raw_response, re.IGNORECASE | re.DOTALL)
            if recommendation_match:
                partial_data["recommendation"] = recommendation_match.group(1)
                logger.info("Se encontró 'recommendation' usando regex")
            
            confidence_match = re.search(r'"confidence_level"\s*:\s*"([^"]+)"', raw_response, re.IGNORECASE)
            if confidence_match:
                partial_data["confidence_level"] = confidence_match.group(1)
                logger.info("Se encontró 'confidence_level' usando regex")
            
            # Si encontramos al menos algunos datos parciales, intentar usarlos
            if partial_data:
                logger.info(f"Datos parciales extraídos: {list(partial_data.keys())}")
                try:
                    # Intentar construir un resultado con datos parciales
                    conf_str = partial_data.get("confidence_level", "medium").lower()
                    if conf_str == "high":
                        confidence = ConfidenceLevel.HIGH
                    elif conf_str == "low":
                        confidence = ConfidenceLevel.LOW
                    elif conf_str == "insufficient":
                        confidence = ConfidenceLevel.INSUFFICIENT
                    else:
                        confidence = ConfidenceLevel.MEDIUM
                    
                    return CandidateAnalysisResult(
                        candidateId=candidate_id,
                        filename=filename,
                        recommendation=partial_data.get("recommendation", "Análisis parcial disponible. La respuesta de IA tuvo problemas de formato pero se pudo extraer información básica."),
                        objective_criteria=[
                            ObjectiveCriterion(
                                name="Análisis parcial",
                                value="Se extrajo información parcial de la respuesta de IA. Algunos campos pueden estar incompletos.",
                                weight=0.5
                            )
                        ],
                        confidence_level=confidence,
                        confidence_explanation="Análisis parcial debido a problemas de formato en la respuesta de IA. Se recomienda revisar manualmente.",
                        missing_information=["Formato completo de respuesta de IA"],
                        ethical_compliance=True,
                        risks=[{
                            "category": "cumplimiento",
                            "level": "medio",
                            "description": "La respuesta de IA tuvo problemas de formato, se extrajo información parcial"
                        }]
                    )
                except Exception as e:
                    logger.error(f"Error construyendo resultado parcial: {str(e)}")
                    # Continuar con el fallback normal
        
        return CandidateAnalysisResult(
            candidateId=candidate_id,
            filename=filename,
            recommendation="Análisis requiere revisión manual debido a formato de respuesta inesperado de la IA. Por favor, intenta nuevamente o revisa el CV.",
            objective_criteria=[
                ObjectiveCriterion(
                    name="Error de procesamiento",
                    value=f"La respuesta de IA no pudo ser parseada correctamente. Error: {str(raw_response[:200]) if raw_response else 'Respuesta vacía'}",
                    weight=0.0
                )
            ],
            confidence_level=ConfidenceLevel.INSUFFICIENT,
            confidence_explanation="No se pudo procesar la respuesta de IA correctamente. La respuesta no estaba en el formato JSON esperado.",
            missing_information=["Formato de respuesta válido de IA"],
            ethical_compliance=True,
            risks=[{
                "category": "cumplimiento",
                "level": "alto",
                "description": "No se pudo procesar correctamente la respuesta de IA, requiere revisión manual o reintento"
            }]
        )
