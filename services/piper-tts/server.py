import base64
import io
import os
import subprocess
import tempfile
import wave
from functools import lru_cache
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
from piper import PiperVoice
from pydantic import BaseModel, Field

app = FastAPI(title="Se'kret Bip Piper TTS")
VOICE_DIR = Path(os.environ.get("PIPER_VOICE_DIR", "/voices"))
API_TOKEN = os.environ.get("PIPER_API_TOKEN", "").strip()


class SynthesisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    voice: str = Field(min_length=1, max_length=80)
    format: str = "wav"


def require_token(authorization: str | None) -> None:
    if API_TOKEN and authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")


def resolve_model(voice: str) -> Path:
    safe_voice = "".join(ch for ch in voice if ch.isalnum() or ch in {"-", "_"})
    model = VOICE_DIR / f"{safe_voice}.onnx"
    config = VOICE_DIR / f"{safe_voice}.onnx.json"
    if not model.is_file() or not config.is_file():
        raise HTTPException(status_code=404, detail=f"Voice '{safe_voice}' is not installed")
    return model


@lru_cache(maxsize=8)
def load_aligned_voice(voice: str) -> PiperVoice:
    # Voice models are patched during the image build. Loading the model once
    # keeps the alignment path cheap while leaving the legacy CLI path intact.
    return PiperVoice.load(str(resolve_model(voice)))


@app.get("/health")
def health() -> dict[str, object]:
    return {"ok": True, "voices": sorted(path.stem for path in VOICE_DIR.glob("*.onnx"))}


@app.post("/synthesize")
def synthesize(
    payload: SynthesisRequest,
    background_tasks: BackgroundTasks,
    authorization: str | None = Header(default=None),
):
    """Stable WAV endpoint retained for existing callers and rollback safety."""
    require_token(authorization)
    if payload.format != "wav":
        raise HTTPException(status_code=400, detail="Piper service currently returns WAV only")
    model = resolve_model(payload.voice)
    output = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    output.close()
    try:
        subprocess.run(
            ["piper", "--model", str(model), "--output_file", output.name],
            input=payload.text,
            text=True,
            check=True,
            timeout=45,
        )
        background_tasks.add_task(Path(output.name).unlink, missing_ok=True)
        return FileResponse(output.name, media_type="audio/wav", filename=f"{payload.voice}.wav")
    except subprocess.TimeoutExpired as exc:
        Path(output.name).unlink(missing_ok=True)
        raise HTTPException(status_code=504, detail="Synthesis timed out") from exc
    except subprocess.CalledProcessError as exc:
        Path(output.name).unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Piper synthesis failed") from exc


@app.post("/synthesize-aligned")
def synthesize_aligned(
    payload: SynthesisRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, object]:
    """Return the same WAV speech plus phoneme timing for living portraits.

    This endpoint is additive. If a deployed Worker predates it, the Worker can
    fall back to /synthesize without changing Voice Bip availability.
    """
    require_token(authorization)
    if payload.format != "wav":
        raise HTTPException(status_code=400, detail="Piper service currently returns WAV only")

    try:
        voice = load_aligned_voice(payload.voice)
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, "wb") as wav_file:
            alignments = voice.synthesize_wav(
                payload.text,
                wav_file,
                include_alignments=True,
            )

        cursor_seconds = 0.0
        timing: list[dict[str, object]] = []
        sample_rate = float(voice.config.sample_rate)
        for alignment in alignments or []:
            duration_seconds = float(alignment.num_samples) / sample_rate
            timing.append(
                {
                    "phoneme": alignment.phoneme,
                    "startSeconds": cursor_seconds,
                    "durationSeconds": duration_seconds,
                }
            )
            cursor_seconds += duration_seconds

        return {
            "audioBase64": base64.b64encode(wav_buffer.getvalue()).decode("ascii"),
            "contentType": "audio/wav",
            "voice": payload.voice,
            "alignments": timing,
            "alignmentsAvailable": bool(timing),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Aligned Piper synthesis failed") from exc
