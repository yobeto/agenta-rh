"""
Utility functions to extract text from PDF files securely
SIN RESTRICCIONES DE TAMAÑO para Job Descriptions y CVs
"""
from typing import Tuple
from io import BytesIO
import PyPDF2
import logging

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_bytes: bytes) -> Tuple[str, list[str]]:
    """
    Extrae texto de un archivo PDF (bytes) y retorna texto más advertencias.
    SIN RESTRICCIONES DE TAMAÑO: Extrae todo el texto del PDF sin límites.
    """
    warnings: list[str] = []
    
    try:
        reader = PyPDF2.PdfReader(BytesIO(file_bytes))
        num_pages = len(reader.pages)
        
        logger.info(f"Extrayendo texto de PDF con {num_pages} páginas (sin restricciones de tamaño)")
        
        extracted_text_parts: list[str] = []
        for page_index in range(num_pages):
            try:
                page = reader.pages[page_index]
                page_text = page.extract_text() or ""
                extracted_text_parts.append(page_text)
            except Exception as e:
                logger.warning(f"Error extrayendo texto de la página {page_index + 1}: {str(e)}")
                warnings.append(f"Error en página {page_index + 1}: {str(e)}")
                continue

        combined_text = "\n".join(extracted_text_parts)
        
        logger.info(f"Texto extraído: {len(combined_text)} caracteres de {num_pages} páginas")

        # Normalizar espacios (mantener estructura pero limpiar espacios excesivos)
        combined_text = "\n".join(
            line.strip() for line in combined_text.splitlines() if line.strip()
        )

        return combined_text, warnings
        
    except Exception as e:
        logger.error(f"Error extrayendo texto del PDF: {str(e)}")
        warnings.append(f"Error general al procesar PDF: {str(e)}")
        return "", warnings
