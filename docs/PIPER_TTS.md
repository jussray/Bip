# Piper TTS for Voice Bip

Voice Bip now prefers a self-hosted Piper service for companion speech. If Piper is unavailable and `OPENAI_API_KEY` is configured, the Worker falls back to OpenAI TTS.

## 1. Add voice models

Place one `.onnx` model and matching `.onnx.json` file in a host directory for each installed voice. The filenames become the voice IDs.

Example:

```text
voices/
  raylene.onnx
  raylene.onnx.json
  rylane.onnx
  rylane.onnx.json
  cloud.onnx
  cloud.onnx.json
  night.onnx
  night.onnx.json
```

Only use voice models whose licenses permit your intended use. Do not clone or imitate a real person's voice without permission.

## 2. Run the service

From the repository root:

```bash
docker build -t sekret-piper services/piper-tts
docker run --rm -p 8080:8080 \
  -e PIPER_API_TOKEN='replace-with-a-long-random-secret' \
  -v "$PWD/voices:/voices:ro" \
  sekret-piper
```

Check it:

```bash
curl http://localhost:8080/health
```

## 3. Configure the Cloudflare Worker

Set the Piper URL as a normal Worker variable and the shared token as a secret:

```bash
wrangler secret put PIPER_TTS_TOKEN --name bip
```

Add `PIPER_TTS_URL` in Cloudflare Worker settings or `wrangler.toml` for the deployed Piper endpoint.

Optional voice mappings:

```text
PIPER_RAYLENE_VOICE=raylene
PIPER_RYLANE_VOICE=rylane
PIPER_CLOUD_VOICE=cloud
PIPER_NIGHT_VOICE=night
PIPER_SEKRET_VOICE=sekret
PIPER_PARENT_COACH_VOICE=parentCoach
```

When a mapping is omitted, the character ID is used as the model filename.

## Runtime behavior

1. The app sends the generated reply to `/api/sekret/voice`.
2. The Worker calls Piper first when `PIPER_TTS_URL` is configured.
3. Piper returns WAV audio.
4. The Worker returns base64 audio in the same response shape the app already consumes.
5. If Piper fails and OpenAI TTS is configured, the Worker falls back to OpenAI.

Piper itself has no per-character API charge. Hosting and bandwidth can still cost money depending on where the service runs.
