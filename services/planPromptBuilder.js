/**
 * Build system and user messages for workout plan generation
 */
function buildSystemMessage() {
  return `You are an expert fitness coach. You MUST return JSON ONLY (no prose, no markdown, no code fences). Use the planning rules exactly as provided. Each session must not exceed the user's time limit. Respect injuries and prefer low-impact alternatives when necessary. Use goal to set focus and weekly split. Use targetDate to set progression pace (if null, use steady progression). Use starting volume/intensity appropriate to fitness level. Avoid progressions that exceed user's current level. Only include exercises appropriate to the user's location/equipment. Provide substitutes when equipment is missing. Remove movements that match the user's pain/injury list. Include warm-up and mobility blocks tied to limits. Output a single JSON object with keys: planSummary, weeklySchedule, sessions, progressionRules, substitutions, trackingFields, safetyNotes. Each session must include sessionId, title, durationMinutes, warmup (array), main (array of exercises), cooldown (array). Exercises must include name, sets, repsOrTime, restSeconds, notes.`;
}

function buildUserMessage({ responseJson, derived }) {
  // derived: { targetDate, equipmentAssumptions, lowImpactFlag }
  let msg = `User interview responses (JSON):\n${JSON.stringify(responseJson)}\n\nDerived fields:\n${JSON.stringify(derived)}\n\n`;

  // If the client requested a spreadsheet output, instruct the model to include a CSV string
  const additional = responseJson && responseJson._additional_context;
  if (additional && additional.desired_output === 'spreadsheet') {
    msg += `CRITICAL: The user requested the output formatted for a spreadsheet. In addition to the JSON schema, include a top-level key named \"spreadsheet_csv\" whose value is a CSV string representing a table of exercises (columns: session,title,durationMinutes,exercise_name,sets,repsOrTime,restSeconds,notes). Also ensure the main JSON still conforms to the schema.\n\n`;
  }

  msg += `CRITICAL: Return VALID JSON only that conforms to the schema provided by the system. Do not include any additional keys at the top-level beyond the specified schema.`;
  return msg;
}

module.exports = { buildSystemMessage, buildUserMessage };
