const fs = require('fs');

const parentFiles = [
  'screens/Bippin2Screen.tsx',
  'screens/BridgeScreen.tsx',
  'screens/ConnectionHubScreen.tsx',
  'screens/InsightsScreen.tsx',
  'screens/MessagesScreen.tsx',
  'screens/ParentBridgeScreen.tsx',
  'screens/SettingsScreen.tsx',
];

for (const file of parentFiles) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/from ['"]@\/utils\/sync['"]/g, "from '@/utils/parentBridgeCompat'");
  fs.writeFileSync(file, text);
}

const pointsFile = 'screens/PointsScreen.tsx';
if (fs.existsSync(pointsFile)) {
  let text = fs.readFileSync(pointsFile, 'utf8');
  text = text.replace(
    /import \{ snapshotPoints, fetchPointsHistory, syncTeenActivitySummary, type PointsHistoryEntry \} from ['"]@\/utils\/sync['"];?/,
    "import { snapshotPoints } from '@/utils/sync';\nimport { fetchPointsHistory, syncTeenActivitySummary, type PointsHistoryEntry } from '@/utils/pointsCompat';",
  );
  fs.writeFileSync(pointsFile, text);
}

const appSettings = 'app/(main)/settings.tsx';
if (fs.existsSync(appSettings)) {
  let text = fs.readFileSync(appSettings, 'utf8');
  text = text.replace(/from ['"]@\/utils\/sync['"]/g, "from '@/utils/parentBridgeCompat'");
  fs.writeFileSync(appSettings, text);
}
