import assert from 'assert';
import { describe, it } from 'node:test';

// Reuse in-memory fake DB from previous test pattern
const __DB = {
  fitness_interview_questions: [],
  fitness_interview_options: []
};

class FakeClient {
  async query(sql, params) {
    const s = sql.toLowerCase();
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
      const row = { id, key, label, input_type, is_required: params[4], sort_order: params[5], is_enabled: params[6] };
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
    if (s.includes('select id, key, label')) {
      return { rows: __DB.fitness_interview_questions };
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
      const updated = { ...__DB.fitness_interview_questions[idx], label: params[0] || __DB.fitness_interview_questions[idx].label };
      __DB.fitness_interview_questions[idx] = updated;
      return { rows: [updated] };
    }
    return { rows: [] };
  }
  release() {}
}
class FakePool { async connect() { return new FakeClient(); } async end() {} }

describe('Admin fitness more (mock DB)', () => {
  it('create question with options and then replace options', async () => {
    const pool = new FakePool();
    const client = await pool.connect();
    // create question
    const insertQ = await client.query('INSERT INTO fitness_interview_questions (key,label,help_text,input_type,is_required,sort_order,is_enabled,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING *', ['q1','Q1',null,'single_select',true,1,true]);
    const qid = insertQ.rows[0].id;
    assert(__DB.fitness_interview_questions.length === 1);
    // add options
    await client.query('INSERT INTO fitness_interview_options (question_id, value, label, sort_order, is_enabled, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())', [qid,'a','A',1,true]);
    await client.query('INSERT INTO fitness_interview_options (question_id, value, label, sort_order, is_enabled, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())', [qid,'b','B',2,true]);
    assert(__DB.fitness_interview_options.length === 2);
    // now replace options
    await client.query('DELETE FROM fitness_interview_options WHERE question_id = $1', [qid]);
    await client.query('INSERT INTO fitness_interview_options (question_id, value, label, sort_order, is_enabled, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,NOW(),NOW())', [qid,'x','X',1,true]);
    assert(__DB.fitness_interview_options.length === 1);
  });
});
