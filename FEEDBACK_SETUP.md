# Feedback Button Setup Guide

## ✅ What's Been Added

A **"💬 Send Feedback"** button has been added to the meal plan page header. When users click it, they'll be taken to a Google Form to submit feedback.

Button appears in the top-right of the meal plan page, between "Print All Recipes" and "Start Over".

---

## 📋 How to Set Up Your Google Form

### Step 1: Create Google Form

1. Go to https://forms.google.com
2. Click **"+ Blank"** to create a new form
3. Name it: "Meal Planner Feedback"

### Step 2: Add Questions

**Suggested questions:**

1. **Rating** (Multiple choice - required)
   - Question: "How would you rate your experience?"
   - Options: Excellent, Good, Fair, Poor

2. **Feedback** (Paragraph - required)
   - Question: "What did you like or dislike about the meal planner?"

3. **Specific Feature** (Checkboxes - optional)
   - Question: "Which features did you use?" (Select all that apply)
   - Options:
     - ZIP code store finder
     - Meal plan generation
     - Shopping list
     - Recipe printing
     - Meal regeneration
     - Discount code

4. **Improvements** (Paragraph - optional)
   - Question: "What improvements would you suggest?"

5. **Email** (Short answer - optional)
   - Question: "Email (optional - if you'd like us to follow up)"

6. **Would Recommend?** (Multiple choice - optional)
   - Question: "Would you recommend this to a friend?"
   - Options: Yes, Maybe, No

### Step 3: Get Your Form Link

1. Click **"Send"** button (top-right of form editor)
2. Click the **link icon** (🔗) at the top
3. Check **"Shorten URL"** box
4. Click **"Copy"**
5. Your link will look like: `https://forms.gle/ABC123xyz`

### Step 4: Update the Code

Open this file: `client/src/components/MealPlanView.js`

Find line 89 (around line 89):
```javascript
const feedbackURL = 'https://forms.gle/YOUR-FORM-ID-HERE';
```

Replace with your actual form URL:
```javascript
const feedbackURL = 'https://forms.gle/ABC123xyz';
```

### Step 5: Deploy

1. Commit the change:
   ```bash
   git add client/src/components/MealPlanView.js
   git commit -m "update: add Google Form URL for feedback"
   git push
   ```

2. Merge PR to main
3. Deploy to production

---

## 📊 Viewing Responses

### In Google Forms:
1. Go to your form at https://forms.google.com
2. Click the **"Responses"** tab
3. View individual responses or summary charts
4. Click **"View in Sheets"** to export to Google Sheets

### Getting Notifications:
1. In your form, click the three dots (⋮) → **"Get email notifications for new responses"**
2. You'll get an email every time someone submits feedback

---

## 🎨 Button Styling

The feedback button is **orange** to make it stand out:
- Color: Orange (#ff9800)
- Hover effect: Lifts up slightly
- Icon: 💬 (speech bubble)

---

## 💡 Tips

### For Better Responses:
- Keep form short (5-7 questions max)
- Make only critical questions required
- Use a mix of rating scales and open-ended questions
- Test the form yourself first

### Sample Thank You Message:
After form submission, customize the confirmation message:
1. In form editor: Settings (⚙️) → Presentation
2. Check "Show link to submit another response" (if wanted)
3. Confirmation message:
   > "Thanks for your feedback! Your input helps us improve the meal planner. 🎉"

### Track Testers:
Add a hidden field to track discount code:
1. Add a "Short answer" question: "How did you access the app?"
2. Make it optional
3. Users can enter: "TESTFREE code" or leave blank

---

## 🚀 Advanced: Add Form to Other Pages

If you want feedback button on other pages:

**Questionnaire Page:**
Add to `client/src/components/Questionnaire.js` header:
```javascript
<button onClick={() => window.open('YOUR-FORM-URL', '_blank')} className="feedback-btn">
  💬 Feedback
</button>
```

**Payment Page:**
Already has logout button in header - can add feedback there too

---

## 📱 Mobile Friendly

The button automatically adapts to mobile screens:
- Stacks vertically on narrow screens
- Touch-friendly button size
- Opens form in new tab for easy switching

---

## ✅ Testing

After deploying:
1. Generate a meal plan
2. Look for **"💬 Send Feedback"** button in header
3. Click it
4. Should open your Google Form in new tab
5. Submit test response
6. Check that response appears in Google Forms

---

**Questions?** The feedback button is fully integrated and ready to use once you add your Google Form URL!
