// Stub for expo-health
// Used when the native module is not installed (build environments, simulators)
module.exports = {
  isAvailableAsync: async () => false,
  requestPermissionsAsync: async () => ({ status: 'denied' }),
  getStatisticsSampleAsync: async () => null,
  HealthDataType: {
    Steps: 'Steps',
    ActiveEnergyBurned: 'ActiveEnergyBurned',
    HeartRate: 'HeartRate',
    SleepAnalysis: 'SleepAnalysis',
    Weight: 'Weight',
  },
};
