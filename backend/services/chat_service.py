"""
Servicio de chat para consultas generales sobre preselección
"""
import os
import logging
from typing import List, Optional

from openai import OpenAI
from anthropic import Anthropic
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

ChatHistory = List[dict[str, str]]


class ChatService:
    """Gestiona conversaciones con IA manteniendo las reglas éticas"""

    def __init__(self):
        self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if os.getenv("OPENAI_API_KEY") else None
        self.anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY")) if os.getenv("ANTHROPIC_API_KEY") else None

        if os.getenv("GOOGLE_API_KEY"):
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            self.gemini_configured = True
        else:
            self.gemini_configured = False

        self.default_model = os.getenv("DEFAULT_AI_MODEL", "gpt-4")

    async def chat(
        self,
        message: str,
        chat_history: Optional[ChatHistory] = None,
        model_id: Optional[str] = None,
    ) -> str:
        prompt = self._build_prompt(message, chat_history)
        model = (model_id or self.default_model).lower()

        if model.startswith("gpt") and self.openai_client:
            return await self._call_openai(prompt, model_id or self.default_model)
        if model.startswith("claude") and self.anthropic_client:
            return await self._call_anthropic(prompt, model_id or self.default_model)
        if model.startswith("gemini") and self.gemini_configured:
            return await self._call_gemini(prompt, model_id or self.default_model)

        raise ValueError("No hay servicio de IA configurado o el modelo no es válido")

    def _build_prompt(self, message: str, chat_history: Optional[ChatHistory]) -> str:
        history_lines: List[str] = []
        if chat_history:
            for item in chat_history[-6:]:  # limitar historial a las últimas 6 interacciones
                role = "ESPECIALISTA" if item.get("role") == "assistant" else "RECLUTADOR"
                content = item.get("content", "").strip()
                if content:
                    history_lines.append(f"{role}: {content}")

        history_text = "\n".join(history_lines)

        return f"""Eres un asistente ético de Recursos Humanos de agente-rh. Apoyas la preselección de candidatos de nivel medio.

REGLAS ESTRICTAS:
- Analiza solo información laboral relevante.
- Usa lenguaje neutral y profesional.
- Cada respuesta debe basarse en criterios objetivos y verificables.
- No infieras edad, género, estado civil u otros atributos personales.
- Si la información es insuficiente, dilo explícitamente y sugiere qué falta.
- Recuerda: tus respuestas son apoyo para un evaluador humano, no decisiones finales.

Historial reciente de la conversación (solo contexto laboral):
{history_text if history_text else 'Sin mensajes previos'}

Consulta actual del equipo de RH:
{message.strip()}

Responde en español neutral con pasos claros y, cuando sea posible, listas numeradas o bullets. Mantén la respuesta focalizada en criterios laborales objetivos.
"""

    async def _call_openai(self, prompt: str, model: str) -> str:
        try:
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "Eres un asistente ético de Recursos Humanos de agente-rh. Cumple con principios de objetividad y privacidad.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=1200,
            )
            return (response.choices[0].message.content or "").strip()
        except Exception as exc:
            logger.error(f"Error en OpenAI chat: {exc}")
            raise

    async def _call_anthropic(self, prompt: str, model: str) -> str:
        try:
            model_map = {
                "claude-opus-4": "claude-opus-4-20250514",
                "claude-sonnet-4": "claude-sonnet-4-20250514",
                "claude-haiku-3.5": "claude-3-5-haiku-20241022",
            }
            anthropic_model = model_map.get(model, "claude-sonnet-4-20250514")
            message = self.anthropic_client.messages.create(
                model=anthropic_model,
                max_tokens=1200,
                temperature=0.2,
                system="Eres un asistente ético de Recursos Humanos de agente-rh. Cumple con principios de objetividad y privacidad.",
                messages=[{"role": "user", "content": prompt}],
            )
            if not message.content:
                return "No se obtuvo respuesta de la IA."
            return (message.content[0].text or "").strip()
        except Exception as exc:
            logger.error(f"Error en Anthropic chat: {exc}")
            raise

    async def _call_gemini(self, prompt: str, model: str) -> str:
        try:
            model_map = {
                "gemini-2.5-pro": "gemini-2.5-pro",
                "gemini-2.5-flash": "gemini-2.5-flash",
                "gemini-1.5-pro": "gemini-pro-latest",
            }
            gemini_model = model_map.get(model, "gemini-2.5-flash")
            gen_model = genai.GenerativeModel(gemini_model)
            response = gen_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=1200,
                ),
            )
            return (response.text or "").strip()
        except Exception as exc:
            logger.error(f"Error en Gemini chat: {exc}")
            raise
