"""
Modelos de datos para el sistema de análisis de candidatos
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


class ConfidenceLevel(str, Enum):
    """Nivel de confianza del análisis"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INSUFFICIENT = "insufficient"


class CandidateDocument(BaseModel):
    """Representa el texto extraído de un CV"""
    filename: str = Field(..., description="Nombre del archivo de CV")
    content: str = Field(
        ...,
        description="Texto extraído del CV en formato plano",
        min_length=30
    )
    candidateId: Optional[str] = Field(
        default=None,
        description="Identificador opcional derivado del archivo"
    )


class CandidateAnalysisRequest(BaseModel):
    """Solicitud de análisis para uno o varios candidatos"""
    jobDescription: str = Field(
        ...,
        description="Texto extraído del Job Description",
        min_length=30
    )
    candidates: List[CandidateDocument] = Field(
        ...,
        description="Lista de candidatos a evaluar"
    )
    modelId: Optional[str] = Field(
        default=None,
        description="ID del modelo de IA a utilizar (opcional)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "jobDescription": "Descripción del puesto extraída automáticamente...",
                "candidates": [
                    {
                        "filename": "CV_JuanaPerez.pdf",
                        "content": "Texto del CV extraído automáticamente...",
                        "candidateId": "JuanaPerez"
                    }
                ],
                "modelId": "gpt-4"
            }
        }


class ObjectiveCriterion(BaseModel):
    """Criterio objetivo utilizado en el análisis"""
    name: str = Field(..., description="Nombre del criterio")
    value: str = Field(..., description="Valor o evaluación del criterio")
    weight: Optional[float] = Field(
        default=None,
        description="Peso del criterio (0-1)",
        ge=0,
        le=1
    )


class CandidateAnalysisResult(BaseModel):
    """Resultado del análisis de un CV respecto al job description"""
    candidateId: Optional[str] = Field(
        default=None,
        description="Identificador del candidato si está disponible"
    )
    filename: str = Field(
        ...,
        description="Nombre del archivo analizado"
    )
    recommendation: str = Field(
        ...,
        description="(a) Recomendación basada en criterios objetivos"
    )
    objective_criteria: List[ObjectiveCriterion] = Field(
        ...,
        description="(b) Criterios objetivos utilizados en el análisis"
    )
    confidence_level: ConfidenceLevel = Field(
        ...,
        description="(c) Nivel de confianza / incertidumbre"
    )
    confidence_explanation: str = Field(
        ...,
        description="Explicación del nivel de confianza"
    )
    missing_information: Optional[List[str]] = Field(
        default=None,
        description="Información adicional que podría mejorar el análisis"
    )
    ethical_compliance: bool = Field(
        default=True,
        description="Indica si el análisis cumple con principios éticos"
    )
    risks: Optional[List[dict]] = Field(
        default=None,
        description="Riesgos identificados en el análisis, con categoría y nivel"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "candidateId": "JuanaPerez",
                "filename": "CV_JuanaPerez.pdf",
                "recommendation": "La candidata cumple con los requisitos clave del puesto y se recomienda avanzar al siguiente filtro humano.",
                "objective_criteria": [
                    {
                        "name": "Experiencia relevante",
                        "value": "5 años en banca corporativa (requisito: 4+)",
                        "weight": 0.35
                    },
                    {
                        "name": "Certificaciones requeridas",
                        "value": "Certificación AMIB figura 3 vigente",
                        "weight": 0.25
                    },
                    {
                        "name": "Competencias técnicas",
                        "value": "Gestión de portafolios, análisis financiero avanzado",
                        "weight": 0.25
                    }
                ],
                "confidence_level": "high",
                "confidence_explanation": "Información completa y consistente entre CV y descripción de puesto",
                "missing_information": None,
                "ethical_compliance": True
            }
        }




class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    modelId: str
    chatHistory: Optional[List[ChatHistoryItem]] = None


class ChatResponse(BaseModel):
    message: str
    modelId: str


# ============================================================================
# AUTHENTICATION SCHEMAS
# ============================================================================

class LoginRequest(BaseModel):
    """Solicitud de login"""
    username: str = Field(..., description="Nombre de usuario")
    password: str = Field(..., description="Contraseña", min_length=6)


class LoginResponse(BaseModel):
    """Respuesta de login exitoso"""
    access_token: str = Field(..., description="Token JWT de acceso")
    token_type: str = Field(default="bearer", description="Tipo de token")
    user: dict = Field(..., description="Información del usuario")


class UserInfo(BaseModel):
    """Información del usuario autenticado"""
    username: str
    email: Optional[str] = None
    role: Optional[str] = Field(default="user", description="Rol del usuario")
    department: Optional[str] = Field(default=None, description="Departamento del usuario")


class CreateUserRequest(BaseModel):
    """Solicitud para crear un nuevo usuario (solo admins)"""
    username: str = Field(..., description="Nombre de usuario", min_length=3, max_length=50)
    password: str = Field(..., description="Contraseña", min_length=8)
    email: str = Field(..., description="Email del usuario (debe ser @inbursa.com)")
    department: str = Field(..., description="Departamento (debe ser 'RH' o 'Recursos Humanos')")
    role: Optional[str] = Field(default="user", description="Rol del usuario")


class CreateUserResponse(BaseModel):
    """Respuesta de creación de usuario"""
    username: str
    email: str
    department: str
    role: str
    message: str


# ============================================================================
# CANDIDATE ACTIONS SCHEMAS
# ============================================================================

class CandidateActionRequest(BaseModel):
    """Solicitud para registrar una acción sobre un candidato"""
    candidate_id: str = Field(..., description="ID del candidato")
    candidate_filename: str = Field(..., description="Nombre del archivo del candidato")
    action: str = Field(..., description="Acción: 'interview', 'rejected', 'on_hold'")
    reason: Optional[str] = Field(default=None, description="Razón de la acción (obligatorio para 'rejected', opcional para otros)")
    position_id: Optional[str] = Field(default=None, description="ID de la posición/Job Description")
    position_title: Optional[str] = Field(default=None, description="Título de la posición/Job Description")


class CandidateActionResponse(BaseModel):
    """Respuesta de acción registrada"""
    candidate_id: str
    candidate_filename: str
    action: str
    username: str
    timestamp: str
    reason: Optional[str] = None
    position_id: Optional[str] = None
    position_title: Optional[str] = None
    message: str = "Acción registrada exitosamente"


class AuditLogEntry(BaseModel):
    """Entrada del log de auditoría"""
    candidate_id: str
    candidate_filename: str
    action: str
    username: str
    timestamp: str
    reason: Optional[str] = None
    position_id: Optional[str] = None
    position_title: Optional[str] = None


class AuditLogResponse(BaseModel):
    """Respuesta del log de auditoría"""
    entries: List[AuditLogEntry]
    total: int
