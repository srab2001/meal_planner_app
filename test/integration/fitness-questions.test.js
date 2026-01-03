import assert from 'assert';
import { describe, it, before } from 'node:test';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// In-memory fake DB used by the route
const __DB = {
  fitness_interview_responses: [],
  workout_plans: []
};

class FakeClient {
  async query(sql, params) {
    const s = sql.toLowerCase();
    if (s.includes('insert into fitness_interview_responses')) {
      const id = `resp_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
      const user_id = params[0];
      const response_json = params[1];
      const row = { id, user_id, response_json };
      __DB.fitness_interview_responses.push(row);
      return { rows: [{ id }] };
    }
    if (s.includes('select id, user_id, response_json from fitness_interview_responses where id = $1')) {
      const id = params[0];
      const row = __DB.fitness_interview_responses.find(r => r.id === id);
      return { rows: row ? [row] : [] };
    }
    if (s.includes('insert into workout_plans')) {
      const id = `plan_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
      const user_id = params[0];
      const created_from_response_id = params[1];
      const plan_json = params[2];
      const row = { id, user_id, created_from_response_id, plan_json };
      __DB.workout_plans.push(row);
      return { rows: [{ id }] };
    }
    if (s.includes('select id, user_id, created_from_response_id, plan_json, created_at from workout_plans where user_id')) {
      const user_id = params[0];
      const items = __DB.workout_plans.filter(p => p.user_id === user_id).slice(-1).reverse();
      return { rows: items };
    }
    if (s.includes('select id, user_id, created_from_response_id, plan_json, created_at from workout_plans where id = $1')) {
      const id = params[0];
      const row = __DB.workout_plans.find(p => p.id === id);
      return { rows: row ? [row] : [] };
    }

    return { rows: [] };
  }
  release() {}
}

class FakePool {
  constructor() {}
  async connect() { return new FakeClient(); }
  async end() {}
}

// Monkeypatch require cache for 'pg' is done by injecting DB getter on the routes
// Stub OpenAI client and capture messages
// Ensure OpenAI client doesn't throw when required in test environment
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test';

const openaiModulePath = require.resolve('../../services/openaiClient');
const openaiModule = require(openaiModulePath);
let capturedMessages = null;

// Stub plan validator to bypass AJV
const planValidatorPath = require.resolve('../../services/planValidator');
require.cache[planValidatorPath] = { id: planValidatorPath, filename: planValidatorPath, loaded: true, exports: { validatePlanJson: (p) => ({ valid: true, errors: [] }) } };

// Sample plan returned by fake OpenAI
const samplePlan = {
  planSummary: { name: 'Test Plan', duration_weeks: 4 },
  weeklySchedule: [],
  sessions: []
};

// Require routes after stubbing
const routes = require('../../routes/fitness-interview');
routes.__setDbGetter(() => new FakePool());

// Replace generateChatCompletion to capture its input
openaiModule.generateChatCompletion = async (opts) => {
  capturedMessages = opts.messages || opts;
  return { model: 'test', text: JSON.stringify(samplePlan), duration: 5 };
};

function makeReq(user, body) {
  return { user, body };
}

function makeRes() {
  let statusCode = 200;
  let body = null;
  return {
    status(code) { statusCode = code; return this; },
    json(obj) { body = obj; return { code: statusCode, body }; },
    _get() { return { statusCode, body }; }
  };
}

describe('AI Coach questions -> OpenAI payload (integration)', () => {
  it('sends interview responses keyed by question_text to OpenAI', async () => {
    const user = { id: 'user_1', role: 'user' };

    // Define the canonical questions that frontend would fetch and the answers user provides
    const questions = [
      { id: 'q1', question_text: 'What type of workout are you interested in?' },
      { id: 'q2', question_text: 'How many days per week can you exercise?' },
      { id: 'q3', question_text: 'What is your current fitness level?' },
      { id: 'q4', question_text: 'Do you have access to gym equipment?' },
      { id: 'q5', question_text: 'How much time can you dedicate per workout (minutes)?' }
    ];

    const answers = [
      { question_id: 'q1', question_text: questions[0].question_text, user_answer: 'Strength' },
      { question_id: 'q2', question_text: questions[1].question_text, user_answer: '3' },
      { question_id: 'q3', question_text: questions[2].question_text, user_answer: 'Intermediate' },
      { question_id: 'q4', question_text: questions[3].question_text, user_answer: 'Yes' },
      { question_id: 'q5', question_text: questions[4].question_text, user_answer: '45' }
    ];

    // Submit responses
    const submitReq = makeReq(user, { session_id: 'sess-test-1', answers });
    const submitRes = makeRes();
    await routes.submitHandler(submitReq, submitRes);

    // Verify saved in fake DB
    assert(__DB.fitness_interview_responses.length === 1, 'response saved');
    const responseId = __DB.fitness_interview_responses[0].id;

    // Trigger plan generation which should call OpenAI with messages including the interview JSON
    const genReq = makeReq(user, { response_id: responseId });
    const genRes = makeRes();
    await routes.generatePlanHandler(genReq, genRes);

    // Ensure OpenAI was called and we captured messages
    assert(capturedMessages, 'OpenAI called with messages');
    // The user message is expected to be the second message (system, user)
    const userMessage = capturedMessages.find(m => m.role === 'user');
    assert(userMessage, 'User message present');

    // The user message content should include the JSON of the interview responses
    const content = userMessage.content || '';
    // Extract the JSON block after the marker 'User interview responses (JSON):\n'
    const marker = 'User interview responses (JSON):\n';
    const idx = content.indexOf(marker);
    assert(idx !== -1, 'User message includes interview JSON marker');
    const jsonText = content.slice(idx + marker.length).split('\n\n')[0].trim();

    let parsed = null;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      // If parsing fails, the test should fail
      assert.fail('Failed to parse interview JSON from user message');
    }

    // Assert that keys in parsed correspond to question_text and values are correct
    for (const a of answers) {
      assert(parsed[a.question_text] !== undefined, `Parsed JSON has key ${a.question_text}`);
      assert(String(parsed[a.question_text]) === String(a.user_answer), `Answer for '${a.question_text}' matches`);
    }
  });
});
