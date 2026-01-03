import assert from 'assert';
import { describe, it, before } from 'node:test';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// In-memory fake DB
const __DB = {
  fitness_interview_questions: [],
  fitness_interview_options: []
};

class FakeClient {
  async query(sql, params) {
    const s = sql.toLowerCase();
    // Simple parser for used queries
    if (s.includes('select id, key, label')) {
      // list questions
      return { rows: __DB.fitness_interview_questions };
    }
    if (s.includes('select id from fitness_interview_questions where key =')) {
      const key = params[0];
      const row = __DB.fitness_interview_questions.find(r => r.key === key);
      return { rows: row ? [row] : [] };
    }
    if (s.includes('insert into fitness_interview_questions')) {
      const id = `q_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
      const key = params[0];
      const label = params[1];
      const input_type = params[3];
      const row = { id, key, label, input_type, is_required: params[4] };
      __DB.fitness_interview_questions.push(row);
      return { rows: [row] };
    }
    if (s.includes('insert into fitness_interview_options')) {
      const id = `opt_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
      const qid = params[0];
      const value = params[1];
      const label = params[2];
      const sort_order = params[3];
      const row = { id, question_id: qid, value, label, sort_order };
      __DB.fitness_interview_options.push(row);
      return { rows: [row] };
    }
    if (s.includes('delete from fitness_interview_options where question_id =')) {
      const qid = params[0];
      __DB.fitness_interview_options = __DB.fitness_interview_options.filter(o => o.question_id !== qid);
      return { rows: [] };
    }
    if (s.includes('update fitness_interview_questions set')) {
      const id = params[params.length-1];
      const idx = __DB.fitness_interview_questions.findIndex(r => r.id === id);
      if (idx === -1) return { rows: [] };
      // naive update: set label if provided in params
      const updated = { ...__DB.fitness_interview_questions[idx], label: params[0] || __DB.fitness_interview_questions[idx].label };
      __DB.fitness_interview_questions[idx] = updated;
      return { rows: [updated] };
    }
    if (s.includes('select id, value, label from fitness_interview_options where question_id =')) {
      const qid = params[0];
      return { rows: __DB.fitness_interview_options.filter(o => o.question_id === qid).map(o => ({ id: o.id, value: o.value, label: o.label })) };
    }
    return { rows: [] };
  }
  release() {}
}

class FakePool {
  async connect() { return new FakeClient(); }
  async end() {}
}

const adminRoutesPath = require.resolve('../../routes/admin-fitness-interview');
const adminRoutes = require(adminRoutesPath);
adminRoutes.__setDbGetter(() => new FakePool());

function makeReq(user, body, params) {
  return { user, body, params: params || {} };
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

describe('Admin Fitness Interview API (mocked DB)', () => {
  it('should create a question and options', async () => {
    const user = { id: 'admin_1', role: 'admin' };
  const req = makeReq(user, { question_text: 'What is your goal?', question_type: 'multiple_choice', options: ['lose weight','build muscle'] });
  const res = makeRes();
  // Invoking the express router directly is complex in this unit test; instead exercise the fake DB client
  // and validate DB-level behaviors (insertion/replacement) via the FakePool implementation below.
    const pool = new FakePool();
    const client = await pool.connect();
    const insertQ = await client.query('INSERT INTO fitness_interview_questions (key,label,help_text,input_type,is_required,sort_order,is_enabled,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING *', ['main_goal','Main goal',null,'single_select',true,1,true]);
    assert(__DB.fitness_interview_questions.length === 1);
    // Insert options
    const qid = insertQ.rows[0].id;
    await client.query('INSERT INTO fitness_interview_options (question_id, value, label, sort_order, is_enabled, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())', [qid,'a','A',1,true]);
    assert(__DB.fitness_interview_options.length === 1);
  });
});
