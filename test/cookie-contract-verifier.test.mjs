import assert from 'node:assert/strict';
import test from 'node:test';

import { hasCookieUse } from '../scripts/verify-cookie-contract.mjs';

test('cookie contract detects reads and alternate browser/server writers', () => {
  const forbidden = [
    'const value = document.cookie;',
    'document.cookie = "session=abc";',
    'await cookieStore.get("session");',
    'await cookieStore.set("session", "abc");',
    'response.headers.set("Set-Cookie", value);',
    'response.headers.append("set-cookie", value);',
    'res.setHeader("Set-Cookie", value);',
    'setCookie("session", value);',
  ];

  for (const source of forbidden) {
    assert.equal(hasCookieUse(source), true, `expected forbidden cookie use: ${source}`);
  }
});

test('cookie contract does not flag unrelated storage and header code', () => {
  const allowed = [
    'await SecureStore.setItemAsync("session", value);',
    'await AsyncStorage.getItem("session");',
    'response.headers.set("Cache-Control", "no-store");',
  ];

  for (const source of allowed) {
    assert.equal(hasCookieUse(source), false, `unexpected cookie match: ${source}`);
  }
});
