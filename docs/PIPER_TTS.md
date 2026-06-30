# Piper TTS for Voice Bip

Voice Bip now prefers a self-hosted Piper service. If Piper is unavailable and `OPENAI_API_KEY` is configured, the Worker keeps the existing OpenAI TTS fallback.

## Voice files

Mount one `.onnx` model and matching `.onnx.json` file per voice. Filenames become voice IDs, for example:

```text
voices/raylene.onnx
voices/raylene.onnx.json
voices/rylane.onnx
voices/rylane.onnx.json
voices/cloud.onnx
voices/cloud.onnx.json
voices/night.onnx
voices/night.onnx.json
```

Use only voice models whose licenses permit your intended use. Do not imitate a real person's voice without permission.

## Run locally

```bash
docker build -t sekret-piper services/piper-tts
docker run --rm -p 8080:8080 \
  -e PIPER_API_TOKEN='replace-with-a-random-secret' \
  -v "$PWD/voices:/voices:ro" \
  sekret-piper
```

Check the service with `curl http://localhost:8080/health`.

## Configure Cloudflare

Set `PIPER_TTS_URL` to the deployed service URL and store the matching token securely:

```bash
wrangler secret put PIPER_TTS_TOKEN --name bip
```

Optional mappings:

```text
PIPER_RAYLENE_VOICE=raylene
PIPER_RYLANE_VOICE=rylane
PIPER_CLOUD_VOICE=cloud
PIPER_NIGHT_VOICE=night
PIPER_SEKRET_VOICE=sekret
PIPER_PARENT_COACH_VOICE=parentCoach
```

Piper has no per-character API charge, though the machine hosting it may still have compute and bandwidth costs.
