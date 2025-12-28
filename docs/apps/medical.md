# Medical App Documentation

**Module:** /apps/medical
**Database:** CORE DB (Neon)
**Status:** Active

---

## Features

| Feature | Description |
|---------|-------------|
| Profile | DOB, height, weight, blood type |
| Allergies | Add/remove with severity levels |
| Conditions | Medical conditions with status |
| Constraints | Auto-computed from allergies + conditions |

---

## API Routes

### GET /api/core/medical/profile
Get user's medical profile with allergies, conditions, constraints.

### PUT /api/core/medical/profile
Update profile (DOB, height, weight, blood type).

### POST /api/core/medical/allergies
Add allergy. Recomputes constraints.

### DELETE /api/core/medical/allergies/:id
Remove allergy. Recomputes constraints.

### POST /api/core/medical/conditions
Add condition. Recomputes constraints.

### DELETE /api/core/medical/conditions/:id
Remove condition. Recomputes constraints.

### GET /api/core/medical/guardrails
Get computed constraints for meal/fitness generation.

---

## Constraint Computation

When allergies/conditions change, constraints are recomputed:

```javascript
async function recomputeConstraints(userId, profileId) {
  // Get all active conditions
  const conditions = await coreDb.medical_conditions.findMany({
    where: { medical_profile_id: profileId, status: 'active' }
  });

  // Get matching restriction rules
  const rules = await coreDb.restriction_rules.findMany({
    where: { condition: { in: conditions.map(c => c.condition) } }
  });

  // Create/update user constraints
  for (const rule of rules) {
    await coreDb.user_constraints.upsert({
      where: { user_id_constraint_key: { user_id: userId, constraint_key: rule.rule_key } },
      create: {
        user_id: userId,
        constraint_type: 'medical',
        constraint_key: rule.rule_key,
        value: rule.max_daily_value ? `${rule.max_daily_value}${rule.unit}` : null,
        is_active: true
      },
      update: { is_active: true }
    });
  }

  // Add allergy constraints
  const allergies = await coreDb.allergies.findMany({
    where: { medical_profile_id: profileId }
  });

  for (const allergy of allergies) {
    await coreDb.user_constraints.upsert({
      where: { user_id_constraint_key: { user_id: userId, constraint_key: `no_${allergy.allergen}` } },
      create: {
        user_id: userId,
        constraint_type: 'dietary',
        constraint_key: `no_${allergy.allergen}`,
        is_active: true
      },
      update: { is_active: true }
    });
  }
}
```

---

## Pre-seeded Restriction Rules

| Rule Key | Condition | Restriction | Max Value |
|----------|-----------|-------------|-----------|
| diabetes_sugar | diabetes | sugar | 25g/day |
| diabetes_carbs | diabetes | carbohydrates | 130g/day |
| hypertension_sodium | hypertension | sodium | 1500mg/day |
| celiac_gluten | celiac | gluten | 0mg/day |
| kidney_potassium | kidney_disease | potassium | 2000mg/day |
| heart_cholesterol | heart_disease | cholesterol | 200mg/day |

---

**Version:** 1.0
