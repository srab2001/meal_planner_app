import React, { useState, useEffect } from 'react';
import './Questionnaire.css';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

const DAYS_OF_WEEK = [
  { id: 'Monday', icon: '📅', label: 'Monday' },
  { id: 'Tuesday', icon: '📅', label: 'Tuesday' },
  { id: 'Wednesday', icon: '📅', label: 'Wednesday' },
  { id: 'Thursday', icon: '📅', label: 'Thursday' },
  { id: 'Friday', icon: '📅', label: 'Friday' },
  { id: 'Saturday', icon: '🎉', label: 'Saturday' },
  { id: 'Sunday', icon: '🎉', label: 'Sunday' }
];

// Emoji icons for dietary preferences
const DIETARY_ICONS = {
  diabetic: '🩺',
  dairyFree: '🥛',
  glutenFree: '🌾',
  peanutFree: '🥜',
  vegetarian: '🥗',
  kosher: '✡️',
  vegan: '🌱',
  lowCarb: '🥬',
  keto: '🥑',
  paleo: '🦴'
};

function Questionnaire({ user, onSubmit, onLogout, selectedStores }) {
  // Wizard step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Dynamic options loaded from API
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [dietaryOptionsData, setDietaryOptionsData] = useState([]);

  // User selections
  const [cuisines, setCuisines] = useState([]);
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [meals, setMeals] = useState({
    breakfast: false,
    lunch: false,
    dinner: false
  });
  const [selectedDays, setSelectedDays] = useState({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: true
  });
  const [dietaryPreferences, setDietaryPreferences] = useState({});
  const [leftovers, setLeftovers] = useState(['']);
  const [specialOccasion, setSpecialOccasion] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  // Load cuisine and dietary options from API on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Load cuisines
        const cuisinesResponse = await fetch(`${API_BASE}/api/cuisines`);
        if (cuisinesResponse.ok) {
          const cuisinesData = await cuisinesResponse.json();
          setCuisineOptions(cuisinesData.cuisines.map(c => c.name));
        }

        // Load dietary options
        const dietaryResponse = await fetch(`${API_BASE}/api/dietary-options`);
        if (dietaryResponse.ok) {
          const dietaryData = await dietaryResponse.json();
          setDietaryOptionsData(dietaryData.options);

          // Initialize dietary preferences state with all options set to false
          const initialDietaryState = {};
          dietaryData.options.forEach(option => {
            initialDietaryState[option.key] = false;
          });
          setDietaryPreferences(initialDietaryState);
        }
      } catch (error) {
        console.error('Error loading options:', error);
        // Fail silently - will use empty arrays
      }
    };

    loadOptions();
  }, []);

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}/api/user/preferences`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });

        if (response.ok) {
          const data = await response.json();
          const prefs = data.preferences;

          if (prefs) {
            // Pre-fill cuisines
            if (prefs.default_cuisines && prefs.default_cuisines.length > 0) {
              setCuisines(prefs.default_cuisines);
            }

            // Pre-fill number of people
            if (prefs.default_people) {
              setNumberOfPeople(prefs.default_people);
            }

            // Pre-fill meals (convert array to object)
            if (prefs.default_meals && prefs.default_meals.length > 0) {
              const mealsObj = {
                breakfast: prefs.default_meals.includes('breakfast'),
                lunch: prefs.default_meals.includes('lunch'),
                dinner: prefs.default_meals.includes('dinner')
              };
              setMeals(mealsObj);
            }

            // Pre-fill days (convert array to object)
            if (prefs.default_days && prefs.default_days.length > 0) {
              const daysObj = {
                Monday: prefs.default_days.includes('Monday'),
                Tuesday: prefs.default_days.includes('Tuesday'),
                Wednesday: prefs.default_days.includes('Wednesday'),
                Thursday: prefs.default_days.includes('Thursday'),
                Friday: prefs.default_days.includes('Friday'),
                Saturday: prefs.default_days.includes('Saturday'),
                Sunday: prefs.default_days.includes('Sunday')
              };
              setSelectedDays(daysObj);
            }

            // Pre-fill dietary preferences (convert array to object)
            if (prefs.default_dietary && prefs.default_dietary.length > 0) {
              setDietaryPreferences(prev => {
                const updated = {...prev};
                prefs.default_dietary.forEach(key => {
                  if (key in updated) {
                    updated[key] = true;
                  }
                });
                return updated;
              });
            }

            console.log('✅ Preferences loaded and applied');
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        // Fail silently - user can still fill out the form manually
      } finally {
        setLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, []);

  const toggleCuisine = (cuisine) => {
    setCuisines(prev => {
      if (prev.includes(cuisine)) {
        return prev.filter(c => c !== cuisine);
      } else {
        return [...prev, cuisine];
      }
    });
  };

  const toggleMeal = (mealType) => {
    setMeals(prev => ({
      ...prev,
      [mealType]: !prev[mealType]
    }));
  };

  const toggleDay = (day) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const toggleDietaryPreference = (preference) => {
    setDietaryPreferences(prev => ({
      ...prev,
      [preference]: !prev[preference]
    }));
  };

  const handleAddLeftoverField = () => {
    setLeftovers([...leftovers, '']);
  };

  const handleLeftoverChange = (index, value) => {
    const newLeftovers = [...leftovers];
    newLeftovers[index] = value;
    setLeftovers(newLeftovers);
  };

  const handleRemoveLeftoverField = (index) => {
    const newLeftovers = leftovers.filter((_, i) => i !== index);
    setLeftovers(newLeftovers.length === 0 ? [''] : newLeftovers);
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (cuisines.length === 0) {
        newErrors.cuisines = 'Please select at least one cuisine';
      }
    } else if (step === 5) {
      if (!meals.breakfast && !meals.lunch && !meals.dinner) {
        newErrors.meals = 'Please select at least one meal type';
      }
    } else if (step === 6) {
      const hasSelectedDay = Object.values(selectedDays).some(day => day === true);
      if (!hasSelectedDay) {
        newErrors.days = 'Please select at least one day';
      }
    }
    // Steps 2, 3, 4 are optional or always valid

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(totalSteps, prev + 1));
      setErrors({});
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    setErrors({});
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      const selectedMeals = Object.keys(meals).filter(meal => meals[meal]);
      const selectedDietaryPreferences = Object.keys(dietaryPreferences).filter(pref => dietaryPreferences[pref]);
      const daysArray = Object.keys(selectedDays).filter(day => selectedDays[day]);
      const leftoverIngredients = leftovers.filter(item => item.trim() !== '');

      console.log('📅 Selected days being submitted:', daysArray);
      console.log('🍽️ Selected meals being submitted:', selectedMeals);

      onSubmit({
        cuisines,
        people: numberOfPeople,
        selectedMeals: selectedMeals,  // Send array of meal types: ['breakfast', 'lunch', 'dinner']
        selectedDays: daysArray,  // Send array of days: ['Monday', 'Tuesday', etc.]
        dietaryPreferences: selectedDietaryPreferences,  // Send array: ['diabetic', 'dairyFree', etc.]
        leftovers: leftoverIngredients,  // Send array of leftover ingredients
        specialOccasion: specialOccasion  // Include special occasion flag
      });
    }
  };

  const getStepTitle = () => {
    switch(currentStep) {
      case 1: return 'What cuisines do you enjoy?';
      case 2: return 'How many people are you feeding?';
      case 3: return 'Got leftovers or ingredients to use up?';
      case 4: return 'Any dietary restrictions?';
      case 5: return 'Which meals do you need?';
      case 6: return 'Which days do you want to plan for?';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch(currentStep) {
      case 1: return 'Select all that apply';
      case 2: return 'We\'ll adjust portions accordingly';
      case 3: return 'Add ingredients you\'d like to incorporate into your meals (optional)';
      case 4: return 'Select all that apply (optional)';
      case 5: return 'Select all that apply';
      case 6: return 'Select the days you need meal plans for';
      default: return '';
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <>
            <div className="cuisine-grid">
              {cuisineOptions.map(cuisine => (
                <button
                  key={cuisine}
                  className={`cuisine-chip ${cuisines.includes(cuisine) ? 'selected' : ''}`}
                  onClick={() => toggleCuisine(cuisine)}
                >
                  {cuisine}
                </button>
              ))}
            </div>
            {errors.cuisines && <p className="error">{errors.cuisines}</p>}
          </>
        );

      case 2:
        return (
          <div className="number-selector">
            <button
              className="number-btn"
              onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
            >
              −
            </button>
            <span className="number-display">{numberOfPeople}</span>
            <button
              className="number-btn"
              onClick={() => setNumberOfPeople(Math.min(12, numberOfPeople + 1))}
            >
              +
            </button>
          </div>
        );

      case 3:
        return (
          <>
            <div className="leftovers-inputs">
              {leftovers.map((item, index) => (
                <div key={index} className="leftover-input-row">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleLeftoverChange(index, e.target.value)}
                    placeholder="e.g., 'chicken', 'broccoli', 'rice'"
                    className="leftover-input"
                  />
                  {leftovers.length > 1 && (
                    <button
                      onClick={() => handleRemoveLeftoverField(index)}
                      className="remove-leftover-btn"
                      title="Remove this ingredient"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={handleAddLeftoverField} className="add-leftover-btn">
              + Add Another Ingredient
            </button>
          </>
        );

      case 4:
        return (
          <div className="meal-checkboxes">
            {dietaryOptionsData.map(option => (
              <label key={option.key} className={`meal-checkbox ${dietaryPreferences[option.key] ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={dietaryPreferences[option.key] || false}
                  onChange={() => toggleDietaryPreference(option.key)}
                />
                <span className="meal-icon">{DIETARY_ICONS[option.key] || '🍽️'}</span>
                <span className="meal-name">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 5:
        return (
          <>
            <div className="meal-checkboxes">
              <label className={`meal-checkbox ${meals.breakfast ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={meals.breakfast}
                  onChange={() => toggleMeal('breakfast')}
                />
                <span className="meal-icon">🌅</span>
                <span className="meal-name">Breakfast</span>
              </label>

              <label className={`meal-checkbox ${meals.lunch ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={meals.lunch}
                  onChange={() => toggleMeal('lunch')}
                />
                <span className="meal-icon">☀️</span>
                <span className="meal-name">Lunch</span>
              </label>

              <label className={`meal-checkbox ${meals.dinner ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={meals.dinner}
                  onChange={() => toggleMeal('dinner')}
                />
                <span className="meal-icon">🌙</span>
                <span className="meal-name">Dinner</span>
              </label>
            </div>

            {/* Special Occasion Meal Toggle */}
            <div className="special-occasion-section">
              <label className={`special-occasion-toggle ${specialOccasion ? 'active' : ''}`}>
                <input
                  type="checkbox"
                  checked={specialOccasion}
                  onChange={() => setSpecialOccasion(!specialOccasion)}
                />
                <div className="special-occasion-content">
                  <span className="special-occasion-icon">✨</span>
                  <div className="special-occasion-text">
                    <h4>Add a Special Occasion Meal</h4>
                    <p className="special-occasion-desc">
                      Elevate your week with a premium restaurant-quality meal featuring gourmet ingredients from Whole Foods and elevated serving suggestions.
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {errors.meals && <p className="error">{errors.meals}</p>}
          </>
        );

      case 6:
        return (
          <>
            <div className="days-checkboxes">
              {DAYS_OF_WEEK.map((day) => (
                <label key={day.id} className={`meal-checkbox ${selectedDays[day.id] ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedDays[day.id]}
                    onChange={() => toggleDay(day.id)}
                  />
                  <span className="meal-icon">{day.icon}</span>
                  <span className="meal-name">{day.label}</span>
                </label>
              ))}
            </div>
            {errors.days && <p className="error">{errors.days}</p>}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="questionnaire-page">
      <nav className="navbar">
        <h2>AI Meal Planner</h2>
        <div className="user-info">
          <img src={user.picture} alt={user.name} className="user-avatar" />
          <span>{user.name}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="questionnaire-container">
        <h1>Let's Create Your Meal Plan</h1>
        <p className="subtitle">Step {currentStep} of {totalSteps}</p>

        {/* Progress bar */}
        <div className="progress-bar-container">
          <div className="progress-bar" style={{width: `${(currentStep / totalSteps) * 100}%`}}></div>
        </div>

        <div className="question-section wizard-step">
          <h3>{getStepTitle()}</h3>
          <p className="hint">{getStepSubtitle()}</p>
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="wizard-navigation">
          {currentStep > 1 && (
            <button className="wizard-btn wizard-back" onClick={handleBack}>
              ← Back
            </button>
          )}

          {currentStep < totalSteps ? (
            <button className="wizard-btn wizard-next" onClick={handleNext}>
              Next →
            </button>
          ) : (
            <button className="wizard-btn generate-btn" onClick={handleSubmit}>
              Generate My Meal Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Questionnaire;
