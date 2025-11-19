#!/usr/bin/env python3
"""
Script para cargar posiciones desde PDFs en una carpeta

Uso:
    python scripts/load_positions_from_pdfs.py [ruta_a_carpeta_pdfs]

Si no se especifica ruta, usa backend/positions/pdfs por defecto
"""

import sys
import os
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.position_service import PositionService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    # Obtener ruta de PDFs desde argumento o usar default
    if len(sys.argv) > 1:
        pdf_dir = Path(sys.argv[1])
    else:
        pdf_dir = Path("backend/positions/pdfs")
    
    if not pdf_dir.exists():
        logger.error(f"El directorio no existe: {pdf_dir}")
        logger.info(f"Creando directorio: {pdf_dir}")
        pdf_dir.mkdir(parents=True, exist_ok=True)
        logger.info("Por favor, coloca tus PDFs en esta carpeta y ejecuta el script nuevamente.")
        return
    
    logger.info(f"Escaneando PDFs en: {pdf_dir}")
    
    # Crear servicio y cargar PDFs
    service = PositionService()
    created_positions = service.load_pdfs_from_directory(pdf_dir)
    
    if created_positions:
        logger.info(f"\n✅ Procesados {len(created_positions)} PDFs:")
        for pos in created_positions:
            logger.info(f"  - {pos['title']} (ID: {pos['id']})")
        logger.info(f"\n📁 Posiciones guardadas en: backend/positions/data/")
    else:
        logger.warning("No se encontraron PDFs válidos para procesar.")
        logger.info(f"Coloca tus PDFs en: {pdf_dir}")


if __name__ == "__main__":
    main()

