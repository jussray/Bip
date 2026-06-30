FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIPER_VOICE_DIR=/voices

WORKDIR /app

# ── System deps ──────────────────────────────────────────────────────────────
# wget + ca-certificates to download piper and voice models at build time.
# libgomp1 is required by the piper binary at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    ca-certificates \
    libgomp1 \
  && rm -rf /var/lib/apt/lists/*

# ── Piper binary ─────────────────────────────────────────────────────────────
# Installs the pre-built piper CLI to /usr/local/bin/piper.
# server.py calls it as: subprocess.run(["piper", "--model", ..., "--output_file", ...])
ARG PIPER_VERSION=2023.11.14-2
RUN wget -q "https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_x86_64.tar.gz" \
      -O /tmp/piper.tar.gz \
  && tar -xzf /tmp/piper.tar.gz -C /tmp \
  && mv /tmp/piper/piper /usr/local/bin/piper \
  && chmod +x /usr/local/bin/piper \
  && rm -rf /tmp/piper /tmp/piper.tar.gz

# ── Voice models ─────────────────────────────────────────────────────────────
# Bakes the 4 character voice models into the image at build time so the
# container is fully self-contained. Each model needs two files:
#   <stem>.onnx       — the neural network weights
#   <stem>.onnx.json  — the phoneme/config metadata
#
# Model → character mapping (defined in constants/voiceBip.ts):
#   en_US-amy-medium   → raylene + sekret  (warm, expressive female)
#   en_US-ryan-medium  → rylane            (direct male)
#   en_US-amy-low      → cloud             (softer female)
#   en_US-lessac-low   → night             (quietest, unhurried)
#
# Source: https://huggingface.co/rhasspy/piper-voices/tree/main
ARG PIPER_VOICES_BASE=https://huggingface.co/rhasspy/piper-voices/resolve/main

RUN mkdir -p /voices

# en_US-amy-medium (raylene + sekret)
RUN wget -q "${PIPER_VOICES_BASE}/en/en_US/amy/medium/en_US-amy-medium.onnx" \
      -O /voices/en_US-amy-medium.onnx \
  && wget -q "${PIPER_VOICES_BASE}/en/en_US/amy/medium/en_US-amy-medium.onnx.json" \
      -O /voices/en_US-amy-medium.onnx.json

# en_US-ryan-medium (rylane)
RUN wget -q "${PIPER_VOICES_BASE}/en/en_US/ryan/medium/en_US-ryan-medium.onnx" \
      -O /voices/en_US-ryan-medium.onnx \
  && wget -q "${PIPER_VOICES_BASE}/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json" \
      -O /voices/en_US-ryan-medium.onnx.json

# en_US-amy-low (cloud)
RUN wget -q "${PIPER_VOICES_BASE}/en/en_US/amy/low/en_US-amy-low.onnx" \
      -O /voices/en_US-amy-low.onnx \
  && wget -q "${PIPER_VOICES_BASE}/en/en_US/amy/low/en_US-amy-low.onnx.json" \
      -O /voices/en_US-amy-low.onnx.json

# en_US-lessac-low (night)
RUN wget -q "${PIPER_VOICES_BASE}/en/en_US/lessac/low/en_US-lessac-low.onnx" \
      -O /voices/en_US-lessac-low.onnx \
  && wget -q "${PIPER_VOICES_BASE}/en/en_US/lessac/low/en_US-lessac-low.onnx.json" \
      -O /voices/en_US-lessac-low.onnx.json

# ── Python deps ───────────────────────────────────────────────────────────────
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# ── App ───────────────────────────────────────────────────────────────────────
COPY server.py ./server.py

EXPOSE 8080
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
