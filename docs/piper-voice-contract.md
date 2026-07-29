# Canonical Piper voice contract

Se'kret Bip routes voice synthesis through the canonical `sekret-backend` Worker. Mobile and web clients do not call Piper directly.

## Request path

`client -> sekret-backend /voice -> Piper /synthesize -> WAV response`

When Piper is configured and available, it is the first voice provider. The Worker may use its configured fallback provider if Piper fails.

## Default character models

| Character | Piper model stem |
| --- | --- |
| Suhana | `en_US-amy-medium` |
| Sy | `en_US-ryan-medium` |
| Cloud | `en_US-amy-low` |
| Night | `en_US-lessac-low` |
| Sekret | `en_US-amy-medium` |
| Parent Coach | `en_US-amy-medium` |

These defaults must match the models baked into `services/piper-tts/Dockerfile`. Environment-specific voice overrides remain supported by the Worker.

## Security boundary

- Keep `PIPER_TTS_URL` and `PIPER_TTS_TOKEN` in the Worker environment.
- Never expose the Piper token or service URL to the client application.
- Protect the Piper service with `PIPER_API_TOKEN` outside local development.
- Do not deploy or mutate production from repository evidence alone.

## Verification gates

Before release:

1. Run the Piper contract tests at the exact pull-request head.
2. Build the Piper container successfully.
3. Start the container with the four expected voice models present.
4. Verify `/health` reports those installed models.
5. Verify authenticated `/synthesize` returns playable WAV audio for Suhana, Sy, Cloud, and Night.
6. Verify `sekret-backend` reports `voiceSource: piper` for successful synthesis.
7. Verify fallback behavior without leaking provider details to clients.
