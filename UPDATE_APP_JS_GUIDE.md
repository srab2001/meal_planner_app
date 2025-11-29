# Update App.js Guide

## 🎯 What Needs to Change

Your App.js needs significant updates to add the new ZIP code and store selection flow.

---

## 📝 Required Changes

### **1. Add New Imports (at the top)**

FIND this section:
```javascript
import LoginPage from './components/LoginPage';
import Questionnaire from './components/Questionnaire';
import MealPlan from './components/MealPlan';
```

ADD these two imports:
```javascript
import ZIPCodeInput from './components/ZIPCodeInput';
import StoreSelection from './components/StoreSelection';
```

So it becomes:
```javascript
import LoginPage from './components/LoginPage';
import ZIPCodeInput from './components/ZIPCodeInput';
import StoreSelection from './components/StoreSelection';
import Questionnaire from './components/Questionnaire';
import MealPlan from './components/MealPlan';
```

---

### **2. Add New State Variables**

FIND this section:
```javascript
const [currentStep, setCurrentStep] = useState('login');
```

ADD these new state variables right after:
```javascript
const [zipCode, setZipCode] = useState('');
const [stores, setStores] = useState([]);
const [selectedStore, setSelectedStore] = useState(null);
```

---

### **3. Change Initial Step**

FIND where you set the step after login (in checkAuth or handleLogin):
```javascript
setCurrentStep('questionnaire');
```

CHANGE to:
```javascript
setCurrentStep('zip');
```

---

### **4. Add New Handler Functions**

ADD these three new functions after your existing handlers:

```javascript
// NEW: Handle ZIP code submission
const handleZIPSubmit = ({ zipCode, stores }) => {
  setZipCode(zipCode);
  setStores(stores);
  setCurrentStep('store');
};

// NEW: Handle store selection
const handleStoreSelect = (store) => {
  setSelectedStore(store);
  setCurrentStep('questionnaire');
};

// NEW: Handle back to ZIP
const handleBackToZIP = () => {
  setCurrentStep('zip');
  setStores([]);
  setSelectedStore(null);
};
```

---

### **5. Update handleQuestionnaireSubmit**

FIND:
```javascript
body: JSON.stringify(prefs),
```

CHANGE to:
```javascript
body: JSON.stringify({
  ...prefs,
  zipCode,
  groceryStore: selectedStore
}),
```

---

### **6. Update handleStartOver**

FIND:
```javascript
const handleStartOver = () => {
  setCurrentStep('questionnaire');
  // ...
};
```

CHANGE to:
```javascript
const handleStartOver = () => {
  setCurrentStep('zip');
  setZipCode('');
  setStores([]);
  setSelectedStore(null);
  setPreferences(null);
  setMealPlan(null);
};
```

---

### **7. Add New JSX Sections**

FIND where you have:
```javascript
{currentStep === 'login' && (
  <LoginPage onLogin={handleLogin} />
)}

{currentStep === 'questionnaire' && (
  <Questionnaire ... />
)}
```

ADD these new sections BETWEEN login and questionnaire:

```javascript
{currentStep === 'zip' && (
  <ZIPCodeInput 
    onSubmit={handleZIPSubmit}
    user={user}
  />
)}

{currentStep === 'store' && (
  <StoreSelection
    stores={stores}
    zipCode={zipCode}
    onSubmit={handleStoreSelect}
    onBack={handleBackToZIP}
  />
)}
```

---

### **8. Update Questionnaire to Show Selected Store**

FIND:
```javascript
<Questionnaire 
  onSubmit={handleQuestionnaireSubmit}
  user={user}
/>
```

CHANGE to:
```javascript
<Questionnaire 
  onSubmit={handleQuestionnaireSubmit}
  user={user}
  selectedStore={selectedStore}
/>
```

---

### **9. Update MealPlan to Show Selected Store**

FIND:
```javascript
<MealPlan
  mealPlan={mealPlan}
  preferences={preferences}
  user={user}
  // ...
/>
```

ADD selectedStore prop:
```javascript
<MealPlan
  mealPlan={mealPlan}
  preferences={preferences}
  user={user}
  selectedStore={selectedStore}
  // ... other props
/>
```

---

## ✅ Complete Updated App.js Structure

Here's what your complete App.js should look like:

