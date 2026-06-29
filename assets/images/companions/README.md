# Companion asset migration

This folder is the new home for production companion sprites.

Current scope:

- `raylene/` — new full-body companion assets
- `night/` — new full-body companion assets
- `rylane/` — new full-body companion assets
- Cloud remains on the existing asset system for now and is intentionally not migrated in this pass.

Migration rules:

1. Add and verify replacement assets before removing legacy files.
2. Keep existing room backgrounds and scene composites.
3. Update image registries and screen references before deleting old sprites.
4. Archive legacy Raylene, Night, and Rylane assets only after the app type-checks and exports successfully.
