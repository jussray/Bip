# Bip — Dependency Health Audit

**Repo:** [jussray/Bip](https://github.com/jussray/Bip)  
**Branches compared:** 5  
**Generated:** 2026-06-08

## 🚨 Top-level findings

1. **`main` has unresolved Git conflict markers in `package.json`** (`<<<<<<< Updated upstream` / `>>>>>>> Stashed changes`). The file is currently invalid JSON and `npm install` on main will fail. Both sides are listed below as `main (ours)` and `main (theirs)`.
2. **5 MAJOR-version mismatches** across branches — these will all become merge conflicts and runtime breakage if merged as-is.
3. **Expo SDK target disagreement:** `main (ours)` claims `expo ^56.0.8` while every other branch (and the rest of main's deps) align with **Expo SDK 51**. Expo SDK 56 does not exist on the stable channel — this is almost certainly a typo for `^51` that triggered the stash. The master `package.json` standardises on **Expo SDK 51.0.28**.
4. The `restructure/organize-project` and `codespace` branches are slim subsets — they do not introduce conflicts on their own, but they will lose the supabase/router/secure-store deps unless re-merged from main.

## Severity summary

| Status | Count |
|---|---|
| 🔴 MAJOR-MISMATCH | 5 |
| 🟠 minor-mismatch | 3 |
| 🟡 patch/range-mismatch | 6 |
| ⚪ only-in-one | 8 |
| ✅ consistent | 7 |

_See full matrix and recommended merge sequence in the original audit file._
