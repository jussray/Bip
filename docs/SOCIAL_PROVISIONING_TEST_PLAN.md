# Founder Social Provisioning Lab Test Plan

## Goal

Prove that Founder Control Room can prepare account-creation work for Instagram, Facebook, TikTok, YouTube, and X while refusing to fake a live account or bypass a human-only platform gate.

## Test sequence

1. Open `/dev` with a founder profile that has `can_manage_app = true`.
2. Select the Social tab.
3. Run each platform rehearsal separately.
4. Run the all-platform devil test.
5. Confirm every platform ends at `human_required`.
6. Confirm `LIVE ACCOUNTS CREATED` remains `0`.
7. Confirm the UI states that no password, one-time code, token, secret, or private user content was requested or stored.
8. Confirm no external account, OAuth grant, signup, terms acceptance, or hidden browser action occurred.
9. Reset the lab and confirm every platform returns to `not_tested`.

## Failure conditions

The test fails if any rehearsal:

- reports `live`, `connected`, or `verified`;
- requests credentials or verification codes;
- performs a network request or external navigation;
- creates or modifies a real social account;
- uses teen or parent data;
- skips the founder-only authorization check.
