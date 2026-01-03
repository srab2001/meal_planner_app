# Workout Plan JSON Schema

Top-level keys required (AI must return JSON only):

- planSummary: object (short description, plan name, duration_weeks, sessions_per_week)
- weeklySchedule: array (ordered days mapping to sessionIds)
- sessions: array of session objects
- progressionRules: object (how progression is applied)
- substitutions: object (equipment substitutions)
- trackingFields: object (metrics to track like weight, reps, sessions)
- safetyNotes: array or string

Session object:
- sessionId: string
- title: string
- durationMinutes: number
- warmup: array of steps
- main: array of exercises
- cooldown: array of steps

Exercise item:
- name: string
- sets: number
- repsOrTime: string
- restSeconds: number
- notes: string

If the JSON returned by the AI does not conform to the above, the server returns error_code `invalid_plan_json`.
