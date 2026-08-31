// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

// Expo SDK 56 can discover source files on demand and already enables
// package.json exports resolution. Keep Metro on Expo's supported defaults;
// Babel/TypeScript continue to own the app's import aliases.
module.exports = getDefaultConfig(__dirname);
