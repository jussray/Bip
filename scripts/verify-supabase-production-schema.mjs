import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_PROJECT_REF = 'tbsevonvegdnlyjgplmm';
export const DEFAULT_MIGRATIONS_DIR = 'supabase/migrations';
export const DEFAULT_EVIDENCE_PATH = 'artifacts/supabase-production-schema.json';
export const PRODUCTION_HISTORY_AUTHORITY_FLOOR = '20260805170500';
const VERSION_PATTERN = /^\d{14}$/;
const MIGRATION_FILE_PATTERN = /^(\d{14})_(.+)\.sql$/;
const MIGRATION_NAME_TIMESTAMP_PREFIX = /^\d{14}_/;

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export function normalizeSchemaVersion(value) {
  const version = clean(value);
  return VERSION_PATTERN.test(version) ? version : null;
}

export function normalizeMigrationName(value) {
  return clean(value)
    .replace(/\.sql$/i, '')
    .replace(MIGRATION_NAME_TIMESTAMP_PREFIX, '');
}

export async function deriveRepositorySchemaVersion(migrationsDir = DEFAULT_MIGRATIONS_DIR) {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const versions = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name.match(MIGRATION_FILE_PATTERN)?.[1] ?? null)
    .filter(Boolean)
    .sort();

  const version = versions.at(-1) ?? null;
  if (!version) {
    throw new Error(`No canonical 14-digit Supabase migration found in ${migrationsDir}.`);
  }
  return version;
}

export async function deriveRepositoryMigrationIdentities(
  migrationsDir = DEFAULT_MIGRATIONS_DIR,
  authorityFloorVersion = PRODUCTION_HISTORY_AUTHORITY_FLOOR,
) {
  const floor = normalizeSchemaVersion(authorityFloorVersion);
  if (!floor) {
    throw new Error('Supabase production history authority floor must be exactly 14 digits.');
  }

  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const migrations = entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const match = entry.name.match(MIGRATION_FILE_PATTERN);
      if (!match) return null;
      return {
        version: match[1],
        name: normalizeMigrationName(match[2]),
      };
    })
    .filter((migration) => migration && migration.version >= floor)
    .sort((left, right) => left.version.localeCompare(right.version));

  if (!migrations.length) {
    throw new Error(
      `No canonical Supabase migrations found at or after authority floor ${floor} in ${migrationsDir}.`,
    );
  }

  return migrations;
}

export function configFromEnv(env = process.env) {
  return {
    token: clean(env.SUPABASE_ACCESS_TOKEN),
    projectRef: clean(env.SUPABASE_PROJECT_REF) || DEFAULT_PROJECT_REF,
    migrationsDir: clean(env.SUPABASE_MIGRATIONS_DIR) || DEFAULT_MIGRATIONS_DIR,
    evidencePath: clean(env.SUPABASE_SCHEMA_EVIDENCE_PATH) || DEFAULT_EVIDENCE_PATH,
  };
}

export function buildReadOnlyQuery() {
  return `select
  coalesce(max(version), '') as live_max_version,
  coalesce(
    jsonb_agg(
      jsonb_build_object('version', version, 'name', name)
      order by version
    ),
    '[]'::jsonb
  ) as migration_history
from supabase_migrations.schema_migrations;`;
}

export function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

export function evaluateSchemaRow(row, expectedVersion) {
  const expected = normalizeSchemaVersion(expectedVersion);
  if (!expected) throw new Error('Expected Supabase schema version must be exactly 14 digits.');

  const liveMaxVersion = normalizeSchemaVersion(
    row?.live_max_version ?? row?.liveMaxVersion,
  );

  return {
    expectedVersion: expected,
    liveMaxVersion,
    verified: liveMaxVersion === expected,
  };
}

