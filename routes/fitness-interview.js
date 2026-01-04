/**
 * Fitness Interview Routes
 *
 * - POST /submit        (protected) submit interview answers -> generates plan via OpenAI
 * - GET  /plans         (protected) list generated plans for current user
 * - GET  /plans/:id     (protected) fetch a single generated plan
 *
 * Notes:
 * - Requires JWT auth (use server's requireAuth when mounting)
 * - All responses from OpenAI are parsed as JSON only; non-JSON responses return error
 */

const express = require('express');
let Pool;
const OpenAI = require('openai');

const router = express.Router();

let getDb = function() {
  if (!Pool) {
    // require lazily so tests can avoid native 'pg' dependency
    try {
      Pool = require('pg').Pool;
    } catch (e) {
      throw new Error('Postgres client not available in this environment');
    }
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');
  return new Pool({ connectionString: dbUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
}

// Allow tests to inject a custom DB getter
module.exports.__setDbGetter = function(fn) { getDb = fn; };

// Helper to validate answers payload
function validateAnswers(answers) {
  if (!Array.isArray(answers) || answers.length === 0) return false;
  for (const a of answers) {
    if (!a.question_id && !a.question_text) return false;
    if (typeof a.user_answer === 'undefined' || a.user_answer === null) return false;
  }
  return true;
}

// POST /submit - submit interview answers (store only) and return response_id
async function submitHandler(req, res) {
  try {
    // Expect JWT middleware to have populated req.user
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'not_authenticated' });

  const { session_id, answers, response_json, additional_context } = req.body;

    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({ error: 'validation_error', message: 'session_id is required' });
    }

    // Accept either answers array or response_json keyed by question key
    if (!response_json && !validateAnswers(answers)) {
      return res.status(400).json({ error: 'validation_error', message: 'answers must be a non-empty array with question_id/question_text and user_answer, or provide response_json object keyed by question key' });
    }

    // Persist answers (insert one response record with response_json)
    const db = getDb();
    const client = await db.connect();
    try {
      let responseJson = {};
      if (response_json && typeof response_json === 'object') {
        responseJson = response_json;
      } else {
        for (const a of answers) {
          // prefer question key if provided, otherwise id
          const key = a.question_key || a.question_text || a.question_id || `q_${Math.random().toString(36).slice(2,8)}`;
          responseJson[key] = a.user_answer;
        }
      }
      // include additional context (like desired output format) if provided
      if (additional_context && typeof additional_context === 'object') {
        responseJson._additional_context = additional_context;
      }

      // Server-side validation: ensure required enabled questions are present and types roughly match
      try {
        const cfgRes = await client.query(`SELECT id, key, input_type, is_required FROM fitness_interview_questions WHERE is_enabled = true`);
        const cfg = cfgRes.rows || [];
        const qIdMap = {};
        const keyMap = {};
        cfg.forEach(q => { qIdMap[q.id] = q; keyMap[q.key] = q; });

        // load enabled options for these questions (if any)
        const qIds = cfg.map(q => q.id);
        let opts = [];
        if (qIds.length > 0) {
          const optsRes = await client.query(`SELECT question_id, value FROM fitness_interview_options WHERE question_id = ANY($1) AND is_enabled = true`, [qIds]);
          opts = optsRes.rows || [];
        }
        const optsByQuestion = {};
        for (const o of opts) {
          if (!optsByQuestion[o.question_id]) optsByQuestion[o.question_id] = new Set();
          optsByQuestion[o.question_id].add(o.value);
        }

        // Validate required questions and types
        for (const q of cfg) {
          const key = q.key;
          const val = responseJson.hasOwnProperty(key) ? responseJson[key] : undefined;
          if (q.is_required) {
            if (val === undefined || val === null || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && String(val).trim() === '')) {
              client.release();
              await db.end();
              return res.status(400).json({ error: 'validation_error', message: `Missing required interview answer: ${key}` });
            }
          }
          if (val !== undefined && val !== null) {
            const t = q.input_type;
            if (t === 'multi_select') {
              if (!Array.isArray(val)) {
                client.release();
                await db.end();
                return res.status(400).json({ error: 'validation_error', message: `Expected array for ${key}` });
              }
              // if options exist, ensure values are allowed
              const allowed = optsByQuestion[q.id];
              if (allowed && allowed.size > 0) {
                for (const v of val) if (!allowed.has(String(v))) {
                  client.release();
                  await db.end();
                  return res.status(400).json({ error: 'validation_error', message: `Invalid option for ${key}: ${v}` });
                }
              }
            } else if (t === 'single_select') {
              if (typeof val !== 'string' && typeof val !== 'number') {
                client.release();
                await db.end();
                return res.status(400).json({ error: 'validation_error', message: `Expected single value for ${key}` });
              }
              const allowed = optsByQuestion[q.id];
              if (allowed && allowed.size > 0 && !allowed.has(String(val))) {
                client.release();
                await db.end();
                return res.status(400).json({ error: 'validation_error', message: `Invalid option for ${key}: ${val}` });
              }
            } else if (t === 'number') {
              if (isNaN(Number(val))) {
                client.release();
                await db.end();
                return res.status(400).json({ error: 'validation_error', message: `Expected numeric value for ${key}` });
              }
            } else if (t === 'text') {
              // accept anything coercible to string
            }
          }
        }
      } catch (vErr) {
        console.warn('[Fitness Interview] validation failed', vErr.message || vErr);
        // fall through to attempt to store (do not block on validation subsystem errors)
      }

      const insert = await client.query(
        `INSERT INTO fitness_interview_responses (user_id, submitted_at, response_json, created_at, updated_at)
         VALUES ($1, NOW(), $2, NOW(), NOW()) RETURNING id`,
        [user.id, responseJson]
      );

      const responseId = insert.rows[0].id;
      client.release();
      await db.end();

      return res.json({ success: true, response_id: responseId });
    } catch (err) {
      client.release();
      await db.end();
      console.error('[Fitness Interview] Error storing responses:', err.message || err);
      return res.status(500).json({ error: 'server_error', message: 'Failed to store responses' });
    }
  } catch (error) {
    console.error('[Fitness Interview] Unexpected error:', error.message || error);
    return res.status(500).json({ error: 'server_error', message: error.message || 'Unexpected error' });
  }
}

