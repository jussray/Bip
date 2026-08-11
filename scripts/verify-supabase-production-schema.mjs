import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_PROJECT_REF = 'tbsevonvegdnlyjgplmm';
export const DEFAULT_MIGRATIONS_DIR = 'supabase/migrations';
export const DEFAULT_EVIDENCE_PATH = 'artifacts/supabase-production-schema.json';
const VERSION_PATTERN = /^\d{14}$/;
const MIGRATION_FILE_PATTERN = /^(\d{14})_.+\.sql$/;

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

export function configFromEnv(env = process.env) {
  return {
    token: clean(env.SUPABASE_ACCESS_TOKEN),
    projectRef: clean(env.SUPABASE_PROJECT_REF) || DEFAULT_PROJECT_REF,
    migrationsDir: clean(env.SUPABASE_MIGRATIONS_DIR) || DEFAULT_MIGRATIONS_DIR,
    evidencePath: clean(env.SUPABASE_SCHEMA_EVIDENCE_PATH) || DEFAULT_EVIDENCE_PATH,
  };
}

export function buildReadOnlyQuery() {
  return `select coalesce(max(version), '') as live_max_version\nfrom supabase_migrations.schema_migrations;`;
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
    schemaVersion: 1,
    verified: false,
    status: 'initializing',
    projectRef: config.projectRef || null,
    expectedVersion: null,
    liveMaxVersion: null,
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
  try {
    expectedVersion = options.expectedVersion
      ?? await deriveRepositorySchemaVersion(config.migrationsDir);
    expectedVersion = normalizeSchemaVersion(expectedVersion);
    if (!expectedVersion) {
      throw new Error('Expected Supabase schema version must be exactly 14 digits.');
    }
    evidence.expectedVersion = expectedVersion;
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
  const evaluated = evaluateSchemaRow(rows[0], expectedVersion);
  evidence.expectedVersion = evaluated.expectedVersion;
  evidence.liveMaxVersion = evaluated.liveMaxVersion;
  evidence.verified = evaluated.verified;
  evidence.status = evaluated.verified ? 'verified' : 'schema-drift';
  evidence.checkedAt = new Date().toISOString();
  await writeEvidence(config.evidencePath, evidence);

  if (!evaluated.verified) {
    throw new Error(
      `SUPABASE_PRODUCTION_SCHEMA_DRIFT: repo_head=${evaluated.expectedVersion}, `
      + `live_head=${evaluated.liveMaxVersion ?? 'missing'}.`,
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
