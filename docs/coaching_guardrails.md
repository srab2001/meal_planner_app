# Coaching Module Guardrails

## Overview

The ASR Health Portal AI Coach includes safety guardrails to prevent providing medical advice, diagnoses, or treatment recommendations. This document outlines these protections.

## Core Principles

1. **No Diagnosis** - Never diagnose medical conditions
2. **No Treatment Claims** - Never recommend treatments for medical conditions
3. **Professional Referral** - Always direct users to healthcare providers for medical concerns
4. **Transparency** - Be clear about AI limitations

## Trigger Categories

### 1. Medical Conditions

The following conditions trigger guardrail responses:

| Category | Examples |
|----------|----------|
| Metabolic | diabetes, thyroid disorders |
| Cardiovascular | heart disease, hypertension |
| Mental Health | depression, anxiety disorder, bipolar |
| Digestive | crohn's, colitis, IBS, celiac |
| Autoimmune | lupus, MS, arthritis |
| Neurological | parkinson's, alzheimer's, epilepsy |
| Eating Disorders | anorexia, bulimia |
| Cancer | cancer, tumor |
| Respiratory | asthma, COPD |

### 2. Treatment-Seeking Language

Phrases that indicate medical treatment seeking:

- "treat my [condition]"
- "cure my [condition]"
- "medication for"
- "prescribe"
- "dosage"
- "should I take"
- "diagnose"
- "do I have"
- "symptoms of"

### 3. Professional Replacement

Attempts to replace professional care:

- "instead of doctor"
- "instead of medication"
- "replace my medicine"
- "stop taking [medication]"
- "alternative to prescription"

## Guardrail Logic

```javascript
// Pseudocode for guardrail checking
function checkGuardrails(message) {
  const hasCondition = conditions.some(c => message.includes(c));
  const hasTreatment = treatments.some(t => message.includes(t));
  const hasProfessionalReplacement = professional.some(p => message.includes(p));
  
  if (hasCondition && hasTreatment) {
    return TRIGGERED - "medical_treatment_request"
  }
  
  if (hasProfessionalReplacement) {
    return TRIGGERED - "replacing_professional_care"
  }
  
  if (message.includes("diagnose") || message.includes("do i have")) {
    return TRIGGERED - "diagnosis_request"
  }
  
  return NOT_TRIGGERED
}
```

## Standard Safety Response

When guardrails are triggered, the coach responds with:

```
I appreciate you sharing this with me, but I need to be clear about my limitations. 🩺

**I'm not able to provide:**
- Medical diagnoses
- Treatment recommendations for medical conditions
- Advice that replaces professional healthcare

**What I recommend:**
- Please consult with a qualified healthcare provider about [condition]
- If this is urgent, please contact your doctor or visit urgent care
- For emergencies, call 911 or go to your nearest emergency room

**How I CAN help:**
- General wellness and nutrition tips
- Healthy lifestyle habits
- Motivation and goal-setting
- Meal planning guidance

Would you like to discuss any of these areas instead?
```

## Audit Logging

All guardrail triggers are logged:

```javascript
auditLogger.log({
  category: 'SECURITY',
  action: 'guardrail_triggered',
  level: 'WARNING',
  details: {
    reason: 'medical_treatment_request',
    condition: 'diabetes',
    pattern: 'treat my'
  }
});
```

## What the Coach CAN Help With

### ✅ Safe Topics

| Topic | Example Interaction |
|-------|---------------------|
| Meal Planning | "Can you suggest healthy lunch ideas?" |
| Nutrition Basics | "How can I eat more vegetables?" |
| Goal Setting | "Help me set a realistic fitness goal" |
| Motivation | "I'm struggling to stay on track" |
| Sleep Hygiene | "Tips for better sleep" |
| Stress Management | "How can I manage stress better?" |
| General Wellness | "How can I improve my energy levels?" |
| Habit Building | "Help me build a morning routine" |

### 🚫 Unsafe Topics (Triggers Guardrail)

| Topic | Example That Triggers |
|-------|----------------------|
| Diagnosis | "Do I have diabetes?" |
| Treatment | "Treat my high blood pressure with diet" |
| Medication | "What's the dosage for vitamin D?" |
| Replacing Doctors | "Can you help instead of my doctor?" |
| Symptoms | "What are the symptoms of heart disease?" |

## Edge Cases

### Allowed: General Diabetes-Friendly Tips
- ❌ "Treat my diabetes" → BLOCKED
- ✅ "What are some low-sugar meal ideas?" → ALLOWED

### Allowed: Lifestyle Improvement
- ❌ "Cure my depression" → BLOCKED
- ✅ "I've been feeling down, help me build healthy habits" → ALLOWED (with care)

### Allowed: Discussing Health Goals
- ❌ "Diagnose why I'm tired" → BLOCKED
- ✅ "I want more energy, what lifestyle changes help?" → ALLOWED

## Implementation Files

- `CoachingChat.js` - Main chat component with guardrail checking
- `MEDICAL_GUARDRAILS` constant - Pattern definitions
- `checkMedicalGuardrails()` - Validation function
- `getMedicalSafetyResponse()` - Safe response generator

## Testing Guardrails

### Test Cases

```javascript
// Should trigger
checkMedicalGuardrails("treat my diabetes with diet")
// → { triggered: true, reason: 'medical_treatment_request' }

checkMedicalGuardrails("do i have cancer")
// → { triggered: true, reason: 'diagnosis_request' }

// Should NOT trigger
checkMedicalGuardrails("swap one dinner for fish")
// → { triggered: false }

checkMedicalGuardrails("help me eat healthier")
// → { triggered: false }
```

## Legal Disclaimer

The ASR Health Portal AI Coach is designed for general wellness coaching and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

## Future Enhancements

1. **ML-based detection** - Semantic understanding vs keyword matching
2. **Escalation paths** - Connect users to mental health resources
3. **Configurable thresholds** - Admin control over sensitivity
4. **Multi-language support** - Guardrails in other languages
5. **Audit reports** - Dashboard of guardrail triggers
