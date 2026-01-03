#!/usr/bin/env node
// Simple smoke test for the Fitness Interview endpoints
// Usage: node scripts/smoke-test.js --url <BASE_URL> [--token <AUTH_TOKEN>]

if (typeof global.fetch === 'undefined') {
  console.error('Global fetch is not available in this Node runtime. Please run on Node 18+ or install node-fetch.');
  process.exit(2);
}

function usage() {
  console.log('Usage: node scripts/smoke-test.js --url <BASE_URL> [--token <AUTH_TOKEN>]');
  console.log('');
  console.log('If no token is provided, will attempt to generate one via POST /auth/test-token');
  process.exit(2);
}

// Minimal arg parsing to avoid external deps
const argv = process.argv.slice(2);
let BASE = process.env.DEPLOY_URL || '';
let TOKEN = process.env.AUTH_TOKEN || '';
let BACKEND_BASE = '';  // separate backend URL for token generation
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if ((a === '--url' || a === '-u') && argv[i+1]) { BASE = argv[i+1]; i++; }
  else if ((a === '--token' || a === '-t') && argv[i+1]) { TOKEN = argv[i+1]; i++; }
  else if ((a === '--backend' || a === '-b') && argv[i+1]) { BACKEND_BASE = argv[i+1]; i++; }
  else if (a === '--help' || a === '-h') { usage(); }
}
if (!BASE) usage();

const headers = { 'Content-Type': 'application/json' };
if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

async function obtainTestToken() {
  // Determine which URL to use for token generation
  const tokenUrl = BACKEND_BASE || BASE;
  const backendUrl = tokenUrl.replace(/\/$/, '');
  
  console.log(`Generating test token via ${backendUrl}/auth/test-token...`);
  
  try {
    const response = await fetch(`${backendUrl}/auth/test-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate test token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.token) {
      throw new Error('No token in response from /auth/test-token');
    }
    
    console.log(`✅ Test token generated successfully`);
    console.log(`   User: ${data.user.email}`);
    console.log(`   Expires: ${data.expiresIn}`);
    
    return data.token;
  } catch (err) {
    console.error('❌ Failed to obtain test token:', err.message);
    throw err;
  }
}

async function run() {
  try {
    console.log(`Running smoke tests against: ${BASE}`);
    
    // If no token provided, try to generate one
    if (!TOKEN) {
      console.log('No token provided, attempting to generate test token...\n');
      TOKEN = await obtainTestToken();
      headers['Authorization'] = `Bearer ${TOKEN}`;
    }
    
    console.log('');

    // 1) GET /api/fitness-interview/questions
    process.stdout.write('1) Fetch questions... ');
    const qres = await fetch(`${BASE.replace(/\/$/, '')}/api/fitness-interview/questions`, { headers });
    if (!qres.ok) throw new Error(`GET questions failed: ${qres.status} ${qres.statusText}`);
    const qjson = await qres.json();
    if (!qjson || !qjson.ok || !qjson.data || !Array.isArray(qjson.data.questions)) {
      throw new Error('Invalid questions response shape');
    }
    console.log(`OK (${qjson.data.questions.length} questions)`);

    // Build a minimal response_json using available question keys when possible
    const keys = qjson.data.questions.map(q => q.key);
    const respPayload = {
      session_id: `smoke_${Date.now()}`,
      response_json: {}
    };
    // Try to fill common keys
    if (keys.includes('main_goal')) respPayload.response_json.main_goal = 'lose_weight';
    if (keys.includes('primary_objectives')) respPayload.response_json.primary_objectives = ['cardio'];
    if (keys.includes('fitness_level')) respPayload.response_json.fitness_level = 'beginner';
    if (keys.includes('days_per_week')) respPayload.response_json.days_per_week = 3;
    if (keys.includes('location')) respPayload.response_json.location = 'gym';
    if (keys.includes('session_length')) respPayload.response_json.session_length = 30;
    if (keys.includes('injuries')) respPayload.response_json.injuries = 'none';
    if (keys.includes('training_style')) respPayload.response_json.training_style = 'general';
    // default minimal
    if (Object.keys(respPayload.response_json).length === 0) {
      // fallback to a simple shape the server will accept
      respPayload.response_json = { main_goal: 'lose_weight', fitness_level: 'beginner' };
    }

    // 2) POST /api/fitness-interview/submit
    process.stdout.write('2) Submit interview responses... ');
    const sres = await fetch(`${BASE.replace(/\/$/, '')}/api/fitness-interview/submit`, { method: 'POST', headers, body: JSON.stringify(respPayload) });
    if (!sres.ok) {
      const text = await sres.text().catch(()=>null);
      throw new Error(`Submit failed: ${sres.status} ${sres.statusText} ${String(text).slice(0,200)}`);
    }
    const sjson = await sres.json();
    if (!sjson || !sjson.success || !sjson.response_id) throw new Error('Submit did not return success+response_id');
    console.log(`OK (response_id=${sjson.response_id})`);

    // 3) POST /api/fitness-interview/generate-plan
    process.stdout.write('3) Generate plan (this calls OpenAI) ... ');
    const gres = await fetch(`${BASE.replace(/\/$/, '')}/api/fitness-interview/generate-plan`, { method: 'POST', headers, body: JSON.stringify({ response_id: sjson.response_id }) });
    const gtxt = await gres.text();
    let gjson;
    try { gjson = JSON.parse(gtxt); } catch(e) { gjson = null; }
    if (!gres.ok) throw new Error(`Generate failed: ${gres.status} ${gres.statusText} ${gtxt.slice(0,200)}`);
    if (!gjson || !gjson.success || !gjson.plan_id) throw new Error(`Generate returned unexpected body: ${JSON.stringify(gjson).slice(0,200)}`);
    console.log(`OK (plan_id=${gjson.plan_id})`);

    console.log('\nSmoke tests passed ✅');
    process.exit(0);
  } catch (err) {
    console.error('\nSmoke tests failed ✖');
    console.error(err.message || err);
    process.exit(3);
  }
}

run();
