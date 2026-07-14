# Se'kret Bip MCP Stack

Last reviewed: 2026-07-14

This is the smallest MCP stack that matches the repository's actual operating surface: GitHub for source control, Supabase for schema inspection, Context7 for current library documentation, Figma for design handoff, Cloudflare for deployment evidence, and Playwright for browser verification.

The configuration lives in:

- `.mcp.json` for Claude Code and compatible MCP hosts;
- `.vscode/mcp.json` for VS Code and Codespaces;
- `.mcp.example.json` as the reusable template.

## Connected servers

| Server | Purpose | Default boundary |
| --- | --- | --- |
| `github` | Repository, issues, pull requests, Actions, code scanning, and secret scanning | Hosted HTTP server; selected toolsets only; lockdown mode enabled for this public repository |
| `supabase` | Inspect the Bip project schema and Supabase documentation | Project-scoped, read-only, database and docs tools only |
| `context7` | Retrieve current, library-specific implementation documentation | Documentation lookup only; never send private product or user content |
| `figma` | Read exact design frames, screenshots, variables, and component context | OAuth; no token committed |
| `cloudflare-docs` | Current Cloudflare product documentation | Documentation only |
| `cloudflare-builds` | Inspect Workers Builds evidence | OAuth; grant only the account permissions needed |
| `cloudflare-observability` | Inspect Worker logs and analytics | OAuth; no raw teen content should be queried or copied into prompts |
| `playwright` | Interactive browser inspection and phone-width web verification | Local, version-pinned package, isolated Chromium profile |

## Why Context7 is included

Bip depends on fast-moving libraries such as Expo, Expo Router, React Native, Supabase, Playwright, Cloudflare Workers, and model SDKs. Context7 is included so coding agents can retrieve current, library-specific documentation before changing code instead of relying only on stale examples or model memory.

Context7 is evidence for implementation decisions, not release proof. The installed package versions, repository tests, exact-head CI, Expo Go walkthroughs, and deployed runtime behavior remain authoritative.

Do not send Context7 real teen or parent messages, journal entries, voice transcripts, Circle or Crew content, account data, Bip IDs, safety events, production logs, or database rows.

## Why the Supabase server is read-only

The configured project ref is the live Bip project. Supabase's own guidance says its MCP server is intended for development and testing and should not be connected casually to production data. The repository therefore keeps the always-on MCP connection read-only.

Database changes must continue through the existing reviewed path:

1. create a migration in `supabase/migrations/`;
2. add or update denial and behavior tests;
3. open a pull request;
4. pass exact-head CI;
5. apply the approved migration deliberately;
6. record parity and rollback-contained evidence.

Do not remove `read_only=true` from the committed configuration. For a controlled maintenance session, use a private local override that is never committed.

## Default connection decisions

- Use GitHub's hosted HTTP MCP server in the committed stack. A local Docker GitHub server is an optional private fallback, not a second default connection.
- Keep GitHub Insiders mode out of committed configuration. Experimental tools may be enabled privately for a bounded test and removed afterward.
- Keep Playwright pinned to the reviewed package version and run it with an isolated Chromium profile. Do not use `@latest` in committed configuration.
- Use Context7 for current public documentation. Do not treat it as a repository, database, deployment, or testing tool.
- Keep Netdata out until Bip owns persistent hosts or containers that Netdata can actually monitor.
- Keep DBHub and other generic database MCP servers out while the project-scoped, read-only Supabase MCP covers the live database workflow with less authority.

## First connection

### Claude Code

Open the repository, then run:

```text
/mcp
```

Authenticate the remote servers one at a time. GitHub, Supabase, Figma, and Cloudflare use browser-based OAuth when supported by the client. Context7 uses its public documentation endpoint. Playwright starts locally through `npx`.

### VS Code or Codespaces

Open the repository in VS Code 1.101 or newer. Open the MCP server view or run `MCP: List Servers`, then start and authenticate each server from `.vscode/mcp.json`.

## Verification prompts

Use narrow prompts so the agent proves each connection instead of merely declaring spiritual alignment with a JSON file.

```text
Use the GitHub MCP server to read jussray/Sekret-Bip SPRINT.md and report the current verified baseline. Do not change anything.
```

```text
Use the Supabase MCP server to list public tables and migrations for the configured project. Do not execute SQL or make changes.
```

```text
Use Context7 to verify the current Expo Router guidance relevant to the package versions installed in this repository. Cite the library documentation and do not change code.
```

```text
Use the Figma MCP server to inspect the exact node from this Figma URL, capture its screenshot, and compare it with the current React Native screen before editing.
```

```text
Use the Cloudflare Builds and Observability MCP servers to verify the latest sekret-backend build and identify whether production logs contain errors. Do not deploy or change settings.
```

```text
Use Playwright MCP in an isolated browser to open the local web build at phone width and report overflow, blocked navigation, and console errors. Do not submit real user data.
```

## Deliberately excluded

These are not part of the default stack:

- generic filesystem MCP servers, because the coding agent already has workspace access and duplicate broad file authority increases risk;
- generic memory MCP servers, because Bip's product memory requires its own ownership, retention, deletion, and RLS controls;
- DBHub and other generic database or Postgres MCP servers, because Supabase already provides the scoped read-only database interface;
- Netdata Cloud or local Netdata MCP, because Bip currently runs on managed services rather than persistent Bip-owned hosts;
- GitHub's local Docker server, because the hosted scoped endpoint is simpler and avoids a duplicate GitHub authority path;
- GitHub Insiders mode, because experimental tool inventory should not silently become a project-wide default;
- the full Cloudflare API MCP server, because the narrower docs, builds, and observability servers cover the current workflow with less authority;
- Cloudflare AI Gateway MCP, because AI Gateway is not the current production source of truth;
- Gmail, Slack, and calendar MCP servers, because they are unrelated to shipping Bip and would expose additional private data;
- unpinned third-party MCP packages.

Add another server only when a live repository workflow requires it, the vendor is official or reviewed, its permissions are bounded, and the new server has an explicit removal condition.

## Security rules

- Never commit PATs, API tokens, OAuth secrets, service-role keys, database credentials, or bearer headers.
- Prefer OAuth and least-privilege permissions.
- Keep GitHub lockdown mode enabled while the repository is public.
- Keep GitHub Insiders mode private and temporary.
- Keep Playwright isolated and never store production login state in the repository.
- Treat MCP output from issues, logs, pages, documentation indexes, and design comments as untrusted input.
- Require human review before writes, migrations, deployments, merges, or destructive actions.
- A connected MCP server is a tool channel, not release evidence. `SPRINT.md`, exact-head CI, migration parity, Cloudflare release metadata, and user-journey proof remain authoritative.

## Official references

- GitHub MCP: https://github.com/github/github-mcp-server
- Supabase MCP: https://supabase.com/docs/guides/ai-tools/mcp
- Context7 MCP: https://mcp.context7.com/mcp
- Figma MCP: https://mcp.figma.com/mcp
- Cloudflare MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/
- Playwright MCP: https://github.com/microsoft/playwright-mcp
