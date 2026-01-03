const { buildSystemMessage, buildUserMessage } = require('../services/planPromptBuilder');

function run() {
  const system = buildSystemMessage();
  const user = buildUserMessage({ responseJson: { main_goal: 'Build muscle' }, derived: { targetDate: null, equipmentAssumptions: 'basic_gym', lowImpactFlag: false } });
  console.log('SYSTEM:');
  console.log(system.substring(0, 400));
  console.log('\nUSER:');
  console.log(user);
}

run();
