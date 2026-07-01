import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredPaths = [
  'app/_layout.tsx',
  'src/services/index.ts',
  'src/services/runtimeAudit.ts',
  'src/services/controlRoomIssues.ts',
  'src/services/issueNormalizer.ts',
  'supabase/migrations',
];

const findings = requiredPaths
  .filter((relativePath) => !fs.existsSync(path.join(root, relativePath)))
  .map((relativePath) => ({
    source: 'structural_scan',
    severity: 'error',
    event_type: 'structural_required_path_missing',
    screen: relativePath,
    message: `Required path is missing: ${relativePath}`,
    metadata: { relativePath },
  }));

const supabaseCandidates = ['src/utils/supabase.ts', 'utils/supabase'];
if (!supabaseCandidates.some((relativePath) => fs.existsSync(path.join(root, relativePath)))) {
  findings.push({
    source: 'structural_scan',
    severity: 'error',
    event_type: 'structural_supabase_module_missing',
    screen: 'supabase-client',
    message: 'No supported Supabase client module path was found.',
    metadata: { candidates: supabaseCandidates },
  });
}

const result = {
  scanner: 'control-room-structural-scan',
  scanned_at: new Date().toISOString(),
  ok: findings.length === 0,
  finding_count: findings.length,
  findings,
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
