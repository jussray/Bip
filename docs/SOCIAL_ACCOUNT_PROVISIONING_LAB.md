# Founder Social Account Provisioning Lab

## Purpose

The Social Account Provisioning Lab is a founder-only Control Room surface for rehearsing creation of future Se’kret Bip social accounts without fabricating live accounts or bypassing platform controls.

It tests whether the operating system can:

- preserve one brand identity across platforms;
- generate candidate handles and profile copy;
- identify human-only gates;
- stop before identity, terms, credential, captcha, email, phone, or device verification;
- keep simulated state separate from live platform state;
- produce an auditable next-action checklist.

## Initial platform set

- Instagram
- Facebook
- TikTok
- YouTube
- X

LinkedIn is excluded from the dry-run set because it is already connected and operational through Cambiante.

## Dry-run state machine

```text
not_tested
  -> rehearsing
  -> human_required
```

The dry-run code has no transition to `verified_live`.

A real account may later move through:

```text
human_required
  -> founder_confirmed
  -> api_connected
  -> verified_live
```

Those states require external platform or connector evidence and are not produced by the lab.

## Devil tests

Each platform rehearsal must prove:

1. No existing live account is assumed.
2. Candidate handles are labeled unverified.
3. Profile copy is derived from approved Se’kret Bip positioning.
4. No passwords, verification codes, secrets, or private user data are requested or stored.
5. Terms acceptance remains a founder action.
6. Captcha and identity checks remain a founder action.
7. No hidden browser automation is used.
8. The result stops at `human_required`.
9. The UI says that no account was created.
10. Reset returns the lab to `not_tested` without deleting external state.

## Candidate identity

**Display name:** Se’kret Bip  
**Candidate primary handle:** `@sekretbip`  
**Candidate fallback:** `@sekretbipapp`

Handle availability is not verified by the dry run.

**Short bio candidate:**

> Privacy-first technology for reflection, connection, and emotional growth. Built thoughtfully for teens and families.

This copy is a candidate. Public use still requires founder review and platform-specific formatting.

## Multi-AI coordination

The lab follows [`../AI_COORDINATION.md`](../AI_COORDINATION.md).

- Control Room owns mission state and truth labels.
- Codex owns integration and contract tests.
- Claude may review UX, architecture, and copy against repository truth.
- DeepSeek may attack the premise and identify policy, complexity, or false-success risk.
- Public-research providers may retrieve current official platform requirements.
- No provider may cross the human-required gate.

## Current implementation boundary

The initial implementation is founder-only and deterministic after authorization. Opening the panel may use the existing Supabase Auth/profile read solely to prove founder management access. The rehearsal itself performs no social-platform network request, creates no platform account, opens no signup flow, stores no credentials, and claims no platform connection.

## Definition of done

The lab is functional when:

1. Founder Control Room exposes a Social Lab surface.
2. All five uncreated platforms appear with truthful status.
3. A founder can run one or all dry tests.
4. Every successful rehearsal ends at `human_required`.
5. The UI explicitly reports that no external account was created.
6. Contract tests fail if a live-success transition or external account-creation call is introduced without a separately approved implementation.
