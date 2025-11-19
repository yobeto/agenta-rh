"""
Validador de principios éticos para el análisis de candidatos
Asegura que todas las operaciones cumplan con los principios establecidos
"""
import re
import logging
from typing import List
from dataclasses import dataclass

from models.schemas import (
    CandidateAnalysisRequest,
    CandidateAnalysisResult,
)

logger = logging.getLogger(__name__)


@dataclass
class ValidationResult:
    """Resultado de una validación ética"""
    is_valid: bool
    reason: str = ""
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []


class EthicalValidator:
    """
    Valida que las solicitudes y análisis cumplan con principios éticos:
    1. Propósito limitado
    2. Variables válidas
    3. Razonamiento verificable
    4. Lenguaje neutral
    5. Privacidad activa
    """
    
    # Palabras prohibidas que indican juicios de valor
    SUBJECTIVE_TERMS = [
        "excelente", "malo", "bueno", "terrible", "perfecto",
        "increíble", "horrible", "fantástico", "pésimo",
        "genial", "mediocre", "sobresaliente", "decepcionante"
    ]
    
    # Términos que indican inferencia de atributos personales
    PERSONAL_ATTRIBUTES = [
        "edad", "género", "raza", "religión", "orientación",
        "estado civil", "nacionalidad", "discapacidad",
        "casado", "soltero", "divorciado", "viudo",
        "hombre", "mujer", "masculino", "femenino",
        "joven", "maduro", "mayor", "menor",
        "apariencia", "físico", "peso", "altura",
        "origen", "etnia", "color", "piel"
    ]
    
    # Términos que pueden indicar sesgos o estereotipos
    BIAS_INDICATORS = [
        "sobrecalificado", "subcalificado", "demasiado",
        "muy joven", "muy mayor", "demasiado experimentado",
        "fresco", "nuevo", "viejo", "antiguo",
        "prestigioso", "elite", "top", "mejor",
        "típico", "normal", "común", "raro"
    ]
    
    # Términos que pueden indicar discriminación por industria o tipo de experiencia
    INDUSTRY_BIAS_TERMS = [
        "pequeña empresa", "gran empresa", "startup",
        "corporativo", "académico", "gubernamental",
        "prestigio", "reconocida", "conocida"
    ]
    
    def validate_request(self, request: CandidateAnalysisRequest) -> ValidationResult:
        """
        Valida que la solicitud solo contenga información laboral válida
        """
        warnings: List[str] = []

        # Validar longitud mínima del job description
        if len(request.jobDescription.strip()) < 30:
            warnings.append("El Job Description extraído parece muy corto o incompleto.")

        # Validar que haya al menos un candidato
        if not request.candidates:
            return ValidationResult(
                is_valid=False,
                reason="No se proporcionaron CVs para analizar.",
                warnings=warnings
            )

        for candidate in request.candidates:
            candidate_text = f"{candidate.content}".lower()

            for attr in self.PERSONAL_ATTRIBUTES:
                if attr in candidate_text:
                    return ValidationResult(
                        is_valid=False,
                        reason=f"El CV '{candidate.filename}' contiene información personal no permitida: {attr}",
                        warnings=warnings
                    )

            if len(candidate.content.strip()) < 30:
                warnings.append(
                    f"El CV '{candidate.filename}' parece tener muy poco texto para evaluar."
                )

        return ValidationResult(
            is_valid=True,
            warnings=warnings
        )
    
    def validate_analysis(self, analysis: CandidateAnalysisResult) -> ValidationResult:
        """
        Valida que el análisis cumpla con principios éticos y no contenga sesgos
        """
        warnings = []
        
        # Verificar lenguaje neutral
        recommendation_lower = analysis.recommendation.lower()
        for term in self.SUBJECTIVE_TERMS:
            if term in recommendation_lower:
                return ValidationResult(
                    is_valid=False,
                    reason=f"El análisis contiene lenguaje subjetivo no permitido: '{term}'",
                    warnings=warnings
                )
        
        # Verificar que tenga criterios objetivos
        if not analysis.objective_criteria or len(analysis.objective_criteria) == 0:
            return ValidationResult(
                is_valid=False,
                reason="El análisis no incluye criterios objetivos verificables",
                warnings=warnings
            )
        
        # Verificar que no contenga datos personales
        all_text = f"{analysis.recommendation} {analysis.confidence_explanation}"
        all_text_lower = all_text.lower()
        
        for attr in self.PERSONAL_ATTRIBUTES:
            if attr in all_text_lower:
                return ValidationResult(
                    is_valid=False,
                    reason=f"El análisis contiene referencias a atributos personales: {attr}",
                    warnings=warnings
                )
        
        # Verificar indicadores de sesgos potenciales
        for bias_term in self.BIAS_INDICATORS:
            if bias_term in all_text_lower:
                warnings.append(
                    f"Posible sesgo detectado: el término '{bias_term}' puede indicar evaluación no objetiva"
                )
        
        # Verificar sesgos por industria o tipo de experiencia
        for industry_term in self.INDUSTRY_BIAS_TERMS:
            if industry_term in all_text_lower:
                warnings.append(
                    f"Posible sesgo por tipo de experiencia detectado: '{industry_term}' puede indicar discriminación por industria"
                )
        
        # Verificar que los criterios objetivos no contengan sesgos
        for criterion in analysis.objective_criteria:
            criterion_text = f"{criterion.name} {criterion.value}".lower()
            
            # Verificar atributos personales en criterios
            for attr in self.PERSONAL_ATTRIBUTES:
                if attr in criterion_text:
                    return ValidationResult(
                        is_valid=False,
                        reason=f"El criterio '{criterion.name}' contiene referencias a atributos personales: {attr}",
                        warnings=warnings
                    )
            
            # Verificar términos subjetivos en criterios
            for term in self.SUBJECTIVE_TERMS:
                if term in criterion_text:
                    warnings.append(
                        f"El criterio '{criterion.name}' contiene lenguaje subjetivo: '{term}'"
                    )
        
        return ValidationResult(
            is_valid=True,
            warnings=warnings
        )
    
    def adjust_analysis(self, analysis: CandidateAnalysisResult) -> CandidateAnalysisResult:
        """
        Ajusta un análisis para cumplir con principios éticos y eliminar sesgos
        """
        # Remover términos subjetivos
        recommendation = analysis.recommendation
        for term in self.SUBJECTIVE_TERMS:
            recommendation = re.sub(
                rf'\b{term}\b',
                '',
                recommendation,
                flags=re.IGNORECASE
            )
        
        # Remover términos que indican sesgos
        for bias_term in self.BIAS_INDICATORS:
            recommendation = re.sub(
                rf'\b{bias_term}\b',
                '',
                recommendation,
                flags=re.IGNORECASE
            )
        
        # Remover referencias a atributos personales
        for attr in self.PERSONAL_ATTRIBUTES:
            recommendation = re.sub(
                rf'\b{attr}\b',
                '',
                recommendation,
                flags=re.IGNORECASE
            )
        
        # Limpiar espacios múltiples
        recommendation = re.sub(r'\s+', ' ', recommendation).strip()
        
        # Si quedó vacío, usar descripción neutral
        if not recommendation:
            recommendation = "Análisis basado en criterios objetivos disponibles"
        
        # Limpiar criterios objetivos también
        cleaned_criteria = []
        for criterion in analysis.objective_criteria:
            criterion_value = criterion.value
            # Remover términos subjetivos y de sesgo de los valores
            for term in self.SUBJECTIVE_TERMS + self.BIAS_INDICATORS:
                criterion_value = re.sub(
                    rf'\b{term}\b',
                    '',
                    criterion_value,
                    flags=re.IGNORECASE
                )
            criterion_value = re.sub(r'\s+', ' ', criterion_value).strip()
            
            if criterion_value:  # Solo agregar si quedó contenido
                from models.schemas import ObjectiveCriterion
                cleaned_criteria.append(
                    ObjectiveCriterion(
                        name=criterion.name,
                        value=criterion_value,
                        weight=criterion.weight
                    )
                )
        
        # Si no quedaron criterios, crear uno genérico
        if not cleaned_criteria:
            from models.schemas import ObjectiveCriterion
            cleaned_criteria = [
                ObjectiveCriterion(
                    name="Evaluación objetiva",
                    value="Análisis basado en criterios laborales relevantes",
                    weight=1.0
                )
            ]
        
        return CandidateAnalysisResult(
            candidateId=analysis.candidateId,
            filename=analysis.filename,
            recommendation=recommendation,
            objective_criteria=cleaned_criteria,
            confidence_level=analysis.confidence_level,
            confidence_explanation=analysis.confidence_explanation,
            missing_information=analysis.missing_information,
            ethical_compliance=True
        )


