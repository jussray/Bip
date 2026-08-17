import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function clip(value, max = 1_000) {
  if (typeof value !== 'string') return value ?? null;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function listSarifFiles(root) {
  if (!root || !fs.existsSync(root)) return [];
  const files = [];
  const visit = (entry) => {
    const stat = fs.statSync(entry);
    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(entry)) visit(path.join(entry, child));
      return;
    }
    if (entry.endsWith('.sarif') || entry.endsWith('.sarif.json')) files.push(entry);
  };
  visit(root);
  return files.sort();
}

function locationFor(result) {
  const physical = result?.locations?.[0]?.physicalLocation ?? {};
  const region = physical.region ?? {};
  return {
    path: physical.artifactLocation?.uri ?? null,
    startLine: region.startLine ?? null,
    endLine: region.endLine ?? null,
  };
}

export function summarizeSarifDocuments(documents = []) {
  const findings = [];
  let runCount = 0;

  for (const document of documents) {
    for (const run of Array.isArray(document?.runs) ? document.runs : []) {
      runCount += 1;
      const rules = new Map(
        (run?.tool?.driver?.rules ?? []).map((rule) => [rule.id, rule]),
      );
      for (const result of Array.isArray(run?.results) ? run.results : []) {
        const rule = rules.get(result.ruleId) ?? {};
        findings.push({
          ruleId: result.ruleId ?? rule.id ?? 'unknown',
          level: result.level ?? 'unknown',
          securitySeverity: rule?.properties?.['security-severity'] ?? null,
          message: clip(result?.message?.text),
          ...locationFor(result),
        });
      }
    }
  }

  return {
    runCount,
    findingCount: findings.length,
    findings,
  };
}

function save(directory, name, value) {
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(
    path.join(directory, name),
    `${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n`,
    'utf8',
  );
}

export function runLocalCodeqlProof(env = process.env) {
  const sarifDir = clean(env.CODEQL_SARIF_DIR);
  const language = clean(env.CODEQL_LANGUAGE);
  const expectedHead = clean(env.EXPECTED_HEAD_SHA).toLowerCase();
  const evidenceDir = clean(env.EVIDENCE_DIR) || 'artifacts/codeql-local/evidence';

  if (!sarifDir) throw new Error('CODEQL_SARIF_DIR is required');
  if (!language) throw new Error('CODEQL_LANGUAGE is required');
  if (!expectedHead) throw new Error('EXPECTED_HEAD_SHA is required');

  const sarifFiles = listSarifFiles(sarifDir);
  if (sarifFiles.length === 0) {
    save(evidenceDir, 'summary.json', {
      schemaVersion: 1,
      proofState: 'failed',
      reason: 'sarif-missing',
      language,
      exactHead: expectedHead,
      sarifFileCount: 0,
      findingCount: null,
    });
    throw new Error(`Local CodeQL produced no SARIF for ${language}`);
  }

  const documents = sarifFiles.map((file) => JSON.parse(fs.readFileSync(file, 'utf8')));
  const summary = summarizeSarifDocuments(documents);
  const receipt = {
    schemaVersion: 1,
    proofState: summary.findingCount === 0 ? 'passed' : 'failed',
    querySuite: 'security-extended',
    uploadMode: 'never',
    language,
    exactHead: expectedHead,
    sarifFileCount: sarifFiles.length,
    runCount: summary.runCount,
    findingCount: summary.findingCount,
  };

  save(evidenceDir, 'summary.json', receipt);
  save(evidenceDir, 'findings.json', summary.findings);

  if (summary.runCount === 0) {
    throw new Error(`Local CodeQL SARIF contained no analysis runs for ${language}`);
  }
  if (summary.findingCount > 0) {
    throw new Error(`Local CodeQL security gate failed for ${language}: ${summary.findingCount} finding(s)`);
  }

  console.log(`Local CodeQL proof passed: language=${language} head=${expectedHead} sarif=${sarifFiles.length} findings=0`);
  return receipt;
}

const isDirectExecution = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectExecution) {
  try {
    runLocalCodeqlProof();
  } catch (error) {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  }
}
