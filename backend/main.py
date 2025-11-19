"""
agente-rh - API Principal
Asistente de preselección de candidatos con principios éticos estrictos
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from typing import Optional, List
import os
import logging
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from services.candidate_analyzer import CandidateAnalyzer
from services.ethical_validator import EthicalValidator
from services.chat_service import ChatService
from services.auth_service import authenticate_user, create_access_token, create_user
from services.audit_service import log_candidate_action, get_audit_log, get_candidate_history
from middleware.auth_middleware import get_current_user, get_current_admin_user
from models.schemas import (
    CandidateAnalysisRequest,
    CandidateAnalysisResult,
    ChatRequest,
    ChatResponse,
    LoginRequest,
    LoginResponse,
    CreateUserRequest,
    CreateUserResponse,
    CandidateActionRequest,
    CandidateActionResponse,
    AuditLogResponse,
    AuditLogEntry,
)
from utils.pdf_parser import extract_text_from_pdf
from datetime import timedelta
from fastapi import Depends

load_dotenv()

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="agente-rh API",
    description="Asistente de preselección de candidatos con principios éticos",
    version="1.0.0"
)

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Headers Middleware (solo en producción)
if os.getenv("ENVIRONMENT") == "production":
    allowed_hosts = os.getenv("ALLOWED_HOSTS", "*.inbursa.com,*.onrender.com").split(",")
    allowed_hosts = [host.strip() for host in allowed_hosts]
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=allowed_hosts
    )
    logger.info(f"TrustedHostMiddleware configurado con hosts: {allowed_hosts}")

# CORS - Mejorado para manejar espacios y logging
cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)
# Limpiar espacios y dividir por comas
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

# Logging para debuggear
logger.info(f"CORS configurado con orígenes permitidos: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if "*" not in cors_origins else ["*"],  # Si hay "*", permitir todos
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Inicializar servicios
candidate_analyzer = CandidateAnalyzer()
ethical_validator = EthicalValidator()
chat_service = ChatService()


@app.get("/")
async def root():
    return {
        "message": "agente-rh API",
        "version": "1.0.0",
        "purpose": "Asistente de preselección de candidatos - Apoyo a decisiones humanas"
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "agente-rh"}


@app.get("/api/debug/config")
async def debug_config():
    """Endpoint de debug para verificar configuración (solo en desarrollo)"""
    if os.getenv("ENVIRONMENT") == "production":
        return {"error": "Este endpoint solo está disponible en desarrollo"}
    
    return {
        "cors_origins": cors_origins,
        "environment": os.getenv("ENVIRONMENT", "development"),
        "cors_origins_env": os.getenv("CORS_ORIGINS", "not set"),
        "allowed_hosts": os.getenv("ALLOWED_HOSTS", "not set"),
    }


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/auth/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(request: Request, login_request: LoginRequest):
    """Endpoint de autenticación con rate limiting"""
    user = authenticate_user(login_request.username, login_request.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=480)  # 8 horas
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    logger.info(f"Login exitoso: {user['username']} ({user.get('email', 'N/A')})")
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )


@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Obtiene la información del usuario autenticado"""
    return current_user


@app.post("/api/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Endpoint de logout (el token se invalida en el cliente)"""
    return {"message": "Sesión cerrada exitosamente"}


@app.post("/api/auth/create-user", response_model=CreateUserResponse)
async def create_new_user(
    user_request: CreateUserRequest,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Crea un nuevo usuario (solo para administradores)"""
    success, message = create_user(
        username=user_request.username,
        password=user_request.password,
        email=user_request.email,
        department=user_request.department,
        role=user_request.role or "user"
    )
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail=message
        )
    
    return CreateUserResponse(
        username=user_request.username,
        email=user_request.email,
        department=user_request.department,
        role=user_request.role or "user",
        message=message
    )


@app.get("/api/models")
async def get_models():
    """Modelos de IA disponibles"""
    return {
        "models": [
            {"id": "gpt-4", "name": "GPT-4", "provider": "openai"},
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "provider": "openai"},
            {"id": "claude-sonnet-4", "name": "Claude Sonnet 4", "provider": "anthropic"},
            {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "provider": "google"}
        ]
    }


@app.post("/api/analyze", response_model=List[CandidateAnalysisResult])
async def analyze_candidate(
    request: CandidateAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Analiza uno o varios candidatos aplicando principios éticos estrictos.
    """
    try:
        # Validar que la solicitud cumple con principios éticos
        validation_result = ethical_validator.validate_request(request)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Validación ética fallida: {validation_result.reason}"
            )
        
        analyses = await candidate_analyzer.analyze_batch(
            job_description=request.jobDescription,
            candidates=request.candidates,
            model_id=request.modelId
        )

        sanitized_results: List[CandidateAnalysisResult] = []
        for analysis in analyses:
            analysis_validation = ethical_validator.validate_analysis(analysis)
            if not analysis_validation.is_valid:
                logger.warning(
                    "Análisis no cumple validación ética: %s",
                    analysis_validation.reason
                )
                sanitized_results.append(ethical_validator.adjust_analysis(analysis))
            else:
                sanitized_results.append(analysis)

        return sanitized_results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analizando candidato: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al analizar candidato"
        )



