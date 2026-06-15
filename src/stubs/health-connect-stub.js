// Stub for react-native-health-connect
// Used when the native module is not installed (build environments, simulators)
module.exports = {
  initialize: async () => false,
  requestPermission: async () => [],
  readRecords: async () => ({ records: [] }),
  getSdkStatus: async () => 0,
  openHealthConnectSettings: async () => {},
  openHealthConnectDataManagement: async () => {},
};
