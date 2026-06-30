# Piper TTS for Voice Bip

Voice Bip prefers a self-hosted Piper service when `PIPER_TTS_URL` is configured. If Piper is unavailable and `OPENAI_API_KEY` exists, the Worker keeps the existing OpenAI TTS fallback.

## Voice files

Mount one `.onnx` model and matching `.onnx.json` file per installed voice. Filenames become voice IDs:

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

Use only models whose licenses permit the intended deployment. Voice-model licenses are separate from the Piper software license. Do not clone or imitate a real person's voice without permission.

Piper's current upstream implementation is GPL-3.0 licensed. Review the software and model license obligations before distributing or offering the service publicly.

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

Deploy Piper on a host that can run the container. Set `PIPER_TTS_URL` on the Bip Worker to that HTTPS service URL and store the matching token securely:

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

Piper does not charge per generated character or request. The server, storage, and bandwidth used to host it can still cost money.
