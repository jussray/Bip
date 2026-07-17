# Bip Control Room — local report

Generated: 2026-07-17T09:40:24.069Z

Status: **GREEN**
Score: **100%**
Push safe: **yes**
Demo ready: **yes**

| Area | Check | Status | Duration | Command |
| --- | --- | --- | ---: | --- |
| app | Runtime assets | ✅ pass | 202ms | `npm run audit:runtime-assets` |
| control-room | Control Room structure | ✅ pass | 163ms | `npm run audit:control-room:structure` |
| supabase | Supabase RLS scan | ✅ pass | 183ms | `npm run audit:control-room:rls` |
| companions | Companion assets | ✅ pass | 165ms | `npm run validate:companions` |
| code-quality | TypeScript | ✅ pass | 13635ms | `npm run type-check` |
| code-quality | Lint | ✅ pass | 4786ms | `npm run lint` |
| tests | Unit tests | ✅ pass | 1463ms | `npm test` |
| voice | Voice intelligence | ✅ pass | 1634ms | `npm run test:voice-intelligence` |
| oracle | Oracle discovery | ✅ pass | 1557ms | `npm run test:oracle` |
| assets | Room archives | ✅ pass | 430ms | `npm run verify:room-archives` |

## Guardrails
- No GitHub PAT is required or read by this script.
- No OpenAI key is required or read by this script.
- Do not run fixture audits on real teen private content.
- Use GitHub Actions only as a release/PR backup while minutes are constrained.