function parseMigrationHistory(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeRepositoryMigrations(repositoryMigrations) {
  if (!Array.isArray(repositoryMigrations) || !repositoryMigrations.length) {
    throw new Error('Repository migration identities are required for production history verification.');
  }

  return repositoryMigrations.map((migration) => {
    const version = normalizeSchemaVersion(migration?.version);
    const name = normalizeMigrationName(migration?.name);
    if (!version || !name) {
      throw new Error('Repository migration identities require a 14-digit version and non-empty name.');
    }
    return { version, name };
  });
}

export function evaluateMigrationHistory(
  row,
  repositoryMigrations,
  authorityFloorVersion = PRODUCTION_HISTORY_AUTHORITY_FLOOR,
) {
  const floor = normalizeSchemaVersion(authorityFloorVersion);
  if (!floor) {
    throw new Error('Supabase production history authority floor must be exactly 14 digits.');
  }

  const requiredMigrations = normalizeRepositoryMigrations(repositoryMigrations)
    .filter((migration) => migration.version >= floor)
    .sort((left, right) => left.version.localeCompare(right.version));
  if (!requiredMigrations.length) {
    throw new Error('No required repository migrations remain inside the production history authority window.');
  }

  const rawHistory = parseMigrationHistory(
    row?.migration_history ?? row?.migrationHistory,
  );
  if (!rawHistory) {
    throw new Error('Supabase production migration history is missing or malformed.');
  }

  const liveHistory = rawHistory.map((migration) => ({
    version: clean(migration?.version),
    name: normalizeMigrationName(migration?.name),
  }));

  const requiredByVersion = new Map(requiredMigrations.map((migration) => [migration.version, migration]));
  const requiredByName = new Map(requiredMigrations.map((migration) => [migration.name, migration]));
  const representedCanonicalVersions = [];
  const acceptedAliasVersions = [];
  const missingCanonicalVersions = [];

  for (const required of requiredMigrations) {
    const matches = liveHistory.filter((live) => (
      live.version === required.version
      || (live.name && live.name === required.name)
    ));
    const canonical = matches.find((live) => live.version === required.version);
    const representative = canonical ?? matches[0] ?? null;

    if (!representative) {
      missingCanonicalVersions.push(required.version);
      continue;
    }

    representedCanonicalVersions.push(required.version);
    if (representative.version !== required.version) {
      acceptedAliasVersions.push({
        canonicalVersion: required.version,
        liveVersion: representative.version || null,
        name: required.name,
      });
    }
  }

  const unexpectedRecentVersions = liveHistory
    .filter((live) => {
      const version = normalizeSchemaVersion(live.version);
      if (!version || version < floor) return false;
      return !requiredByVersion.has(version) && !requiredByName.has(live.name);
    })
    .map((live) => ({
      liveVersion: live.version,
      name: live.name || null,
    }));

  const expectedVersion = requiredMigrations.at(-1).version;
  const liveMaxVersion = normalizeSchemaVersion(
    row?.live_max_version ?? row?.liveMaxVersion,
  ) ?? liveHistory
    .map((migration) => normalizeSchemaVersion(migration.version))
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  return {
    authorityFloorVersion: floor,
    expectedVersion,
    liveMaxVersion,
    requiredCanonicalVersions: requiredMigrations.map((migration) => migration.version),
    representedCanonicalVersions,
    acceptedAliasVersions,
    missingCanonicalVersions,
    unexpectedRecentVersions,
    verified: missingCanonicalVersions.length === 0 && unexpectedRecentVersions.length === 0,
  };
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeEvidence(evidencePath, evidence) {
  await fs.mkdir(path.dirname(evidencePath), { recursive: true });
  await fs.writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
}

function initialEvidence(config) {
  return {
    schemaVersion: 2,
    verified: false,
    status: 'initializing',
    projectRef: config.projectRef || null,
    authorityFloorVersion: PRODUCTION_HISTORY_AUTHORITY_FLOOR,
    expectedVersion: null,
    liveMaxVersion: null,
    requiredCanonicalVersions: [],
    representedCanonicalVersions: [],
    acceptedAliasVersions: [],
    missingCanonicalVersions: [],
    unexpectedRecentVersions: [],
    checkedAt: new Date().toISOString(),
  };
}

async function failWithEvidence(config, evidence, status, errorCode, error) {
  evidence.status = status;
  evidence.error = errorCode;
  evidence.detail = errorMessage(error);
  evidence.checkedAt = new Date().toISOString();
  await writeEvidence(config.evidencePath, evidence);
  throw error;
}

export async function verifySupabaseProductionSchema(options = {}) {
  const config = options.config ?? configFromEnv(options.env);
  const fetchImpl = options.fetchImpl ?? fetch;
  const evidence = initialEvidence(config);

  let expectedVersion;
  let repositoryMigrations;
  try {
    expectedVersion = options.expectedVersion
      ?? await deriveRepositorySchemaVersion(config.migrationsDir);
    expectedVersion = normalizeSchemaVersion(expectedVersion);
    if (!expectedVersion) {
      throw new Error('Expected Supabase schema version must be exactly 14 digits.');
    }
    evidence.expectedVersion = expectedVersion;

    repositoryMigrations = options.repositoryMigrations
      ?? await deriveRepositoryMigrationIdentities(config.migrationsDir);
  } catch (error) {
    await failWithEvidence(
      config,
      evidence,
      'repository-schema-invalid',
      'repository_schema_version_unavailable',
      error,
    );
  }

  if (!config.token) {
    await failWithEvidence(
      config,
      evidence,
      'configuration-invalid',
      'missing_supabase_access_token',
      new Error('SUPABASE_ACCESS_TOKEN is required for production schema verification.'),
    );
  }
  if (!config.projectRef) {
    await failWithEvidence(
      config,
      evidence,
      'configuration-invalid',
      'missing_supabase_project_ref',
      new Error('SUPABASE_PROJECT_REF is required.'),
    );
  }

  const query = buildReadOnlyQuery();
  let response;
  try {
    response = await fetchImpl(
      `https://api.supabase.com/v1/projects/${encodeURIComponent(config.projectRef)}/database/query/read-only`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      },
    );
  } catch (error) {
    await failWithEvidence(
      config,
      evidence,
      'provider-query-failed',
      'management_api_request_failed',
      error,
    );
  }

  let payload;
  try {
    payload = await readJson(response);
  } catch (error) {
    await failWithEvidence(
      config,
      evidence,
      'provider-query-failed',
      'management_api_response_read_failed',
      error,
    );
  }

  if (!response.ok) {
    await failWithEvidence(
      config,
      evidence,
      'provider-query-failed',
      `management_api_http_${response.status}`,
      new Error(`Supabase read-only production schema verification failed with HTTP ${response.status}.`),
    );
  }

  const rows = extractRows(payload);
  const row = rows[0];
  const hasMigrationHistory = parseMigrationHistory(
    row?.migration_history ?? row?.migrationHistory,
  ) !== null;

  if (!hasMigrationHistory) {
    const legacy = evaluateSchemaRow(row, expectedVersion);
    evidence.expectedVersion = legacy.expectedVersion;
    evidence.liveMaxVersion = legacy.liveMaxVersion;
    evidence.verified = legacy.verified;
    evidence.status = legacy.verified ? 'verified' : 'schema-drift';
    evidence.checkedAt = new Date().toISOString();
    await writeEvidence(config.evidencePath, evidence);

    if (!legacy.verified) {
      throw new Error(
        `SUPABASE_PRODUCTION_SCHEMA_DRIFT: repo_head=${legacy.expectedVersion}, `
        + `live_head=${legacy.liveMaxVersion ?? 'missing'}.`,
      );
    }

    return evidence;
  }

  const evaluated = evaluateMigrationHistory(row, repositoryMigrations);
  evidence.authorityFloorVersion = evaluated.authorityFloorVersion;
  evidence.expectedVersion = evaluated.expectedVersion;
  evidence.liveMaxVersion = evaluated.liveMaxVersion;
  evidence.requiredCanonicalVersions = evaluated.requiredCanonicalVersions;
  evidence.representedCanonicalVersions = evaluated.representedCanonicalVersions;
  evidence.acceptedAliasVersions = evaluated.acceptedAliasVersions;
  evidence.missingCanonicalVersions = evaluated.missingCanonicalVersions;
  evidence.unexpectedRecentVersions = evaluated.unexpectedRecentVersions;
  evidence.verified = evaluated.verified;
  evidence.status = evaluated.verified ? 'verified' : 'schema-drift';
  evidence.checkedAt = new Date().toISOString();
  await writeEvidence(config.evidencePath, evidence);

  if (!evaluated.verified) {
    const missing = evaluated.missingCanonicalVersions.join(',') || 'none';
    const unexpected = evaluated.unexpectedRecentVersions
      .map((migration) => migration.liveVersion)
      .join(',') || 'none';
    throw new Error(
      `SUPABASE_PRODUCTION_SCHEMA_DRIFT: repo_head=${evaluated.expectedVersion}, `
      + `live_head=${evaluated.liveMaxVersion ?? 'missing'}, missing=${missing}, `
      + `unexpected=${unexpected}.`,
    );
  }

  return evidence;
}

async function main() {
  const evidence = await verifySupabaseProductionSchema();
  process.stdout.write(
    `Supabase production schema verified at ${evidence.expectedVersion}.\n`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
