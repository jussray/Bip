# Repo Hygiene — History Cleanup Runbook

> Run this **once** after the audit PR merges to shrink git history and remove
> binary blobs that no longer need to be tracked.

## Why

`assets/images/` contains 23 UUID-named PNGs that are exact byte-for-byte
duplicates of the canonical `bg-*` named files (confirmed via matching git blob
SHAs). The `assets/images/archive/` subtree duplicates the full named set again.
Combined with `figma/` and `design-references/` directories these add ~65 MB of
binary weight to the repository history on every fresh clone.

## Prerequisites

```bash
npm install -g bfg-repo-cleaner  # or: brew install bfg
java -version                    # BFG requires JRE 8+
```

## Step 1 — Create a fresh bare clone (work on a backup)

```bash
git clone --mirror git@github.com:jussray/Bip.git Bip-mirror
cd Bip-mirror
```

## Step 2 — Delete UUID-named PNG files from all history

The UUIDs are exactly 36-character uppercase hex strings. Pass them explicitly
to avoid touching `bg-*` working files:

```bash
bfg --delete-files '{0E3D4BD6-E079-435A-9557-B02E7024656E,110F5AE4-04DD-40A5-B840-46D174A64DE1,1966FBC2-50B0-426B-B16C-9B9C860F98DB,284231DD-7319-4872-AB67-0811F42132F4,2A27D30A-F5F2-4853-BFB5-100BAC56A34C,4BB4A7DF-3B8C-4170-91B4-62FB2F404F68,5397B783-61B8-47A4-8A46-98C418B0AEF1,5886DDCD-4B72-4B62-BE54-E06E521E77AD,68238EB5-14B3-4B30-B45F-0F7006410B43,6AEA1FF8-29D1-4BFF-8AD6-ADB0D1A4F256,6F71DD53-E869-4C34-B485-97792510119F,7814EE18-ECA9-4C7E-8F6A-959085A0BD20,80B326EB-C67B-4369-A3EE-CFE0348E0701,A17B276E-AA39-40D2-B989-FBCCA739B6A3,A2EB8B5A-0109-4A02-927A-FA7080B5F501,ACC1D780-D22F-4CED-8CC1-3B0868C3F4E1,AD015F7B-2956-430D-8CBA-97382DAE39CB,AFA90A45-003E-4AF4-825A-D8C1C02CC275,B15B0EDD-FA1F-40EC-9BB8-0CB916FDBEDB,B8350F20-D4AB-4256-B4F0-EDA698B28130,E250BCEA-A80A-4D90-A382-1FDE4C714702,E3425210-2334-47E9-B8DB-F19AEAB5E607,E88CD2C7-C930-4632-9B33-27463A71DDB9,EFF1CA3D-E615-48E0-8D70-4A0A68AAFB8A,F952C378-5A26-4287-8CDE-60C5059FA7E9}.png'
```

## Step 3 — Delete archive/ and design directories from all history

```bash
bfg --delete-folders '{figma,design-references,archive}'
```

## Step 4 — Expire and garbage collect

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## Step 5 — Force-push the cleaned mirror

> ⚠️ This rewrites history. All collaborators must re-clone or run
> `git fetch --all && git reset --hard origin/main` afterwards.

```bash
git push --force
```

## Step 6 — Re-clone locally and verify

```bash
cd ..
rm -rf Bip-local
git clone git@github.com:jussray/Bip.git Bip-local
cd Bip-local
du -sh .git   # should be dramatically smaller
```

## Post-cleanup: npm dedupe

After merging PR #231 (SDK 56 prebuild fix), regenerate the lockfile cleanly:

```bash
npm install
npm dedupe
git add package-lock.json
git commit -m "chore: dedupe lockfile post SDK 56 alignment"
```

## What is NOT touched

- `assets/images/bg-*.png` — canonical named working files, kept in place
- `assets/images/.gitkeep` — kept
- All source code, Supabase migrations, Worker code, app routes
- `wrangler.toml` — clean, no secrets present (SUPABASE_URL is non-sensitive project URL; API keys live in `.dev.vars`)
