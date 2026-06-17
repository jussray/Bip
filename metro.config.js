// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow Metro to resolve files from both the legacy root-level dirs
// (hooks/, utils/, screens/, etc.) and the new src/ subtree without
// needing to change every existing relative import.
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules'),
];

// Ensure Metro watches the full src/ tree.
config.watchFolders = [
  require('path').resolve(__dirname, 'src'),
];

module.exports = config;
