"""
Servicio de auditoría para registrar acciones de candidatos
"""
from datetime import datetime
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
import json
import os
import logging

logger = logging.getLogger(__name__)

# Base de datos de auditoría (en producción usar una BD real)
# Formato: Lista de acciones con timestamp, usuario, candidato, acción
AUDIT_LOG: List[Dict] = []

# Archivo para persistencia (opcional)
AUDIT_LOG_FILE = os.getenv("AUDIT_LOG_FILE", "audit_log.json")


@dataclass
class CandidateAction:
    """Acción realizada sobre un candidato"""
    candidate_id: str
    candidate_filename: str
    action: str  # 'interview', 'rejected', 'on_hold'
    username: str
    timestamp: str
    reason: Optional[str] = None


def load_audit_log():
    """Carga el log de auditoría desde archivo si existe"""
    global AUDIT_LOG
    if os.path.exists(AUDIT_LOG_FILE):
        try:
            with open(AUDIT_LOG_FILE, 'r', encoding='utf-8') as f:
                AUDIT_LOG = json.load(f)
            logger.info(f"Cargado {len(AUDIT_LOG)} registros de auditoría")
        except Exception as e:
            logger.error(f"Error cargando log de auditoría: {e}")
            AUDIT_LOG = []


def save_audit_log():
    """Guarda el log de auditoría en archivo"""
    try:
        with open(AUDIT_LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(AUDIT_LOG, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Error guardando log de auditoría: {e}")


def log_candidate_action(
    candidate_id: str,
    candidate_filename: str,
    action: str,
    username: str,
    reason: Optional[str] = None
) -> CandidateAction:
    """
    Registra una acción sobre un candidato
    """
    timestamp = datetime.utcnow().isoformat()
    
    action_record = CandidateAction(
        candidate_id=candidate_id,
        candidate_filename=candidate_filename,
        action=action,
        username=username,
        timestamp=timestamp,
        reason=reason
    )
    
    AUDIT_LOG.append(asdict(action_record))
    
    # Guardar en archivo (opcional, puede ser asíncrono en producción)
    try:
        save_audit_log()
    except Exception as e:
        logger.warning(f"No se pudo guardar en archivo: {e}")
    
    logger.info(f"Acción registrada: {username} -> {action} sobre {candidate_id}")
    
    return action_record


def get_audit_log(
    username: Optional[str] = None,
    candidate_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100
) -> List[Dict]:
    """
    Obtiene el log de auditoría con filtros opcionales
    """
    filtered = AUDIT_LOG.copy()
    
    if username:
        filtered = [r for r in filtered if r.get('username') == username]
    
    if candidate_id:
        filtered = [r for r in filtered if r.get('candidate_id') == candidate_id]
    
    if action:
        filtered = [r for r in filtered if r.get('action') == action]
    
    # Ordenar por timestamp descendente (más recientes primero)
    filtered.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    
    return filtered[:limit]


def get_candidate_history(candidate_id: str) -> List[Dict]:
    """Obtiene el historial completo de un candidato"""
    return get_audit_log(candidate_id=candidate_id, limit=1000)


# Cargar log al iniciar
load_audit_log()

