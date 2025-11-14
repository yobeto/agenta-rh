"""
agente-rh - API Principal
Asistente de preselección de candidatos con principios éticos estrictos
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import os
import logging
from dotenv import load_dotenv

from services.candidate_analyzer import CandidateAnalyzer
from services.ethical_validator import EthicalValidator
from services.chat_service import ChatService
from models.schemas import (
    CandidateAnalysisRequest,
    CandidateAnalysisResult,
    ChatRequest,
    ChatResponse,
)
from utils.pdf_parser import extract_text_from_pdf

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

# CORS
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
async def analyze_candidate(request: CandidateAnalysisRequest):
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
async def extract_text(file: UploadFile = File(...)):
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
async def chat(request: ChatRequest):
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


