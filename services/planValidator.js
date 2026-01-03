const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const schema = require('./planSchema.json');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

function validatePlanJson(plan) {
  const valid = validate(plan);
  if (valid) return { valid: true, errors: [] };
  const errors = (validate.errors || []).map(e => `${e.instancePath || '/'} ${e.message}`);
  return { valid: false, errors };
}

module.exports = { validatePlanJson };