router.post('/submit', submitHandler);

// GET /questions - return enabled questions and their enabled options ordered by sort_order
router.get('/questions', async (req, res) => {
  try {
    const db = getDb();
    const client = await db.connect();
    try {
      const qRes = await client.query(`SELECT id, key, label, help_text, input_type, is_required, sort_order, is_enabled FROM fitness_interview_questions WHERE is_enabled = true ORDER BY sort_order, id`);
      const questions = qRes.rows;
      if (questions.length === 0) {
        client.release();
        await db.end();
        return res.json({ ok: true, data: { questions: [] } });
      }

      // fetch options for all question ids
      const qIds = questions.map(q => q.id);
      const optsRes = await client.query(`SELECT id, question_id, value, label, sort_order, is_enabled FROM fitness_interview_options WHERE question_id = ANY($1) AND is_enabled = true ORDER BY sort_order, id`, [qIds]);
      const opts = optsRes.rows;

      const byQuestion = {};
      for (const o of opts) {
        if (!byQuestion[o.question_id]) byQuestion[o.question_id] = [];
        byQuestion[o.question_id].push({ value: o.value, label: o.label, sort_order: o.sort_order });
      }

      const out = questions.map(q => ({ key: q.key, label: q.label, help_text: q.help_text, input_type: q.input_type, is_required: q.is_required, sort_order: q.sort_order, options: byQuestion[q.id] || [] }));

      client.release();
      await db.end();
      return res.json({ ok: true, data: { questions: out } });
    } catch (err) {
      client.release();
      await db.end();
      console.error('[Fitness Interview] GET /questions error', err);
      return res.status(500).json({ ok: false, error_code: 'server_error', message: 'Failed to load questions' });
    }
  } catch (err) {
    console.error('[Fitness Interview] GET /questions unexpected', err);
    return res.status(500).json({ ok: false, error_code: 'server_error', message: 'Unexpected error' });
  }
});

