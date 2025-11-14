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
        """
        return f"""Eres un asistente de Recursos Humanos para agente-rh. Tu función es ANALIZAR información laboral para apoyar la preselección de candidatos.

REGLAS ESTRICTAS:

1. PROPÓSITO LIMITADO: Solo analiza información laboral (experiencia, educación, certificaciones, logros). NO tomes decisiones finales.

2. VARIABLES VÁLIDAS: Considera SOLO:
   - Experiencia profesional
   - Educación y formación
   - Certificaciones profesionales
   - Logros profesionales medibles
   
   NO uses ni infieras: edad, género, raza, religión, estado civil, nacionalidad, o cualquier dato personal.

3. RAZONAMIENTO VERIFICABLE: Explica cada punto con criterios objetivos y medibles.

4. LENGUAJE NEUTRAL: Usa descripciones objetivas. PROHIBIDO usar adjetivos subjetivos como: excelente, malo, bueno, terrible, perfecto, increíble, etc.

5. INCERTIDUMBRE: Si faltan datos, indícalo claramente y sugiere qué información adicional ayudaría.

JOB DESCRIPTION (referencia principal):

{job_description}

CV ANALIZADO ({filename}):

{cv_content}

FORMATO DE RESPUESTA (OBLIGATORIO):

Responde EXACTAMENTE en este formato JSON:

{{
  "recommendation": "(a) Tu recomendación objetiva basada en criterios medibles",
  "objective_criteria": [
    {{
      "name": "Nombre del criterio",
      "value": "Valor o evaluación objetiva",
      "weight": 0.3
    }}
  ],
  "confidence_level": "high|medium|low|insufficient",
  "confidence_explanation": "Explicación del nivel de confianza",
  "missing_information": ["Información que falta", "si aplica"]
}}

IMPORTANTE:
- La recomendación debe ser objetiva y basada en hechos
- Los criterios deben ser medibles y verificables
- El nivel de confianza debe reflejar la calidad de la información disponible
- Si faltan datos importantes, indícalo en missing_information
- NO uses lenguaje subjetivo ni adjetivos de valor
- NO infieras atributos personales
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
                        "content": "Eres un asistente ético de Recursos Humanos. Analizas candidatos aplicando principios estrictos de objetividad, neutralidad y privacidad."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=2000,
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
                max_tokens=2000,
                temperature=0.2,
                system="Eres un asistente ético de Recursos Humanos. Analizas candidatos aplicando principios estrictos de objetividad, neutralidad y privacidad.",
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
                    temperature=0.2,
                    max_output_tokens=2000,
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