@app.post("/api/extract-text")
async def extract_text(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Extrae texto plano de un PDF de descripción de puesto o CV"""
    if file.content_type not in {"application/pdf", "application/x-pdf"} and not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF.")

    try:
        file_bytes = await file.read()
        text, warnings = extract_text_from_pdf(file_bytes)

        if not text:
            raise HTTPException(status_code=400, detail="No se pudo extraer texto del PDF.")

        return {"text": text, "warnings": warnings}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error extrayendo texto de PDF: {exc}")
        raise HTTPException(status_code=500, detail="Error al procesar el PDF")




@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Conversación contextual con el asistente ético"""
    try:
        history = [{"role": msg.role, "content": msg.content} for msg in (request.chatHistory or [])]
        response = await chat_service.chat(
            message=request.message,
            chat_history=history,
            model_id=request.modelId
        )
        return ChatResponse(message=response, modelId=request.modelId)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as exc:
        logger.error(f"Error en chat: {exc}")
        raise HTTPException(status_code=500, detail="Error al generar la respuesta del chat")

@app.post("/api/analyze-cv")
async def analyze_cv_file(file: UploadFile = File(...)):
    """
    Analiza un CV desde un archivo (PDF, DOCX, TXT).
    Extrae solo información laboral relevante.
    """
    try:
        # Leer archivo
        content = await file.read()
        
        # Extraer información (solo datos laborales)
        # TODO: Implementar extracción de CV
        # Por ahora retornar error
        raise HTTPException(
            status_code=501,
            detail="Análisis de CV desde archivo aún no implementado"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error procesando CV: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error procesando archivo CV"
        )


@app.get("/api/ethical-principles")
async def get_ethical_principles():
    """
    Devuelve los principios éticos que rigen el sistema.
    """
    return {
        "principles": [
            {
                "id": 1,
                "name": "Propósito limitado",
                "description": "Solo analiza información laboral relevante. No toma decisiones finales."
            },
            {
                "id": 2,
                "name": "Variables válidas",
                "description": "Considera experiencia, educación, certificaciones y logros. No usa datos personales."
            },
            {
                "id": 3,
                "name": "Razonamiento verificable",
                "description": "Explica cada recomendación con criterios objetivos y medibles."
            },
            {
                "id": 4,
                "name": "Supervisión humana",
                "description": "Los resultados son apoyo, no veredictos. Siempre revisados por humanos."
            },
            {
                "id": 5,
                "name": "Lenguaje neutral",
                "description": "Usa descripciones objetivas, sin juicios de valor o adjetivos subjetivos."
            },
            {
                "id": 6,
                "name": "Privacidad activa",
                "description": "No almacena ni comparte información de candidatos."
            },
            {
                "id": 7,
                "name": "Incertidumbre",
                "description": "Si los datos son insuficientes, lo indica y sugiere información adicional."
            }
        ],
        "values": "Confianza, transparencia y ética - Valores de agente-rh"
    }


# ============================================================================
# CANDIDATE ACTIONS ENDPOINTS
# ============================================================================

@app.post("/api/candidates/action", response_model=CandidateActionResponse)
async def register_candidate_action(
    action_request: CandidateActionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Registra una acción sobre un candidato (pasar a entrevista, rechazar, en espera)
    """
    try:
        # Validar que la acción sea válida
        valid_actions = ['interview', 'rejected', 'on_hold']
        if action_request.action not in valid_actions:
            raise HTTPException(
                status_code=400,
                detail=f"Acción inválida. Debe ser una de: {', '.join(valid_actions)}"
            )
        
        action_record = log_candidate_action(
            candidate_id=action_request.candidate_id,
            candidate_filename=action_request.candidate_filename,
            action=action_request.action,
            username=current_user['username'],
            notes=action_request.notes
        )
        
        return CandidateActionResponse(
            candidate_id=action_record.candidate_id,
            candidate_filename=action_record.candidate_filename,
            action=action_record.action,
            username=action_record.username,
            timestamp=action_record.timestamp,
            notes=action_record.notes,
            message="Acción registrada exitosamente"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registrando acción: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al registrar la acción"
        )


@app.get("/api/audit/log", response_model=AuditLogResponse)
async def get_audit_log_endpoint(
    username: Optional[str] = None,
    candidate_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    current_admin: dict = Depends(get_current_admin_user)
):
    """
    Obtiene el log de auditoría de acciones sobre candidatos (solo administradores)
    """
    try:
        entries = get_audit_log(
            username=username,
            candidate_id=candidate_id,
            action=action,
            limit=limit
        )
        
        return AuditLogResponse(
            entries=[AuditLogEntry(**entry) for entry in entries],
            total=len(entries)
        )
    except Exception as e:
        logger.error(f"Error obteniendo log de auditoría: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al obtener el log de auditoría"
        )


@app.get("/api/candidates/{candidate_id}/history", response_model=AuditLogResponse)
async def get_candidate_history_endpoint(
    candidate_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """
    Obtiene el historial completo de acciones sobre un candidato específico (solo administradores)
    """
    try:
        entries = get_candidate_history(candidate_id)
        
        return AuditLogResponse(
            entries=[AuditLogEntry(**entry) for entry in entries],
            total=len(entries)
        )
    except Exception as e:
        logger.error(f"Error obteniendo historial del candidato: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al obtener el historial"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


