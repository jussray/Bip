# Main contract drift repair evidence

## Source

The complete unit suite on the password-recovery lane exposed three pre-existing stale contracts on `main`.

## Focused repair

- production Worker inventory now matches `worker/voice-entry.ts`;
- Worker wrapper delegation is asserted;
- the well-known production release marker is asserted;
- the explicit production deploy alias is asserted;
- an exact-head workflow retains focused, full-suite, and TypeScript evidence.

## Separation

Password-recovery continuity remains isolated in PR #690. This lane contains no auth-screen changes and performs no deployment or production mutation.
