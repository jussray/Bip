# Se'kret Bip — MCP tooling boundary

Se'kret Bip handles teen and parent identity, journals, voice, Circle activity, relationship state, safety signals, and private account data. MCP tools may support development, documentation, browser verification, and deployment evidence, but they do not become part of the app's runtime trust boundary.

## MCP servers

- **GitHub:** repository, pull-request, Actions, code-security, and secret-protection evidence with allow-listed toolsets and lockdown mode.
- **Bright Data:** VS Code/Codespaces only, prompted at runtime for `API_TOKEN`, and restricted to `GROUPS=code` for current npm and PyPI package metadata.
- **Microsoft Learn:** current official Microsoft technical documentation and code samples; no authentication required.
- **Supabase:** read-only and scoped to Bip project `tbsevonvegdnlyjgplmm`, database and documentation features only.
- **Figma:** approved product design context.
- **Cloudflare Docs, Builds, and Observability:** documentation, build, and release evidence only.
- **Playwright:** pinned isolated Chromium for controlled browser verification.

## Credential boundary

The committed root `.mcp.json` remains credential-free and intentionally omits Bright Data. `.mcp.example.json` contains a placeholder only. VS Code/Codespaces prompts for the Bright Data token as a masked input. Other MCP hosts must configure Bright Data locally and keep the token outside the repository.

Bright Data Pro Mode, browser automation, ecommerce tools, broad scraping, general web-data groups, and explicit extra tools are forbidden by the MCP verification script. The Code group is advisory package metadata only.

## Data boundary

Do not send real teen or parent identity, journals, voice notes, Circle posts, safety events, moderation evidence, account records, relationship state, Bip IDs, credentials, tokens, production logs, private prompts, or unreleased sensitive product material to external MCP tools.

MCP output may inform a development decision. It may not bypass consent, privacy rules, RLS, safety logic, founder approval, CI, release verification, deployment approval, or rollback controls.

## GitHub coding agent

The committed MCP files configure compatible repository workspaces. GitHub coding-agent MCP settings and agent secrets are separate repository settings and are not stored in these files. Do not add a duplicate GitHub MCP server there when GitHub's built-in repository tools are already enabled. Any Bright Data coding-agent secret must remain in GitHub's encrypted agent-secret store, never in source.
