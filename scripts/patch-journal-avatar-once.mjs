import fs from 'node:fs';

const routePath = 'app/(teen)/pages/index.tsx';
let source = fs.readFileSync(routePath, 'utf8');

const replacements = [
  [
    "  const aiCompanion = isAiTab(activeTab);\n  const companionAvatarId: SekretCharacterId = aiCompanion ? activeTab : 'raylene';",
    "  const aiCompanion = isAiTab(activeTab);\n  const companionAvatarId: AiCompanionId | null = aiCompanion ? activeTab : null;",
  ],
  [
    "  function chooseTab(id: CompanionId) {\n    setActiveTab(id);\n    if (isAiTab(id)) {\n      setSelectedSekret(id);\n      setAvatarState('listening');\n    }\n  }",
    "  function chooseTab(id: CompanionId) {\n    setActiveTab(id);\n    setAvatarState(isAiTab(id) ? 'listening' : 'neutral');\n    if (isAiTab(id)) {\n      setSelectedSekret(id);\n    }\n  }",
  ],
  [
    "    if (!replyText || voiceLoading) return;",
    "    if (!replyText || voiceLoading || !companionAvatarId) return;",
  ],
  [
    "            <Image\n              source={avatarImage(companionAvatarId, (entry.sekretAvatarState ?? 'neutral') as SekretAvatarState)}\n              style={s.replyAvatar}\n            />",
    "            {companionAvatarId ? (\n              <Image\n                source={avatarImage(companionAvatarId, (entry.sekretAvatarState ?? 'neutral') as SekretAvatarState)}\n                style={s.replyAvatar}\n              />\n            ) : null}",
  ],
  [
    "    saving ? (\n      <View style={s.typingRow}>\n        <Image source={avatarImage(companionAvatarId, 'thinking')} style={s.typingAvatar} />",
    "    saving && companionAvatarId ? (\n      <View style={s.typingRow}>\n        <Image source={avatarImage(companionAvatarId, 'thinking')} style={s.typingAvatar} />",
  ],
  [
    "            <Animated.Image\n              source={avatarImage(companionAvatarId, avatarState)}\n              style={[s.headerAvatar, { transform: [{ scale: breathe }] }]}\n              resizeMode=\"contain\"\n            />",
    "            {companionAvatarId ? (\n              <Animated.Image\n                source={avatarImage(companionAvatarId, avatarState)}\n                style={[s.headerAvatar, { transform: [{ scale: breathe }] }]}\n                resizeMode=\"contain\"\n              />\n            ) : (\n              <Text style={s.headerModeIcon}>{activeTab === 'me' ? '🪞' : '🔮'}</Text>\n            )}",
  ],
  [
    "              onFocus={() => setAvatarState('listening')}",
    "              onFocus={() => setAvatarState(aiCompanion ? 'listening' : 'neutral')}",
  ],
  [
    "  headerAvatar: { width: 54, height: 54 },",
    "  headerAvatar: { width: 54, height: 54 },\n  headerModeIcon: { width: 54, textAlign: 'center', fontSize: 34 },",
  ],
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) {
    throw new Error(`Journal avatar patch target not found: ${before.slice(0, 80)}`);
  }
  source = source.replace(before, after);
}

fs.writeFileSync(routePath, source);

const test = `import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../app/(teen)/pages/index.tsx', import.meta.url), 'utf8');

test('Me and Oracle never fall back to Raylene portraits', () => {
  assert.equal(source.includes("companionAvatarId: AiCompanionId | null"), true);
  assert.equal(source.includes("aiCompanion ? activeTab : null"), true);
  assert.equal(source.includes("activeTab === 'me' ? '🪞' : '🔮'"), true);
});

test('journal avatar state resets when changing tabs', () => {
  assert.equal(source.includes("setAvatarState(isAiTab(id) ? 'listening' : 'neutral')"), true);
  assert.equal(source.includes("onFocus={() => setAvatarState(aiCompanion ? 'listening' : 'neutral')}"), true);
});

test('protected journal paths remain intact', () => {
  for (const contract of ['sendCompanionMessage', 'fetchSekretVoice', 'checkTextBeforePost', 'patchJournalEntry', 'syncJournal']) {
    assert.equal(source.includes(contract), true);
  }
});
`;
fs.writeFileSync('test/journal-avatar-presentation.test.mjs', test);

fs.rmSync('scripts/patch-journal-avatar-once.mjs');
fs.rmSync('.github/workflows/patch-journal-avatar-once.yml');
