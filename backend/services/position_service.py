"""
Servicio para gestionar posiciones (Job Descriptions)
Lee PDFs de una carpeta y los convierte en posiciones disponibles
"""
import os
import json
import logging
from typing import List, Optional, Dict
from datetime import datetime
from pathlib import Path

from utils.pdf_parser import extract_text_from_pdf

logger = logging.getLogger(__name__)

# Rutas de configuración (relativas al directorio del backend)
_BACKEND_DIR = Path(__file__).parent.parent
POSITIONS_DATA_DIR = Path(os.getenv("POSITIONS_DATA_DIR", str(_BACKEND_DIR / "positions" / "data")))
POSITIONS_PDFS_DIR = Path(os.getenv("POSITIONS_PDFS_DIR", str(_BACKEND_DIR / "positions" / "pdfs")))

# Asegurar que las carpetas existan
POSITIONS_DATA_DIR.mkdir(parents=True, exist_ok=True)
POSITIONS_PDFS_DIR.mkdir(parents=True, exist_ok=True)


class PositionService:
    """Servicio para gestionar posiciones y Job Descriptions"""
    
    def __init__(self, auto_load_pdfs: bool = True):
        self.data_dir = POSITIONS_DATA_DIR
        self.pdfs_dir = POSITIONS_PDFS_DIR
        self.positions_cache: Dict[str, Dict] = {}
        
        try:
            self._load_positions()
            
            # Cargar automáticamente PDFs si están disponibles
            if auto_load_pdfs:
                self._auto_load_pdfs()
        except Exception as e:
            logger.error(f"Error inicializando PositionService: {e}", exc_info=True)
            # Continuar con cache vacío en lugar de fallar completamente
            self.positions_cache = {}
    
    def _load_positions(self):
        """Carga todas las posiciones desde archivos JSON"""
        self.positions_cache = {}
        if not self.data_dir.exists():
            logger.warning(f"Directorio de posiciones no existe: {self.data_dir}")
            return
        
        for json_file in self.data_dir.glob("position_*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    position = json.load(f)
                    self.positions_cache[position['id']] = position
                logger.info(f"Cargada posición: {position.get('title', 'Unknown')}")
            except Exception as e:
                logger.error(f"Error cargando {json_file}: {e}")
    
    def _auto_load_pdfs(self):
        """Carga automáticamente PDFs de la carpeta al iniciar"""
        if not self.pdfs_dir.exists():
            logger.info(f"Directorio de PDFs no existe: {self.pdfs_dir}")
            return
        
        pdf_files = list(self.pdfs_dir.glob("*.pdf"))
        if not pdf_files:
            logger.info(f"No se encontraron PDFs en {self.pdfs_dir}")
            return
        
        logger.info(f"Encontrados {len(pdf_files)} PDFs. Procesando automáticamente...")
        try:
            created = self.load_pdfs_from_directory(self.pdfs_dir)
            if created:
                logger.info(f"✅ {len(created)} posiciones cargadas automáticamente desde PDFs")
            else:
                logger.info("No se crearon nuevas posiciones (posiblemente ya existían)")
        except Exception as e:
            logger.error(f"Error al cargar PDFs automáticamente: {e}")
    
    def list_positions(
        self,
        status: Optional[str] = "active",
        department: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict]:
        """
        Lista posiciones disponibles con filtros opcionales
        
        Args:
            status: 'active', 'closed', 'draft', o None para todas
            department: Filtrar por departamento
            search: Buscar en título o descripción
        """
        try:
            positions = list(self.positions_cache.values())
            
            # Filtrar por status
            if status:
                positions = [p for p in positions if p.get('status') == status]
            
            # Filtrar por departamento
            if department:
                positions = [p for p in positions if p.get('department') == department]
            
            # Buscar en título o descripción
            if search:
                search_lower = search.lower()
                positions = [
                    p for p in positions
                    if search_lower in p.get('title', '').lower() or
                       search_lower in p.get('job_description', {}).get('raw_text', '').lower()
                ]
            
            # Ordenar por último uso (más recientes primero)
            positions.sort(
                key=lambda x: x.get('statistics', {}).get('last_used', '') or '',
                reverse=True
            )
            
            return positions
        except Exception as e:
            logger.error(f"Error en list_positions: {e}", exc_info=True)
            return []
    
    def get_position(self, position_id: str) -> Optional[Dict]:
        """Obtiene una posición específica por ID"""
        return self.positions_cache.get(position_id)
    
    def get_position_by_code(self, code: str) -> Optional[Dict]:
        """Obtiene una posición por código"""
        for position in self.positions_cache.values():
            if position.get('code') == code:
                return position
        return None
    
    def load_pdfs_from_directory(self, pdf_dir: Optional[Path] = None) -> List[Dict]:
        """
        Escanea una carpeta de PDFs y crea posiciones automáticamente
        
        Args:
            pdf_dir: Directorio con PDFs (opcional, usa el default si no se especifica)
        
        Returns:
            Lista de posiciones creadas/actualizadas
        """
        if pdf_dir is None:
            pdf_dir = self.pdfs_dir
        
        if not pdf_dir.exists():
            logger.warning(f"Directorio de PDFs no existe: {pdf_dir}")
            return []
        
        created_positions = []
        
        # Buscar todos los PDFs
        for pdf_file in pdf_dir.glob("*.pdf"):
            try:
                # Leer el PDF
                with open(pdf_file, 'rb') as f:
                    pdf_bytes = f.read()
                
                # Extraer texto
                text, warnings = extract_text_from_pdf(pdf_bytes)
                
                if not text or len(text.strip()) < 50:
                    logger.warning(f"PDF {pdf_file.name} no tiene suficiente texto")
                    continue
                
                # Generar ID y código basado en el nombre del archivo
                filename_base = pdf_file.stem  # nombre sin extensión
                position_id = f"position_{filename_base}"
                code = filename_base.upper().replace('_', '-')
                
                # Verificar si ya existe
                existing = self.get_position(position_id)
                
                if existing:
                    # Actualizar posición existente
                    position = existing
                    position['job_description']['raw_text'] = text
                    position['job_description']['word_count'] = len(text.split())
                    position['job_description']['extracted_at'] = datetime.utcnow().isoformat()
                    position['updated_at'] = datetime.utcnow().isoformat()
                    logger.info(f"Actualizada posición: {position_id}")
                else:
                    # Crear nueva posición
                    position = {
                        "id": position_id,
                        "code": code,
                        "title": self._extract_title_from_text(text) or filename_base.replace('_', ' ').title(),
                        "department": "RH",  # Default, puede ajustarse manualmente
                        "location": "CDMX",  # Default, puede ajustarse manualmente
                        "status": "active",
                        "created_at": datetime.utcnow().isoformat(),
                        "created_by": "system",
                        "updated_at": datetime.utcnow().isoformat(),
                        "updated_by": "system",
                        "job_description": {
                            "raw_text": text,
                            "pdf_path": f"positions/pdfs/{pdf_file.name}",
                            "word_count": len(text.split()),
                            "extracted_at": datetime.utcnow().isoformat()
                        },
                        "metadata": {
                            "salary_range": "Competitivo",
                            "experience_required": "A definir",
                            "education_level": "A definir",
                            "employment_type": "Tiempo completo"
                        },
                        "statistics": {
                            "times_used": 0,
                            "candidates_analyzed": 0,
                            "last_used": None
                        }
                    }
                    logger.info(f"Creada nueva posición: {position_id}")
                
                # Guardar en JSON
                json_path = self.data_dir / f"{position_id}.json"
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(position, f, ensure_ascii=False, indent=2)
                
                # Actualizar cache
                self.positions_cache[position_id] = position
                created_positions.append(position)
                
            except Exception as e:
                logger.error(f"Error procesando PDF {pdf_file.name}: {e}")
        
        return created_positions
    
    def _extract_title_from_text(self, text: str) -> Optional[str]:
        """Intenta extraer el título del JD del texto"""
        lines = text.split('\n')
        for line in lines[:10]:  # Buscar en las primeras 10 líneas
            line = line.strip()
            if line and len(line) < 100 and len(line) > 5:
                # Si la línea parece un título (no muy larga, no muy corta)
                if any(keyword in line.lower() for keyword in ['analista', 'desarrollador', 'gerente', 'coordinador', 'especialista']):
                    return line
        return None
    
    def create_position_from_pdf(
        self,
        pdf_bytes: bytes,
        filename: str,
        title: str,
        department: str,
        location: str,
        created_by: str
    ) -> Dict:
        """
        Crea una nueva posición desde un PDF subido (solo admin)
        
        Args:
            pdf_bytes: Contenido del PDF
            filename: Nombre del archivo
            title: Título de la posición
            department: Departamento
            location: Ubicación
            created_by: Usuario que crea la posición
        """
        # Extraer texto del PDF
        text, warnings = extract_text_from_pdf(pdf_bytes)
        
        # Generar ID único
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        position_id = f"position_{timestamp}"
        code = f"POS-{timestamp}"
        
        # Guardar PDF
        pdf_path = self.pdfs_dir / f"{position_id}.pdf"
        with open(pdf_path, 'wb') as f:
            f.write(pdf_bytes)
        
        # Ruta relativa para almacenar
        pdf_relative_path = f"positions/pdfs/{position_id}.pdf"
        
        # Crear posición
        position = {
            "id": position_id,
            "code": code,
            "title": title,
            "department": department,
            "location": location,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "created_by": created_by,
            "updated_at": datetime.utcnow().isoformat(),
            "updated_by": created_by,
            "job_description": {
                "raw_text": text,
                "pdf_path": pdf_relative_path,
                "word_count": len(text.split()),
                "extracted_at": datetime.utcnow().isoformat()
            },
            "metadata": {
                "salary_range": "Competitivo",
                "experience_required": "A definir",
                "education_level": "A definir",
                "employment_type": "Tiempo completo"
            },
            "statistics": {
                "times_used": 0,
                "candidates_analyzed": 0,
                "last_used": None
            }
        }
        
        # Guardar JSON
        json_path = self.data_dir / f"{position_id}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(position, f, ensure_ascii=False, indent=2)
        
        # Actualizar cache
        self.positions_cache[position_id] = position
        
        logger.info(f"Posición creada: {position_id} por {created_by}")
        return position
    
    def update_position_statistics(self, position_id: str, candidates_count: int = 1):
        """Actualiza estadísticas de uso de una posición"""
        position = self.positions_cache.get(position_id)
        if not position:
            return
        
        stats = position.setdefault('statistics', {})
        stats['times_used'] = stats.get('times_used', 0) + 1
        stats['candidates_analyzed'] = stats.get('candidates_analyzed', 0) + candidates_count
        stats['last_used'] = datetime.utcnow().isoformat()
        
        # Guardar actualización
        json_path = self.data_dir / f"{position_id}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(position, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Estadísticas actualizadas para {position_id}")


# Instancia global del servicio
position_service = PositionService()

