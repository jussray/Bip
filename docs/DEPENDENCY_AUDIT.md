# Dependency Audit — policy and enforcement

This is the live policy doc. For the historical branch-by-branch audit that
established these pins, see [`DEPENDENCY_AUDIT.md`](../DEPENDENCY_AUDIT.md)
at the repo root.

## Policy

- The repo targets **Expo SDK 51** (`expo ~51.0.28`). Any `expo` or `expo-*`
  range that implies a different SDK major is a bug, not a feature — fix the
  version instead of installing it.
- `react-native`, `react-native-gesture-handler`,
  `react-native-safe-area-context`, `react-native-screens`, and
  `babel-preset-expo` must stay on the versions `expo install` resolves for
  SDK 51. Don't hand-bump these independently.
- Run `npx expo install --check` after any dependency change and resolve
  every mismatch it reports before committing.
- New dependencies are added with `npx expo install <package>` when an Expo
  module exists for it, and `npm install --legacy-peer-deps <package>`
  otherwise. The `--legacy-peer-deps` flag is required for every install in
  this repo — see [`CODESPACES.md`](./CODESPACES.md).

## Enforcement

These rules are backed by commands, not just review:

```bash
npm run type-check   # tsc --noEmit — catches type-level breakage from a bad bump
npm run lint          # eslint . — catches import/usage breakage
npm run verify:bundle  # expo export --platform web --clear — catches resolution/version conflicts that only show up at bundle time
```

All three (plus the asset checks below) run together via:

```bash
npm run verify:prepush
```

Run `verify:prepush` before every push. If it fails, the dependency change
is not safe to ship — fix the pin, don't bypass the script.
