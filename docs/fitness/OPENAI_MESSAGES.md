OpenAI Message Capture Test

Purpose
- Verify the server constructs the exact messages sent to the ChatGPT/OpenAI client for workout plan generation.

Test
- Location: test/integration/openai-messages.test.js
- What it does:
  - Stubs `services/openaiClient.generateChatCompletion` to capture `messages` passed by the server.
  - Runs `routes/fitness-interview`'s `generatePlanHandler` with a fake DB response.
  - Asserts:
    - `messages` is an array containing a `system` and a `user` message.
    - The `user` message includes the interview `response_json` keys & values (e.g., `main_goal`).
    - The server persists a plan after OpenAI returns valid JSON.

How to run
- From repo root:

```bash
node --test test/integration/openai-messages.test.js
```

Notes
- This is a unit/integration style test that avoids hitting the real OpenAI API by stubbing the openai client.
- If you want the test to assert exact prompt phrasing, we can tighten the assertions to look for specific sentences from the `planPromptBuilder`.
