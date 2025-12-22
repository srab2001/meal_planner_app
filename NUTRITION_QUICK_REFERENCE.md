# Nutrition Integration - Quick Reference

**Status:** ✅ Live  
**Endpoints:** 3 read-only  
**Authentication:** JWT required  

---

## 🔌 Endpoints

### 1. Today's Nutrition
```
GET /api/nutrition/summary?date=2025-12-21
→ { totalCalories, protein, carbs, fats, meals[] }
```

### 2. Weekly Trends  
```
GET /api/nutrition/weekly
→ { days[], averageCalories, averageProtein }
```

### 3. Macro Targets
```
GET /api/nutrition/macro-targets
→ { dailyCalories, proteinGrams, carbGrams, fatGrams }
```

---

## 📊 Response Fields

| Field | Example | Use |
|-------|---------|-----|
| totalCalories | 2100 | Daily intake |
| protein | 150 | Protein grams |
| carbs | 250 | Carbs grams |
| fats | 70 | Fats grams |
| meals[] | [...] | Meal breakdown |
| averageCalories | 2050 | 7-day average |
| dailyCalories | 2200 | Target calories |

---

## 💡 Usage

```javascript
// Fetch nutrition
const token = localStorage.getItem('token');
const res = await fetch('/api/nutrition/summary', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const nutrition = await res.json();

// Display
<div>
  <h2>{nutrition.totalCalories} cal</h2>
  <p>{nutrition.protein}g protein</p>
</div>
```

---

## 🔒 Rules

✅ **Allowed:** Read meal data, display nutrition, calculate trends
❌ **Not allowed:** Create meals, edit meals, delete meals

---

## 📁 Files

- **Routes:** `/routes/nutrition.js` (470+ lines)
- **Docs:** `/NUTRITION_INTEGRATION.md` (comprehensive)
- **Server:** `/server.js` (updated with imports)

---

## 🧪 Test

```bash
curl -X GET "http://localhost:3001/api/nutrition/summary" \
  -H "Authorization: Bearer TOKEN"
```

**Expected:** 200 OK with nutrition data

---

**Ready to use in fitness dashboard!** 🚀
