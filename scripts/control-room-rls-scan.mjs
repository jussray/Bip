import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const findings = [];

if (!fs.existsSync(migrationsDir)) {
  findings.push({
    source: 'rls_scan',
    severity: 'critical',
    event_type: 'rls_migrations_missing',
    screen: 'supabase/migrations',
    message: 'Supabase migrations directory is missing.',
    metadata: {},
  });
} else {
  const sql = fs.readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => fs.readFileSync(path.join(migrationsDir, name), 'utf8'))
    .join('\n');

  const tableRegex = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
  const tables = new Set();
  let match;
  while ((match = tableRegex.exec(sql))) tables.add(match[1]);

  for (const table of tables) {
    const enablePattern = new RegExp(`alter\\s+table\\s+(?:public\\.)?${table}\\s+enable\\s+row\\s+level\\s+security`, 'i');
    const policyPattern = new RegExp(`create\\s+policy[\\s\\S]*?on\\s+(?:public\\.)?${table}\\b`, 'i');

    if (!enablePattern.test(sql)) {
      findings.push({
        source: 'rls_scan',
        severity: 'error',
        event_type: 'rls_not_enabled',
        screen: table,
        message: `Row-level security is not enabled for ${table}.`,
        metadata: { table },
      });
    } else if (!policyPattern.test(sql)) {
      findings.push({
        source: 'rls_scan',
        severity: 'warning',
        event_type: 'rls_policy_missing',
        screen: table,
        message: `No RLS policy was found for ${table}.`,
        metadata: { table },
      });
    }
  }
}

const result = {
  scanner: 'control-room-rls-scan',
  scanned_at: new Date().toISOString(),
  ok: findings.every((item) => !['critical', 'error'].includes(item.severity)),
  finding_count: findings.length,
  findings,
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
