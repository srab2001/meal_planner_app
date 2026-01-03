Fitness Interview — QA Checklist

Purpose
- Provide concise steps for manual testing the new AI Interview flow and what to verify visually and functionally.

Quick start
1. Start the dev server or serve the `client/build` output and sign in as a test user.
2. Open the Fitness module and start the Interview flow: `Fitness -> Start Interview`.

Flow to test (compact)
- Per-question screens: ensure one question per screen with Back / Next buttons and progress dots.
- Injuries screen:
  - Enter injury details in the text area.
  - Toggle "Low impact only" ON and OFF.
  - Verify the toggle state appears on the Review screen.
- Training style:
  - Use the select field and ensure options come from server.
- Review screen:
  - Confirm labels and values match what was entered.
  - Press "Edit Answers" to return to the beginning.
- Generate:
  - Click "Generate Workout Plan" and observe the Generating screen.
  - After generation, the app should redirect to `/fitness?plan_id=<id>` and the plan should display.

Payload and API checks
- GET /api/fitness-interview/questions — should return enabled questions (key,label,input_type,options)
- POST /api/fitness-interview/submit
  - Body: { session_id, response_json }
  - response_json should contain keys matching question keys (e.g., injuries, training_style) and low_impact when toggled
- POST /api/fitness-interview/generate-plan
  - Body: { response_id }
  - Server should store a plan and return { success: true, plan_id }

Visual checks (wireframe match)
- Buttons: Primary CTAs are large, rounded, with gradient background and subtle shadow.
- Toggle: rounded pill track with white knob (checked color is purple gradient).
- Progress dots: centered, active dot highlighted in purple.
- Injuries textarea: tall, rounded, subtle inner shadow.

Notes
- Integration tests already cover message construction sent to OpenAI and the basic interview -> generate flow (mocked OpenAI). Run tests with:

```bash
node --test test/integration/*.test.js
```

- If you need pixel-perfect styling, provide exact measurements and I will adjust CSS accordingly.
