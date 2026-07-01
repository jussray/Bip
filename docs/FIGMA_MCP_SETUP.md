# Se'kret Bip — Official Figma MCP Setup

This setup lets an MCP-capable coding agent read a Se'kret Bip Figma frame while working inside the `jussray/Bip` repository.

## Architecture

```text
Figma file
  -> official Figma MCP server
  -> coding agent / IDE
  -> Bip React Native repository
```

Figma remains the visual and handoff workspace. GitHub remains the production source of truth for code and assets.

## Security

The official remote MCP uses Figma authentication through the client connection. Do not place a Figma personal access token in this repository, `.env`, Expo config, or source code.

Any Figma token that was pasted into chat or shared publicly should be revoked.

## Repository template

The repository includes `.mcp.example.json`:

```json
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp"
    }
  }
}
```

Copy the server entry into the private MCP configuration used by your supported client.

## Supported setup paths

### VS Code

1. Enable GitHub Copilot.
2. Open the Command Palette.
3. Run `MCP: Add Server`.
4. Choose `HTTP`.
5. Enter `https://mcp.figma.com/mcp`.
6. Use `figma` as the server ID.
7. Authenticate with Figma when prompted.
8. Open Copilot Chat in Agent mode and confirm the Figma tools are available.

### Cursor

In Cursor Agent chat, run:

```text
/add-plugin figma
```

Or add the official remote endpoint manually in Cursor MCP settings.

### Claude Code

```bash
claude plugin install figma@claude-plugins-official
```

Manual alternative:

```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

### Gemini CLI

```bash
gemini extensions install https://github.com/figma/mcp-server-guide
```

Then authenticate inside Gemini CLI:

```text
/mcp auth figma
```

## Use it with Bip

1. Open the local Bip repository in the MCP-capable coding client.
2. Open the target frame in Figma.
3. Copy the Figma frame URL, including its `node-id`.
4. Paste the URL into the coding-agent prompt.
5. Ask the agent to inspect the frame and implement it using existing Bip assets and components.

Recommended prompt:

```text
Use the linked Figma frame as the visual source and the current Bip repository as the implementation source.

Required flow:
1. Get design context for the exact Figma node.
2. Get the Figma screenshot for visual verification.
3. Get variable definitions when the frame uses Figma variables.
4. Inspect the existing Bip screen, shared components, routes, and image mappings before editing.
5. Implement the frame in React Native and Expo.
6. Validate the result against the Figma screenshot.

Rules:
- Reuse existing assets from assets/images.
- Keep production asset filenames unchanged.
- Reuse existing navigation, state management, and shared components.
- Translate generated web or Tailwind context into React Native StyleSheet conventions.
- Match layout, spacing, overlays, typography, and component states from Figma.
- Preserve teen and parent privacy boundaries.
- Do not replace working backend logic.
- Report files changed and any design detail that could not be represented exactly.
```

## Figma file rules for better output

- Use components for repeated UI.
- Use variables for color, spacing, radius, and typography.
- Use Auto Layout to express responsive intent.
- Name layers semantically.
- Keep repo image filenames as Figma layer names.
- Add annotations for privacy rules, navigation, state, and interaction behavior.

## What this connection does

It lets the coding agent combine:

- Figma frame structure and styling
- Figma variables and components
- Existing Bip React Native code
- Existing production image assets
- Route, state, and component context

## What it does not do

It does not automatically:

- synchronize every GitHub asset into Figma
- replace the workspace-building plugin
- make Figma the production source of truth
- publish code without review

Repo images must still be placed into Figma manually or through the local Bip Figma workspace plugin.
