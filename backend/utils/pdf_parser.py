"""
Utility functions to extract text from PDF files securely
"""
from typing import Tuple
from io import BytesIO
import PyPDF2

MAX_PAGES = 20  # avoid excessive processing
MAX_TEXT_LENGTH = 10000  # limit text length to prevent overload

def extract_text_from_pdf(file_bytes: bytes) -> Tuple[str, list[str]]:
    """Extract text from a PDF file (bytes) and return text plus warnings."""
    warnings: list[str] = []
    reader = PyPDF2.PdfReader(BytesIO(file_bytes))
    num_pages = len(reader.pages)

    if num_pages > MAX_PAGES:
        warnings.append(f"El PDF tiene {num_pages} páginas. Se analizaron solo las primeras {MAX_PAGES}.")
        num_pages = MAX_PAGES

    extracted_text_parts: list[str] = []
    for page_index in range(num_pages):
        page = reader.pages[page_index]
        page_text = page.extract_text() or ""
        extracted_text_parts.append(page_text)

    combined_text = "\n".join(extracted_text_parts)

    if len(combined_text) > MAX_TEXT_LENGTH:
        warnings.append(
            "El texto extraído supera el límite. Se ha truncado para mantener la confidencialidad y el desempeño."
        )
        combined_text = combined_text[:MAX_TEXT_LENGTH]

    # Normalizar espacios
    combined_text = "\n".join(
        line.strip() for line in combined_text.splitlines() if line.strip()
    )

    return combined_text, warnings
