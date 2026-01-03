/** Simple test for planValidator */
const { validatePlanJson } = require('../services/planValidator');

function run() {
  const sample = {
    planSummary: { name: 'Sample Plan' },
    weeklySchedule: [],
    sessions: [ { sessionId: 's1', durationMinutes: 30, warmup: [], main: [], cooldown: [] } ],
    progressionRules: {},
    substitutions: {},
    trackingFields: {},
    safetyNotes: []
  };

  const res = validatePlanJson(sample);
  console.log('Validator result:', res);
}

run();
