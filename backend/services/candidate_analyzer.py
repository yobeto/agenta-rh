"""
Servicio de análisis de candidatos usando IA
Aplica principios éticos estrictos y formato de respuesta específico
"""
import os
import logging
from typing import List, Optional
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
        
        self.default_model = os.getenv("DEFAULT_AI_MODEL", "gpt-4")
    
    async def analyze_batch(
        self,
        job_description: str,
        candidates: List[CandidateDocument],
        model_id: Optional[str] = None
    ) -> List[CandidateAnalysisResult]:
        """
        Analiza múltiples candidatos a partir del texto extraído de sus CVs.
        """
        analyses: List[CandidateAnalysisResult] = []

        for candidate in candidates:
            prompt = self._build_ethical_prompt(
                job_description=job_description,
                cv_content=candidate.content,
                filename=candidate.filename
            )

            raw_response = await self._call_ai(prompt, model_id=model_id)
            analysis = self._parse_response(
                raw_response=raw_response,
                candidate_id=candidate.candidateId,
                filename=candidate.filename
            )
            analyses.append(analysis)

        return analyses

    def _build_ethical_prompt(
        self,
        job_description: str,
        cv_content: str,
        filename: str
    ) -> str:
        """
        Construye un prompt que aplica estrictamente los principios éticos
        y realiza comparación directa y estricta entre JD y CV
        """
        return f"""Eres un asistente de Recursos Humanos para agente-rh. Tu función es COMPARAR DIRECTAMENTE el CV del candidato con los REQUISITOS ESPECÍFICOS del Job Description.

MÉTODO DE ANÁLISIS (OBLIGATORIO):

1. IDENTIFICA REQUISITOS CLAVE del Job Description:
   - Título del puesto y área funcional
   - Años de experiencia requeridos
   - Educación/certificaciones obligatorias
   - Habilidades técnicas específicas
   - Competencias o conocimientos especializados
   - Responsabilidades principales

2. COMPARA PUNTO POR PUNTO con el CV:
   - ¿El candidato tiene la experiencia requerida? (años, tipo de experiencia)
   - ¿Tiene la educación/certificaciones necesarias?
   - ¿Posee las habilidades técnicas mencionadas en el JD?
   - ¿Su experiencia previa está relacionada con las responsabilidades del puesto?

3. EVALÚA COINCIDENCIAS REALES:
   - Coincidencia EXACTA: El CV menciona específicamente lo que el JD requiere
   - Coincidencia PARCIAL: El CV tiene algo relacionado pero no exacto
   - Sin coincidencia: El CV no menciona nada relacionado

4. PENALIZA AUSENCIAS:
   - Si faltan requisitos OBLIGATORIOS del JD, el candidato NO puede tener un score alto
   - Si el CV está en un área completamente diferente, usa "insufficient" o "low"
   - Si hay más diferencias que coincidencias, el nivel debe ser "low" o "insufficient"

REGLAS ESTRICTAS DE ÉTICA Y EQUIDAD:

1. PROPÓSITO LIMITADO: Solo analiza información laboral (experiencia, educación, certificaciones, logros). NO tomes decisiones finales.

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

JOB DESCRIPTION (referencia principal - REQUISITOS A CUMPLIR):

{job_description}

CV ANALIZADO ({filename} - COMPARAR CON REQUISITOS ARRIBA):

{cv_content}

INSTRUCCIONES FINALES:

1. Compara CADA requisito del JD con el CV de manera objetiva y justa
2. Si el CV NO menciona algo que el JD requiere, indícalo claramente pero sin juicios de valor
3. Si el CV está en un área diferente, evalúa si es transferible de manera justa y objetiva
4. Si hay más requisitos NO cumplidos que cumplidos, el nivel debe ser "low" o "insufficient"
5. Sé ESTRICTO: no des puntajes altos por "buena actitud" o "experiencia general" si no cumple requisitos específicos
6. EQUIDAD: Si un candidato tiene experiencia transferible pero en diferente industria, evalúa las habilidades, no el "prestigio" de la industria
7. NO DISCRIMINACIÓN: No penalices por tener experiencia en industrias "menos prestigiosas" si las habilidades son relevantes
8. VERIFICA SESGOS: Antes de responder, revisa si tu análisis podría estar sesgado por:
   - Prejuicios sobre tipos de experiencia o industrias
   - Asunciones sobre qué es "mejor" sin justificación objetiva
   - Estereotipos sobre tipos de educación o formación
   - Sesgos hacia ciertos tipos de trayectorias profesionales

FORMATO DE RESPUESTA (OBLIGATORIO):

Responde EXACTAMENTE en este formato JSON:

{{
  "recommendation": "(a) Tu recomendación objetiva. Menciona específicamente qué requisitos del JD cumple y cuáles no. Si no cumple requisitos principales, indícalo claramente.",
  "objective_criteria": [
    {{
      "name": "Nombre del criterio (ej: 'Experiencia en Python')",
      "value": "Comparación específica: JD requiere X, CV muestra Y. Coincidencia: EXACTA/PARCIAL/NINGUNA",
      "weight": 0.35
    }}
  ],
  "confidence_level": "high|medium|low|insufficient",
  "confidence_explanation": "Explicación detallada: por qué este nivel basado en la comparación JD vs CV",
  "missing_information": ["Requisito del JD que NO está en el CV", "Otro requisito faltante"]
}}

IMPORTANTE:
- La recomendación debe mencionar QUÉ requisitos del JD se cumplen y CUÁLES NO
- Los criterios deben mostrar la comparación directa JD vs CV
- El nivel de confianza debe reflejar la REAL coincidencia entre JD y CV
- Si faltan requisitos OBLIGATORIOS, el nivel debe ser "low" o "insufficient"
- NO uses lenguaje subjetivo ni adjetivos de valor
- NO infieras atributos personales
- NO asumas que "experiencia general" es suficiente si el JD requiere algo específico
- Recuerda: esto es APOYO, no una decisión final"""
    
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
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un asistente ético de Recursos Humanos especializado en comparación estricta entre Job Descriptions y CVs. Evalúas candidatos comparando DIRECTAMENTE los requisitos del JD con la experiencia del CV. Eres ESTRICTO: no das puntajes altos si no hay coincidencias reales. Aplicas principios de objetividad, neutralidad, equidad, no discriminación y privacidad. NO usas, infieres ni mencionas datos personales protegidos. Evalúas solo competencias y habilidades relevantes para el desempeño laboral. Eres consciente de sesgos y los evitas activamente."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2500,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error llamando OpenAI: {e}")
            raise
    
    async def _call_anthropic(self, prompt: str, model: str) -> str:
        """Llamar a Anthropic Claude"""
        try:
            model_map = {
                "claude-opus-4": "claude-opus-4-20250514",
                "claude-sonnet-4": "claude-sonnet-4-20250514",
                "claude-haiku-3.5": "claude-3-5-haiku-20241022",
            }
            anthropic_model = model_map.get(model, "claude-sonnet-4-20250514")
            
            message = self.anthropic_client.messages.create(
                model=anthropic_model,
                max_tokens=2500,
                temperature=0.1,
                system="Eres un asistente ético de Recursos Humanos especializado en comparación estricta entre Job Descriptions y CVs. Evalúas candidatos comparando DIRECTAMENTE los requisitos del JD con la experiencia del CV. Eres ESTRICTO: no das puntajes altos si no hay coincidencias reales. Aplicas principios de objetividad, neutralidad, equidad, no discriminación y privacidad. NO usas, infieres ni mencionas datos personales protegidos. Evalúas solo competencias y habilidades relevantes para el desempeño laboral. Eres consciente de sesgos y los evitas activamente.",
                messages=[{"role": "user", "content": prompt}],
            )
            return message.content[0].text
        except Exception as e:
            logger.error(f"Error llamando Anthropic: {e}")
            raise
    
    async def _call_gemini(self, prompt: str, model: str) -> str:
        """Llamar a Google Gemini"""
        try:
            model_map = {
                "gemini-2.5-pro": "gemini-2.5-pro",
                "gemini-2.5-flash": "gemini-2.5-flash",
                "gemini-1.5-pro": "gemini-pro-latest",
            }
            gemini_model_id = model_map.get(model, "gemini-2.5-flash")
            
            genai_model = genai.GenerativeModel(gemini_model_id)
            response = genai_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=2500,
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Error llamando Gemini: {e}")
            raise
    
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
        
        # Intentar extraer JSON de la respuesta
        json_match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group())
                
                # Convertir criterios
                criteria = []
                for crit in data.get("objective_criteria", []):
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
                
                return CandidateAnalysisResult(
                    candidateId=candidate_id,
                    filename=filename,
                    recommendation=data.get("recommendation", "Análisis no disponible"),
                    objective_criteria=criteria,
                    confidence_level=confidence,
                    confidence_explanation=data.get("confidence_explanation", ""),
                    missing_information=data.get("missing_information"),
                    ethical_compliance=True
                )
            except json.JSONDecodeError:
                logger.warning("No se pudo parsear JSON de la respuesta de IA")
        
        # Fallback: respuesta básica
        return CandidateAnalysisResult(
            candidateId=candidate_id,
            filename=filename,
            recommendation="Análisis requiere revisión manual debido a formato de respuesta inesperado",
            objective_criteria=[
                ObjectiveCriterion(
                    name="Análisis automático",
                    value="Respuesta de IA no parseable",
                    weight=0.0
                )
            ],
            confidence_level=ConfidenceLevel.INSUFFICIENT,
            confidence_explanation="No se pudo procesar la respuesta de IA correctamente",
            missing_information=["Formato de respuesta válido de IA"],
            ethical_compliance=True
        )
