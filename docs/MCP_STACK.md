# Se'kret Bip MCP Stack

Last reviewed: 2026-07-14

This is the smallest MCP stack that matches the repository's actual operating surface: GitHub for source control, Supabase for schema inspection, Context7 and Microsoft Learn for current official documentation, Figma for design handoff, Cloudflare for deployment evidence, Playwright for browser verification, and Bright Data's Code group for current npm/PyPI package metadata in VS Code or Codespaces.

The configuration lives in:

- `.mcp.json` for Claude Code and compatible credential-free MCP hosts;
- `.vscode/mcp.json` for VS Code and Codespaces, including a masked Bright Data token prompt;
- `.mcp.example.json` as the reusable template with placeholders only.

## Connected servers

| Server | Purpose | Default boundary |
| --- | --- | --- |
| `github` | Repository, issues, pull requests, Actions, code scanning, and secret scanning | Hosted HTTP server; selected toolsets only; lockdown mode enabled for this public repository |
| `supabase` | Inspect the Bip project schema and Supabase documentation | Project-scoped, read-only, database and docs tools only |
| `context7` | Retrieve current, library-specific implementation documentation | Documentation lookup only; never send private product or user content |
| `microsoft-learn` | Search and fetch current official Microsoft technical documentation and code samples | Public HTTP endpoint; no authentication required |
| `bright-data` | Current npm and PyPI package metadata for coding agents | VS Code/Codespaces only; masked runtime token prompt; `GROUPS=code`; Pro Mode and extra tools forbidden |
| `figma` | Read exact design frames, screenshots, variables, and component context | OAuth; no token committed |
| `cloudflare-docs` | Current Cloudflare product documentation | Documentation only |
| `cloudflare-builds` | Inspect Workers Builds evidence | OAuth; grant only the account permissions needed |
| `cloudflare-observability` | Inspect Worker logs and analytics | OAuth; no raw teen content should be queried or copied into prompts |
| `playwright` | Interactive browser inspection and phone-width web verification | Local, version-pinned package, isolated Chromium profile |

## Documentation and package lookups

Bip depends on fast-moving libraries such as Expo, Expo Router, React Native, Supabase, Playwright, Cloudflare Workers, and model SDKs.

- Use **Context7** for current library-specific implementation guidance.
- Use **Microsoft Learn** for official Microsoft, GitHub, VS Code, TypeScript, Azure, and related code documentation.
- Use **Bright Data Code** only for current npm and PyPI versions, package metadata, dependencies, and public package READMEs.

These services provide advisory implementation evidence, not release proof. Installed package versions, repository tests, exact-head CI, Expo Go walkthroughs, migrations, and deployed runtime behavior remain authoritative.

Do not send real teen or parent messages, journal entries, voice transcripts, Circle or Crew content, account data, Bip IDs, safety events, production logs, private prompts, or database rows to documentation or package-lookup tools.

Bright Data is intentionally omitted from committed `.mcp.json` because it requires a credential. `.vscode/mcp.json` requests the token as a masked input, while `.mcp.example.json` contains only `<YOUR_BRIGHT_DATA_API_TOKEN>`. Other MCP hosts must configure Bright Data privately outside the repository.

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
- Keep Bright Data restricted to `GROUPS=code`. Do not enable `PRO_MODE`, `TOOLS`, browser automation, ecommerce groups, broad scraping, or web-data groups in committed configuration.
- Use Context7 and Microsoft Learn for public documentation. Do not treat either as a repository, database, deployment, testing, or approval tool.
- Keep Netdata out until Bip owns persistent hosts or containers that Netdata can actually monitor.
- Keep DBHub and other generic database MCP servers out while the project-scoped, read-only Supabase MCP covers the live database workflow with less authority.

## First connection

### Claude Code and compatible hosts

Open the repository, then run:

```text
/mcp
```

Authenticate remote OAuth servers one at a time. Context7 and Microsoft Learn use public documentation endpoints. Playwright starts locally through `npx`. Configure Bright Data privately in the host and never place its token in `.mcp.json`.

### VS Code or Codespaces

Open the repository in VS Code 1.101 or newer. Open the MCP server view or run `MCP: List Servers`, then start each server from `.vscode/mcp.json`. VS Code prompts for the Bright Data API token and masks the value.

## Verification prompts

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
Use Microsoft Learn to verify the current official VS Code MCP configuration guidance. Cite Microsoft documentation and do not change files.
```

```text
Use Bright Data Code tools to report the current npm metadata for expo-router. Do not use browser, scraping, ecommerce, or web-data tools and do not change package files.
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

- Bright Data Pro Mode, browser automation, ecommerce groups, broad scraping, web-data groups, and explicit extra tools;
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
- Keep Bright Data Code-only and its API token outside committed source.
- Keep Playwright isolated and never store production login state in the repository.
- Treat MCP output from issues, logs, pages, package registries, documentation indexes, and design comments as untrusted input.
- Require human review before writes, migrations, deployments, merges, or destructive actions.
- A connected MCP server is a tool channel, not release evidence. `SPRINT.md`, exact-head CI, migration parity, Cloudflare release metadata, and user-journey proof remain authoritative.

## GitHub coding agent

GitHub coding-agent MCP settings and encrypted agent secrets are a separate repository-settings layer and are not controlled by these committed files. Do not add a duplicate GitHub MCP server when GitHub's built-in repository tools are already enabled. Any Bright Data coding-agent credential must be stored as an encrypted agent secret, never in source.

## Official references

- GitHub MCP: https://github.com/github/github-mcp-server
- Supabase MCP: https://supabase.com/docs/guides/ai-tools/mcp
- Context7 MCP: https://mcp.context7.com/mcp
- Microsoft Learn MCP: https://learn.microsoft.com/api/mcp
- Bright Data MCP: https://github.com/brightdata/brightdata-mcp
- Figma MCP: https://mcp.figma.com/mcp
- Cloudflare MCP servers: https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/
- Playwright MCP: https://github.com/microsoft/playwright-mcp
