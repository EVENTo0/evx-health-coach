// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Stub out optional native modules that aren't installed.
// Metro still tries to resolve require() calls at bundle time,
// so we redirect them to an empty shim instead of crashing.
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-health-connect': require.resolve('./src/stubs/health-connect-stub.js'),
  'expo-health': require.resolve('./src/stubs/expo-health-stub.js'),
};

module.exports = config;
