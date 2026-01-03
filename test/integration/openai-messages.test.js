import assert from 'assert';
import { describe, it } from 'node:test';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Capture variable for messages
let capturedMessages = null;

// Stub openaiClient module before requiring the route
const openaiClientPath = require.resolve('../../services/openaiClient');
require.cache[openaiClientPath] = {
  id: openaiClientPath,
  filename: openaiClientPath,
  loaded: true,
  exports: {
    generateChatCompletion: async function({ messages }) {
      capturedMessages = messages;
      // Return a valid JSON plan string
      const plan = { planSummary: 'test plan', weeklySchedule: [], sessions: [] };
      return { text: JSON.stringify(plan), model: 'test-model', duration: 1 };
    }
  }
};

// Fake DB that returns a response row for the response_id and accepts workout_plans insert
class FakeClient {
  constructor() {
    this._responses = {
      'resp-1': { id: 'resp-1', user_id: 'user-1', response_json: { main_goal: 'lose_weight', days_per_week: 3, fitness_level: 'beginner', injuries: '' } }
    };
    this._plans = [];
  }
  async query(sql, params) {
    const s = String(sql).toLowerCase();
    if (s.includes('select id, user_id, response_json from fitness_interview_responses where id = $1')) {
      const id = params[0];
      const row = this._responses[id];
      return { rows: row ? [row] : [] };
    }
    if (s.includes('insert into workout_plans')) {
      const id = `plan_${Date.now()}`;
      this._plans.push({ id, user_id: params[0], created_from_response_id: params[1], plan_json: params[2] });
      return { rows: [{ id }] };
    }
    // any other selects used by handler (e.g., question loading) -> empty
    return { rows: [] };
  }
  release() {}
}
class FakePool { async connect() { return new FakeClient(); } async end() {} }

// Now require the fitness-interview route and inject fake DB
const routePath = require.resolve('../../routes/fitness-interview');
const routes = require(routePath);
routes.__setDbGetter(() => new FakePool());

// Stub planValidator to avoid bringing in ajv-formats in tests
const planValidatorPath = require.resolve('../../services/planValidator');
require.cache[planValidatorPath] = {
  id: planValidatorPath,
  filename: planValidatorPath,
  loaded: true,
  exports: {
    validatePlanJson: function(plan) { return { valid: true, errors: [] }; }
  }
};

function makeReq(user, body) { return { user, body }; }
function makeRes() {
  let last = null;
  return {
    status(code) { this._status = code; return this; },
    json(obj) { last = obj; return obj; },
    _get() { return { status: this._status || 200, body: last }; }
  };
}

describe('OpenAI messages are constructed and sent', () => {
  it('captures messages sent to OpenAI and includes user response JSON', async () => {
    const req = makeReq({ id: 'user-1', role: 'user' }, { response_id: 'resp-1' });
    const res = makeRes();

    // Call the handler directly
    await routes.generatePlanHandler(req, res);

    // Assert capturedMessages is an array with system and user
    assert(Array.isArray(capturedMessages), 'messages should be an array');
    assert(capturedMessages.length >= 2, 'at least system + user messages');
    const system = capturedMessages.find(m => m.role === 'system');
    const user = capturedMessages.find(m => m.role === 'user');
    assert(system && typeof system.content === 'string', 'system message exists');
    assert(user && typeof user.content === 'string', 'user message exists');

    // The user content must include the JSON of the response (main_goal etc.)
    assert(user.content.includes('main_goal'), 'user message includes response_json keys');
    assert(user.content.includes('lose_weight'), 'user message includes response value');

    // Handler should have returned JSON success (plan created)
    const out = res._get();
    assert(out.body && out.body.success === true, 'response indicates success');
  });
});