async function generatePlanHandler(req, res) {
  const { response_id } = req.body;
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'not_authenticated' });
  if (!response_id) return res.status(400).json({ error: 'validation_error', message: 'response_id is required' });

  const requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (require('crypto').randomUUID());
  const start = Date.now();

  const db = getDb();
  const client = await db.connect();
  try {
    // load response_json
    const r = await client.query(`SELECT id, user_id, response_json FROM fitness_interview_responses WHERE id = $1`, [response_id]);
    if (r.rows.length === 0) {
      client.release();
      await db.end();
      return res.status(404).json({ error: 'not_found' });
    }

    const resp = r.rows[0];
    if (resp.user_id !== user.id && user.role !== 'admin') {
      client.release();
      await db.end();
      return res.status(403).json({ error: 'forbidden' });
    }

    // build derived fields
    const responseJson = resp.response_json || {};
    const derived = {};
    derived.targetDate = responseJson.target_date || null;
    const location = responseJson.location || '';
    derived.equipmentAssumptions = location && location.includes('gym') ? 'basic_gym' : 'bodyweight';
    derived.lowImpactFlag = false;
    // Do not log injuries; detect low impact flag from injuries text without logging raw text
    if (responseJson.injuries && typeof responseJson.injuries === 'string' && responseJson.injuries.trim().length > 0) {
      derived.lowImpactFlag = true;
    }

    // Build prompt
    const { buildSystemMessage, buildUserMessage } = require('../services/planPromptBuilder');
    const systemMessage = buildSystemMessage();
    const userMessage = buildUserMessage({ responseJson, derived });

    // Call OpenAI
    const { generateChatCompletion } = require('../services/openaiClient');
    // Debug: optionally log messages sent to OpenAI when DEBUG_OPENAI=true
    try {
      if (process.env.DEBUG_OPENAI === 'true') {
        const debugMessages = [ { role: 'system', content: systemMessage }, { role: 'user', content: userMessage } ];
        // Avoid logging sensitive user text raw — log a short preview instead
        console.log('[DEBUG_OPENAI] messages ->', JSON.stringify(debugMessages.map(m => ({ role: m.role, content_preview: (typeof m.content === 'string' ? m.content.slice(0,200) : String(m.content)).replace(/\n/g,'\\n') })), null, 2));
      }
    } catch (e) {
      console.warn('[DEBUG_OPENAI] failed to log messages:', e.message || e);
    }
    const completion = await generateChatCompletion({ messages: [ { role: 'system', content: systemMessage }, { role: 'user', content: userMessage } ], temperature: 0.25 });
    let responseText = completion.text || '';
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Validate JSON
    let planJson;
    try {
      planJson = JSON.parse(responseText);
    } catch (err) {
      const duration = Date.now() - start;
      // log minimal info
      console.log('[Fitness Interview][LOG]', { requestId, responseId: response_id, status: 'invalid_json', duration });
      client.release();
      await db.end();
      return res.status(500).json({ error_code: 'invalid_plan_json', message: 'AI returned invalid JSON' });
    }

    // Validate structure
    const { validatePlanJson } = require('../services/planValidator');
    const { valid, errors } = validatePlanJson(planJson);
    if (!valid) {
      const duration = Date.now() - start;
      console.log('[Fitness Interview][LOG]', { requestId, responseId: response_id, status: 'invalid_plan_json', duration });
      client.release();
      await db.end();
      return res.status(500).json({ error_code: 'invalid_plan_json', message: 'Plan JSON failed validation', details: errors });
    }

    // Store plan in workout_plans
    const insert = await client.query(
      `INSERT INTO workout_plans (user_id, created_from_response_id, plan_json, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
      [user.id, response_id, planJson]
    );

    const planId = insert.rows[0].id;
    const duration = Date.now() - start;
    console.log('[Fitness Interview][LOG]', { requestId, responseId: response_id, planId, status: 'ok', duration });

    client.release();
    await db.end();

    return res.json({ success: true, plan_id: planId });
  } catch (err) {
    const duration = Date.now() - start;
    console.error('[Fitness Interview] Error generating plan:', err.message || err);
    console.log('[Fitness Interview][LOG]', { requestId, responseId: response_id, status: 'error', duration });
    try { client.release(); await db.end(); } catch (e) {}
    return res.status(500).json({ error: 'server_error', message: 'Failed to generate plan' });
  }
}

router.post('/generate-plan', generatePlanHandler);

// export handlers for testing
// Expose handlers and test hooks on the router for integration tests
router.submitHandler = submitHandler;
router.generatePlanHandler = generatePlanHandler;
router.__setDbGetter = function(fn) { getDb = fn; };

module.exports = router;
module.exports.submitHandler = submitHandler;
module.exports.generatePlanHandler = generatePlanHandler;

// GET /plans - list generated plans for current user
router.get('/plans', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'not_authenticated' });

    const db = getDb();
    const result = await db.query(
      `SELECT id, user_id, created_from_response_id, plan_json, created_at
       FROM workout_plans
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );
    await db.end();
    res.json({ success: true, plans: result.rows });
  } catch (err) {
    console.error('[Fitness Interview] Error fetching plans:', err.message || err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch plans' });
  }
});

// GET /plans/:id - return a single plan by id (must belong to user or admin)
router.get('/plans/:id', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'not_authenticated' });

    const planId = req.params.id;
    const db = getDb();
    const result = await db.query(
      `SELECT id, user_id, created_from_response_id, plan_json, created_at
       FROM workout_plans
       WHERE id = $1`,
      [planId]
    );
    await db.end();

    if (result.rows.length === 0) return res.status(404).json({ error: 'not_found' });

    const plan = result.rows[0];
    // require ownership unless admin
    if (plan.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }

    res.json({ success: true, plan });
  } catch (err) {
    console.error('[Fitness Interview] Error fetching plan:', err.message || err);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch plan' });
  }
});

module.exports = router;
