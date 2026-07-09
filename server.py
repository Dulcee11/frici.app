"""
FRICI AI Backend — FastAPI + Claude API
Recibe el contexto del usuario y genera respuestas personalizadas de bienestar.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import os
from dotenv import load_dotenv

load_dotenv()  # lee .env si existe

# ── Pon tu API key en .env como: ANTHROPIC_API_KEY=sk-ant-... ──
# El SDK la lee del entorno automáticamente; solo la usamos para validar.
API_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()

app = FastAPI(title="FRICI AI Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Si hay key explícita la pasamos; si no, el SDK busca ANTHROPIC_API_KEY en el entorno
client = anthropic.Anthropic(api_key=API_KEY) if API_KEY else anthropic.Anthropic()

SYSTEM_PROMPT = """Eres FRICI, una compañera de bienestar digital empática, cálida y directa. \
Tu objetivo es ayudar a la usuaria a evitar el agotamiento digital, mejorar sus hábitos y gestionar mejor su energía.

## Usuaria actual:
{user_name}

## Lo que sabes de la usuaria en este momento:
{user_context}

## Tu forma de ser:
- Hablas en español, tuteo, tono cercano pero profesional
- Eres empática pero concreta: das sugerencias accionables, no solo frases de aliento
- Detectas patrones: si la usuaria lleva días con sueño malo y alta carga, lo nombras
- Nunca diagnosticas ni reemplazas a un profesional de salud
- Cuando detectas señales de burnout (carga alta + emociones negativas recurrentes + sueño malo), lo mencionas con cuidado
- Usas emojis con moderación: 🌿 💚 para calidez, sin exceso
- Respuestas cortas (2-4 párrafos max) salvo que la usuaria pida más detalle
- Si la usuaria repite la misma queja varias veces en la conversación, ofrece un plan concreto

## Límite ético:
Al final de cada respuesta que toque salud mental, añade una línea suave recordando que FRICI no reemplaza atención profesional."""

class Message(BaseModel):
    role: str  # "user" | "assistant"
    text: str

class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []
    user_context: dict = {}

def build_context_text(ctx: dict) -> str:
    """Convierte el contexto del usuario en texto legible para el sistema."""
    lines = []

    if ctx.get("mood") is not None:
        moods = ["Bien 😊", "Regular 😐", "Cansada 😔", "Agotada 😰"]
        lines.append(f"- Ánimo hoy: {moods[ctx['mood']] if ctx['mood'] < len(moods) else 'desconocido'}")

    if ctx.get("checkin"):
        ci = ctx["checkin"]
        lines.append(f"- Carga de agenda hoy: {ci.get('carga', '?')}%")
        lines.append(f"- Calidad de sueño anoche: {ci.get('sleep', 'desconocida')}")
        emotions = ci.get("emotions", [])
        if emotions:
            lines.append(f"- Emociones reportadas: {', '.join(emotions)}")

    if ctx.get("habits"):
        habits = [h for h in ctx["habits"] if h and isinstance(h, dict)]
        done = [h["label"] for h in habits if h.get("done")]
        pending = [h["label"] for h in habits if not h.get("done")]
        streaks = [(h["label"], h.get("streak", 0)) for h in habits if h.get("streak", 0) > 0]
        if done:
            lines.append(f"- Hábitos completados hoy: {', '.join(done)}")
        if pending:
            lines.append(f"- Hábitos pendientes: {', '.join(pending)}")
        if streaks:
            lines.append(f"- Rachas activas: {', '.join(f'{l} ({s} días)' for l, s in streaks)}")

    if ctx.get("stats"):
        s = ctx["stats"]
        lines.append(f"- Promedio de sueño esta semana: {s.get('sleepHours', '?')}h")
        lines.append(f"- Racha de días consecutivos: {s.get('streakDays', 0)} días")

    # Detección automática de patrones de riesgo
    checkin = ctx.get("checkin") or {}
    risk_signals = []
    if checkin.get("carga", 0) > 70:
        risk_signals.append("agenda muy cargada")
    emotions = checkin.get("emotions") or []
    if any(e in emotions for e in ["Agotamiento", "Ansiedad", "Estrés"]):
        risk_signals.append("emociones de estrés")
    sleep = checkin.get("sleep") or ""
    if "Mal" in sleep or "Regular" in sleep:
        risk_signals.append("sueño deficiente")
    if len(risk_signals) >= 2:
        lines.append(f"\n⚠️  SEÑALES DE ALERTA detectadas: {', '.join(risk_signals)}. Ten esto en cuenta al responder.")

    return "\n".join(lines) if lines else "No hay datos del check-in de hoy todavía."

@app.post("/chat")
async def chat(req: ChatRequest):
    if not API_KEY and not os.environ.get("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=500, detail="Configura ANTHROPIC_API_KEY en el archivo .env o como variable de entorno.")
    try:
        context_text = build_context_text(req.user_context)
        user_name = req.user_context.get("userName", "")
        name_line = f"Nombre: {user_name}. Llámala por su nombre en los saludos." if user_name else "Nombre desconocido."
        system = SYSTEM_PROMPT.replace("{user_name}", name_line).replace("{user_context}", context_text)

        messages = [{"role": m.role, "content": m.text} for m in req.history]
        messages.append({"role": "user", "content": req.message})

        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=600,
            system=system,
            messages=messages,
        )
        return {"reply": response.content[0].text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al llamar a Claude: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "ok", "api_key_configured": bool(API_KEY or os.environ.get("ANTHROPIC_API_KEY"))}