```javascript
import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import ZIPCodeInput from './components/ZIPCodeInput';        // NEW
import StoreSelection from './components/StoreSelection';    // NEW
import Questionnaire from './components/Questionnaire';
import MealPlan from './components/MealPlan';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('login');
  const [zipCode, setZipCode] = useState('');                // NEW
  const [stores, setStores] = useState([]);                  // NEW
  const [selectedStore, setSelectedStore] = useState(null);  // NEW
  const [preferences, setPreferences] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/auth/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setCurrentStep('zip');  // CHANGED from 'questionnaire'
      } else {
        setCurrentStep('login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setCurrentStep('login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST' });
    setUser(null);
    setCurrentStep('login');
    setZipCode('');           // NEW
    setStores([]);            // NEW
    setSelectedStore(null);   // NEW
    setPreferences(null);
    setMealPlan(null);
  };

  // NEW: Handle ZIP code submission
  const handleZIPSubmit = ({ zipCode, stores }) => {
    setZipCode(zipCode);
    setStores(stores);
    setCurrentStep('store');
  };

  // NEW: Handle store selection
  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setCurrentStep('questionnaire');
  };

  // NEW: Handle back to ZIP
  const handleBackToZIP = () => {
    setCurrentStep('zip');
    setStores([]);
    setSelectedStore(null);
  };

  const handleQuestionnaireSubmit = async (prefs) => {
    setPreferences(prefs);
    setCurrentStep('loading');

    try {
      const response = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...prefs,
          zipCode,              // NEW
          groceryStore: selectedStore  // NEW
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const data = await response.json();
      setMealPlan(data.mealPlan);
      setCurrentStep('mealplan');

    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Failed to generate meal plan. Please try again.');
      setCurrentStep('questionnaire');
    }
  };

  const handleRegenerateMeals = async (selectedMeals) => {
    try {
      const response = await fetch('/api/regenerate-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences,
          selectedMeals,
          zipCode,              // NEW
          groceryStore: selectedStore  // NEW
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate meals');
      }

      const data = await response.json();
      
      const updatedMealPlan = mealPlan.map((day) => {
        const updatedDay = { ...day };
        Object.keys(selectedMeals).forEach(mealKey => {
          if (selectedMeals[mealKey] && data.newMeals[mealKey]) {
            updatedDay[mealKey] = data.newMeals[mealKey];
          }
        });
        return updatedDay;
      });

      setMealPlan(updatedMealPlan);

    } catch (error) {
      console.error('Error regenerating meals:', error);
      alert('Failed to regenerate meals. Please try again.');
    }
  };

  const handleStartOver = () => {
    setCurrentStep('zip');  // CHANGED from 'questionnaire'
    setZipCode('');         // NEW
    setStores([]);          // NEW
    setSelectedStore(null); // NEW
    setPreferences(null);
    setMealPlan(null);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {currentStep === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {/* NEW SECTION */}
      {currentStep === 'zip' && (
        <ZIPCodeInput 
          onSubmit={handleZIPSubmit}
          user={user}
        />
      )}

      {/* NEW SECTION */}
      {currentStep === 'store' && (
        <StoreSelection
          stores={stores}
          zipCode={zipCode}
          onSubmit={handleStoreSelect}
          onBack={handleBackToZIP}
        />
      )}

      {currentStep === 'questionnaire' && (
        <Questionnaire 
          onSubmit={handleQuestionnaireSubmit}
          user={user}
          selectedStore={selectedStore}  // NEW prop
        />
      )}

      {currentStep === 'loading' && (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="spinner-large"></div>
            <h2>Creating Your Personalized Meal Plan...</h2>
            <p>This may take 20-30 seconds</p>
          </div>
        </div>
      )}

      {currentStep === 'mealplan' && (
        <MealPlan
          mealPlan={mealPlan}
          preferences={preferences}
          user={user}
          selectedStore={selectedStore}  // NEW prop
          onRegenerate={handleRegenerateMeals}
          onStartOver={handleStartOver}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
```

---

## 🧪 Testing After Update

1. Start backend: `npm start`
2. Start frontend: `cd client && npm start`
3. Login
4. Should see ZIP code page ✅
5. Enter ZIP → Store list appears ✅
6. Select store → Questionnaire appears ✅
7. Generate meal plan ✅

---

## 🐛 Common Issues

**Issue: "ZIPCodeInput is not defined"**
- Make sure you added the import at the top
- Check the file exists: `client/src/components/ZIPCodeInput.js`

**Issue: "stores is undefined"**
- Make sure you added the `useState` for stores
- Check the handleZIPSubmit function exists

**Issue: "Cannot read property 'name' of null"**
- Make sure selectedStore is initialized to null
- Check you're passing selectedStore as prop

---

## 📋 Quick Checklist

- [ ] Added ZIPCodeInput import
- [ ] Added StoreSelection import
- [ ] Added zipCode state
- [ ] Added stores state  
- [ ] Added selectedStore state
- [ ] Added handleZIPSubmit function
- [ ] Added handleStoreSelect function
- [ ] Added handleBackToZIP function
- [ ] Updated checkAuth to use 'zip'
- [ ] Updated handleQuestionnaireSubmit to send zipCode and groceryStore
- [ ] Updated handleStartOver to reset new state
- [ ] Added zip JSX section
- [ ] Added store JSX section
- [ ] Updated Questionnaire prop
- [ ] Updated MealPlan prop

---

**All changes needed for App.js!**
