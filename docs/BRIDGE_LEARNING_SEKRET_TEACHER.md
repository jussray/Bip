# Bridge Learning — Se'kret Teacher Architecture

## Product truth

Bridge Learning is a consent-controlled shared learning space for one active linked teen and parent. Private Study Buddy activity remains private. Shared learning begins only through an accepted Bridge invitation or an already shared Bridge session.

The operating model is:

```text
Oracle = hidden research, reasoning, verification, misconception detection, and teaching-plan engine
Se'kret = visible teacher, translator, relationship protector, and soul of the learning experience
Companions = optional learning-support styles
Bridge = the permission boundary and shared classroom
```

## Non-negotiable teaching law

Se'kret starts with the clearest explanation likely to land. Internally the system may use ELI5- and ELI10-style strategies, but those labels are never shown to users and are never stored as age, intelligence, grade, or ability judgments.

Visible actions use respectful language:

- Explain that another way
- Break it down more
- Show me an example
- Why does that work?
- I understand — next step
- Let me try
- Teach us together

Se'kret assumes the explanation has not found the right doorway yet. She does not assume the learner is slow.

## Shared stumped loop

```text
Teen gets stuck
→ may request a hint
→ may ping the parent
→ may invite Se'kret

Parent gets stuck
→ may ping the teen
→ may invite Se'kret

Both are stuck
→ either participant may select Teach us together
→ Se'kret enters as teacher
```

Se'kret may suggest a ping, but she may never send one without the sender confirming it.

Lock-screen notification copy must not expose the subject, question, grade, answer, mistake, source document, or private-study history.

## Teaching sequence

1. Identify the exact missing concept.
2. Give one plain explanation.
3. Change the teaching strategy if it does not land; do not merely shorten the same wording.
4. Show one worked example.
5. Give the teen a turn.
6. Give the parent a turn when both are present.
7. Ask for a small teach-back.
8. Introduce formal school terminology only after the concept is understood.
9. Save only the shared-session recap allowed by the session policy.

## Oracle requirements

Oracle must be broad, culturally literate, source-grounded, and honest about uncertainty. It must be able to:

- reason across school subjects;
- retrieve and cite approved sources;
- detect misconceptions;
- produce multiple explanation strategies;
- distinguish verified fact from interpretation;
- understand dialect without treating dialect as lower ability;
- avoid cultural stereotypes;
- adapt examples without forcing slang or identity assumptions;
- abstain and recommend outside help when confidence is insufficient.

Oracle does not speak to the user. It returns a structured teaching packet. Se'kret turns that packet into a humane lesson.

## Privacy boundary

Bridge Learning may read only:

- the active `parent_links` relationship required for authorization;
- content created inside the shared Bridge Learning session;
- sources explicitly attached to that shared session;
- approved curriculum/reference material needed for the lesson.

Bridge Learning may not read automatically:

- private Study Buddy conversations;
- private wrong answers or practice history;
- journals or emotional companion chats;
- unshared uploads;
- Circle content;
- hidden emotional-memory records;
- report cards or school identifiers.

Revoking the parent link or the session ends ordinary shared access immediately.

## Release gates

The feature remains `internal` until all of the following pass:

- versioned Supabase migration;
- RLS tests for teen, linked parent, unlinked parent, stranger, revoked link, and service role;
- Worker authentication and active-link checks;
- source-grounding and answer-shape validation;
- uncertainty and outside-help behavior;
- lock-screen notification privacy tests;
- teen and parent route tests;
- no private-study or journal access paths;
- accessibility and screen-reader checks;
- Playwright coverage for invite, ping, both-stumped, teach-back, revoke, and expiry flows;
- founder review before merge;
- separate founder approval before deployment.

## Implementation slices

1. Contracts, feature flag, threat boundary, and pure state machine.
2. Schema, RPCs, RLS, retention, revocation, and tests.
3. Teen and parent Bridge UI with invitations and pings.
4. Oracle teaching endpoint, grounding, verification, and Se'kret rendering.
5. Notifications, shared recaps, accessibility, and offline/error states.
6. Full CI, Playwright, cost controls, red-team review, and staged rollout.
