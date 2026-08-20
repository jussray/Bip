# Se'kret Bip internal Cloudflare Sandbox

This subproject is an **internal control-plane execution worker**. It is not part of the teen-facing app, `sekret-backend`, or the public Pages frontend.

## Safety boundary

- Workers Paid plan / Containers are required before activation.
- `workers_dev` is disabled and no custom route is declared.
- The sandbox container has public internet egress disabled by default.
- No Supabase service role, OpenAI key, ElevenLabs key, GitHub token, or other long-lived credential is passed into the container.
- `/v1/exec` requires `SANDBOX_ADMIN_TOKEN` in the Worker environment before a sandbox is allocated.
- Execution accepts bounded argv only. Shell-string execution is not exposed.
- Each task is destroyed after completion.
- `max_instances` is 1 until a separately reviewed capacity/cost change.

## Local proof

```bash
npm install
npm run check
```

The repository exact-head workflow performs only a Wrangler dry-run. It does not deploy a Worker or Container.

## Provider activation gate

Do not deploy this subproject until the Cloudflare account is confirmed on Workers Paid and the deployment is explicitly approved as a separate provider action. On first activation, set `SANDBOX_ADMIN_TOKEN` as a Worker secret. Do not place its value in source, vars, CI logs, or sandbox process environment.

Future credentialed outbound access must use trusted outbound handlers so the credential remains in the Worker runtime rather than inside untrusted sandbox code.
