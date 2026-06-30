# Se'kret Bip — Figma Context MCP Setup

This setup lets an MCP-capable coding agent read a Se'kret Bip Figma frame while working inside the `jussray/Bip` repository.

## Architecture

```text
Figma file
  -> Figma Context MCP
  -> coding agent / IDE
  -> Bip React Native repository
```

Figma remains the visual and handoff workspace. GitHub remains the production source of truth for code and assets.

## Security first

- Revoke any Figma token that has been pasted into chat, committed, or shared publicly.
- Create a new Figma personal access token.
- Never commit the real token.
- Never prefix the token with `EXPO_PUBLIC_`.
- Keep it in your local environment or your MCP client's private configuration.

## Repository template

The repository includes `.mcp.example.json`:

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "${FIGMA_API_KEY}"
      }
    }
  }
}
```

Copy the contents into the MCP configuration used by Cursor, Claude Code, VS Code, or another MCP-capable client. Do not rename `.mcp.example.json` and commit a real token into it.

## Set the token locally

### macOS or Linux

```bash
export FIGMA_API_KEY="your-new-figma-token"
```

### Windows PowerShell

```powershell
$env:FIGMA_API_KEY="your-new-figma-token"
```

The environment variable exists only in that terminal session unless you add it to your private system environment.

## Start the MCP server manually for a connection test

```bash
npx -y figma-developer-mcp --stdio
```

Normally the coding client starts this command automatically from its MCP configuration.

## Use it with Bip

1. Open the local Bip repository in the MCP-capable coding client.
2. Open the target frame in Figma.
3. Copy the Figma frame URL, including its `node-id`.
4. Paste the URL into the coding-agent prompt.
5. Ask the agent to inspect the Figma frame and implement it using existing Bip assets and components.

Recommended prompt:

```text
Use the linked Figma frame as the visual source and the current Bip repository as the implementation source.

Implement this frame in React Native and Expo.

Rules:
- Reuse existing assets from assets/images.
- Keep repo filenames unchanged.
- Reuse existing navigation and shared components.
- Match layout, spacing, overlays, typography, and component states from Figma.
- Preserve teen and parent privacy boundaries.
- Do not replace working backend logic.
- Report the files changed and any design details that could not be represented exactly.
```

## What this connection does

It allows the coding agent to combine:

- Figma frame structure and styling
- Existing Bip React Native code
- Existing production image assets
- Route and component context

## What it does not do

It does not automatically:

- upload GitHub images into Figma
- synchronize every repo asset with Figma
- replace the Figma workspace-building plugin
- publish code without review

Repo images must still be placed into Figma manually or by a separate Figma plugin that has write access.
