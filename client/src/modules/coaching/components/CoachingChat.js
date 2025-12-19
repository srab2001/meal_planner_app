import React, { useState, useEffect, useRef } from 'react';
import { API_BASE, fetchWithAuth } from '../../../shared/utils/api';
import auditLogger from '../../../shared/services/AuditLogger';
import './CoachingChat.css';

/**
 * CoachingChat - AI-powered coaching chat interface
 * 
 * Features:
 * - Real-time AI coaching conversation
 * - Context-aware responses based on user data
 * - Suggested prompts for quick interactions
 * - Message history persistence
 * - MEDICAL GUARDRAILS: No diagnosis, no treatment claims
 */

// Medical guardrails - patterns that trigger safety response
const MEDICAL_GUARDRAILS = {
  // Conditions that require professional care
  conditions: [
    'diabetes', 'diabetic', 'cancer', 'tumor', 'heart disease', 'hypertension',
    'depression', 'anxiety disorder', 'bipolar', 'schizophrenia', 'anorexia',
    'bulimia', 'eating disorder', 'arthritis', 'asthma', 'copd', 'kidney disease',
    'liver disease', 'thyroid', 'hypothyroid', 'hyperthyroid', 'celiac',
    'crohn', 'colitis', 'ibs', 'fibromyalgia', 'lupus', 'ms', 'multiple sclerosis',
    'parkinson', 'alzheimer', 'dementia', 'epilepsy', 'seizure'
  ],
  // Treatment-seeking language
  treatments: [
    'treat my', 'cure my', 'heal my', 'fix my', 'prescribe', 'medication for',
    'medicine for', 'drug for', 'remedy for', 'therapy for', 'what pill',
    'should i take', 'dosage', 'how much should i take', 'treatment for',
    'diagnose', 'diagnosis', 'do i have', 'am i sick', 'is this serious',
    'emergency', 'symptom of', 'symptoms of'
  ],
  // Medical professional language
  professional: [
    'instead of doctor', 'instead of medication', 'replace my medicine',
    'stop taking', 'quit my medication', 'alternative to prescription'
  ]
};

// Check if message triggers medical guardrails
const checkMedicalGuardrails = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Check for condition + treatment combination
  const hasCondition = MEDICAL_GUARDRAILS.conditions.some(c => lowerMessage.includes(c));
  const hasTreatment = MEDICAL_GUARDRAILS.treatments.some(t => lowerMessage.includes(t));
  const hasProfessional = MEDICAL_GUARDRAILS.professional.some(p => lowerMessage.includes(p));
  
  if (hasCondition && hasTreatment) {
    return {
      triggered: true,
      reason: 'medical_treatment_request',
      condition: MEDICAL_GUARDRAILS.conditions.find(c => lowerMessage.includes(c)),
      treatment: MEDICAL_GUARDRAILS.treatments.find(t => lowerMessage.includes(t))
    };
  }
  
  if (hasProfessional) {
    return {
      triggered: true,
      reason: 'replacing_professional_care',
      pattern: MEDICAL_GUARDRAILS.professional.find(p => lowerMessage.includes(p))
    };
  }
  
  // Check for explicit diagnosis requests
  if (lowerMessage.includes('do i have') || lowerMessage.includes('diagnose')) {
    return {
      triggered: true,
      reason: 'diagnosis_request'
    };
  }
  
  return { triggered: false };
};

// Safe response when guardrails are triggered
const getMedicalSafetyResponse = (guardrailResult) => {
  const baseResponse = `I appreciate you sharing this with me, but I need to be clear about my limitations. 🩺

**I'm not able to provide:**
- Medical diagnoses
- Treatment recommendations for medical conditions
- Advice that replaces professional healthcare

**What I recommend:**
- Please consult with a qualified healthcare provider about ${guardrailResult.condition || 'your health concerns'}
- If this is urgent, please contact your doctor or visit an urgent care facility
- For emergencies, call 911 or go to your nearest emergency room

**How I CAN help:**
- General wellness and nutrition tips
- Healthy lifestyle habits
- Motivation and goal-setting
- Meal planning guidance

Would you like to discuss any of these areas instead? I'm here to support your overall wellness journey! 💪`;

  return baseResponse;
};

export default function CoachingChat({
  user,
  healthScore,
  mealPlanData,
  nutritionData
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggested prompts
  const suggestions = [
    { icon: '🎯', text: 'Help me set a realistic health goal' },
    { icon: '🍽️', text: 'How can I improve my eating habits?' },
    { icon: '💪', text: 'I need motivation to stay on track' },
    { icon: '📊', text: 'Analyze my health score and give tips' },
    { icon: '🥗', text: 'Suggest healthy meal ideas' },
    { icon: '😴', text: 'Tips for better sleep and recovery' }
  ];

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from localStorage
  const loadChatHistory = () => {
    try {
      const history = localStorage.getItem('coaching_chat_history');
      if (history) {
        const parsed = JSON.parse(history);
        // Only load recent messages (last 50)
        const recent = parsed.slice(-50);
        setMessages(recent);
        if (recent.length > 0) {
          setShowSuggestions(false);
        }
      } else {
        // Add welcome message
        addWelcomeMessage();
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
      addWelcomeMessage();
    }
  };

  // Add welcome message
  const addWelcomeMessage = () => {
    const welcomeMessage = {
      id: Date.now(),
      role: 'coach',
      content: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your AI Health Coach. I'm here to help you reach your wellness goals, answer nutrition questions, and provide personalized guidance. What would you like to work on today?`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  };

  // Save chat history to localStorage
  const saveChatHistory = (newMessages) => {
    try {
      // Keep only last 100 messages
      const toSave = newMessages.slice(-100);
      localStorage.setItem('coaching_chat_history', JSON.stringify(toSave));
    } catch (err) {
      console.error('Error saving chat history:', err);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle sending a message
  const handleSend = async (messageText = inputValue) => {
    if (!messageText.trim() || isLoading) return;

    setShowSuggestions(false);
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString()
    };

    // Log chat message sent
    auditLogger.log({
      category: auditLogger.CATEGORIES.CHAT,
      action: 'message_sent',
      level: auditLogger.LEVELS.INFO,
      details: { messageLength: messageText.trim().length }
    });

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Generate AI response
      const aiResponse = await generateAIResponse(messageText.trim());
      
      const coachMessage = {
        id: Date.now() + 1,
        role: 'coach',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, coachMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
      
      // Log successful response
      auditLogger.log({
        category: auditLogger.CATEGORIES.CHAT,
        action: 'response_received',
        level: auditLogger.LEVELS.DEBUG,
        details: { responseLength: aiResponse.length }
      });
    } catch (err) {
      console.error('Error generating response:', err);
      
      // Log chat error
      auditLogger.log({
        category: auditLogger.CATEGORIES.ERROR,
        action: 'chat_response_failed',
        level: auditLogger.LEVELS.ERROR,
        details: { error: err.message }
      });
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'coach',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
        isError: true
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate AI response (with fallback to local responses)
  const generateAIResponse = async (userMessage) => {
    // GUARDRAIL CHECK - Must happen before any response generation
    const guardrailCheck = checkMedicalGuardrails(userMessage);
    if (guardrailCheck.triggered) {
      // Log guardrail trigger for audit
      auditLogger.log({
        category: auditLogger.CATEGORIES.SECURITY,
        action: 'guardrail_triggered',
        level: auditLogger.LEVELS.WARNING,
        details: {
          reason: guardrailCheck.reason,
          condition: guardrailCheck.condition,
          pattern: guardrailCheck.pattern || guardrailCheck.treatment
        }
      });
      
      return getMedicalSafetyResponse(guardrailCheck);
    }
    
    // Try API call first
    try {
      const response = await fetchWithAuth(`${API_BASE}/api/coaching/chat`, {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          context: {
            healthScore: healthScore?.overall,
            hasMealPlan: !!mealPlanData,
            hasNutritionData: !!nutritionData,
            mealPlanSummary: mealPlanData ? summarizeMealPlan(mealPlanData) : null
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
    } catch (err) {
      console.log('API not available, using local responses');
    }

    // Fallback to local response generation
    return generateLocalResponse(userMessage);
  };

  // Summarize meal plan for context
  const summarizeMealPlan = (plan) => {
    if (!plan || !plan.days) return null;
    
    const summary = {
      totalDays: plan.days.length,
      meals: [],
      dinners: []
    };
    
    plan.days.forEach(day => {
      if (day.meals) {
        day.meals.forEach(meal => {
          summary.meals.push(meal.name || meal.title);
          if (meal.type === 'dinner' || meal.mealType === 'dinner') {
            summary.dinners.push(meal.name || meal.title);
          }
        });
      }
    });
    
    return summary;
  };

  // Generate local response based on keywords
  const generateLocalResponse = (userMessage) => {
    const message = userMessage.toLowerCase();

    // SWAP REQUEST - Context-aware meal swapping
    if ((message.includes('swap') || message.includes('replace') || message.includes('change')) && 
        (message.includes('dinner') || message.includes('lunch') || message.includes('breakfast') || message.includes('meal'))) {
      
      // Check if user has a meal plan
      if (mealPlanData) {
        const mealSummary = summarizeMealPlan(mealPlanData);
        const wantsfish = message.includes('fish') || message.includes('salmon') || message.includes('tuna');
        const wantsChicken = message.includes('chicken');
        const wantsVegetarian = message.includes('vegetarian') || message.includes('veggie') || message.includes('plant');
        
        let swapSuggestion = '';
        
        if (wantsfish) {
          swapSuggestion = `Here's a fish-based dinner swap for your meal plan! 🐟\n\n**Swap Suggestion:**\n• **Grilled Salmon with Lemon Herb Quinoa**\n  - 4 oz salmon fillet, grilled\n  - 1 cup quinoa\n  - Steamed broccoli and asparagus\n  - Lemon-dill dressing\n\n**Nutritional Highlights:**\n• High in Omega-3 fatty acids\n• ~35g protein\n• Heart-healthy fats\n• ~450 calories\n\nYou can swap this for any dinner in your current plan. Would you like me to suggest other fish options?`;
        } else if (wantsChicken) {
          swapSuggestion = `Here's a chicken-based swap! 🍗\n\n**Swap Suggestion:**\n• **Herb-Roasted Chicken Breast with Sweet Potato**\n  - 5 oz chicken breast\n  - 1 medium sweet potato, roasted\n  - Mixed greens salad\n\n**Benefits:**\n• ~40g lean protein\n• Complex carbs for energy\n• ~420 calories\n\nWould you like more chicken recipe ideas?`;
        } else if (wantsVegetarian) {
          swapSuggestion = `Here's a vegetarian dinner option! 🥗\n\n**Swap Suggestion:**\n• **Mediterranean Chickpea Bowl**\n  - 1 cup chickpeas\n  - Cucumber, tomato, red onion\n  - Feta cheese\n  - Tahini dressing\n  - Whole grain pita\n\n**Benefits:**\n• Plant-based protein\n• High fiber\n• ~380 calories\n\nWould you like more plant-based options?`;
        } else {
          swapSuggestion = `I'd be happy to help you swap a meal! 🍽️\n\nYou currently have ${mealSummary?.totalDays || 'several'} days planned. What type of meal would you prefer?\n\n• 🐟 **Fish** - Heart-healthy omega-3s\n• 🍗 **Chicken** - Lean protein\n• 🥗 **Vegetarian** - Plant-based goodness\n• 🥩 **Red meat** - Iron-rich option\n\nJust let me know which direction you'd like to go!`;
        }
        
        // Log the context-aware response
        auditLogger.log({
          category: auditLogger.CATEGORIES.CHAT,
          action: 'meal_swap_suggestion',
          level: auditLogger.LEVELS.INFO,
          details: { 
            hasMealPlan: true, 
            requestType: wantsfish ? 'fish' : wantsChicken ? 'chicken' : wantsVegetarian ? 'vegetarian' : 'general'
          }
        });
        
        return swapSuggestion;
      } else {
        return `I'd love to help you swap meals! 🍽️\n\nTo give you personalized swap suggestions, I need to see your current meal plan. You can:\n\n1. **Create a meal plan** in the Meal Planner app\n2. Come back here for swap ideas\n\nIn the meantime, what type of cuisine are you interested in? I can share some general recipe ideas!`;
      }
    }

    // Health score related
    if (message.includes('health score') || message.includes('score') || message.includes('analyze')) {
      if (healthScore) {
        const score = healthScore.overall;
        if (score >= 80) {
          return `Great question! Your health score is ${score}/100 - that's excellent! 🌟 You're doing really well. To maintain this:\n\n• Keep up your consistent habits\n• Continue with your current meal planning routine\n• Stay hydrated and get adequate sleep\n\nIs there a specific area you'd like to optimize further?`;
        } else if (score >= 60) {
          return `Your health score is ${score}/100 - you're making good progress! 💪 Here are some ways to boost it:\n\n• Focus on completing your daily habits consistently\n• Try to log your meals more regularly\n• Set 1-2 small, achievable goals for this week\n\nWould you like help with any of these areas?`;
        } else {
          return `Your health score is ${score}/100 - there's room for improvement, and that's okay! 🌱 Small steps lead to big changes. Let's start with:\n\n• Pick ONE habit to focus on this week\n• Don't try to change everything at once\n• Celebrate small wins along the way\n\nWhat's one healthy change you'd like to make?`;
        }
      }
      return "I'd love to analyze your health score! Once you've logged some habits and goals, I'll be able to give you personalized insights. Want to start by setting up some daily habits?";
    }

    // Goal setting
    if (message.includes('goal') || message.includes('target') || message.includes('achieve')) {
      return `Setting effective goals is key to success! 🎯 Here's my SMART goal framework:\n\n**S**pecific - Be clear about what you want\n**M**easurable - How will you track progress?\n**A**chievable - Start small and build up\n**R**elevant - Connect it to what matters to you\n**T**ime-bound - Set a deadline\n\nFor example, instead of "eat healthier," try "I will eat a serving of vegetables with lunch 5 days this week."\n\nWant me to help you create a specific goal?`;
    }

    // Motivation
    if (message.includes('motivation') || message.includes('motivated') || message.includes('stay on track') || message.includes('struggling')) {
      return `I hear you - staying motivated can be challenging! 💪 Here are some strategies that work:\n\n1. **Remember your "why"** - What made you start this journey?\n2. **Track small wins** - Every healthy choice counts\n3. **Be kind to yourself** - Progress isn't always linear\n4. **Find your support** - Share your goals with someone\n5. **Make it easy** - Remove friction from healthy choices\n\nRemember: You don't have to be perfect, just consistent. What's been your biggest challenge lately?`;
    }

    // Meal planning / eating habits
    if (message.includes('meal') || message.includes('eating') || message.includes('food') || message.includes('diet')) {
      return `Great question about nutrition! 🥗 Here are some foundational tips:\n\n• **Plan ahead** - Decide meals for the week on Sunday\n• **Prep basics** - Wash veggies, cook grains in batches\n• **Balance plates** - Half veggies, quarter protein, quarter carbs\n• **Stay flexible** - It's okay to adjust your plan\n• **Hydrate first** - Sometimes hunger is actually thirst\n\n${mealPlanData ? "I see you have a meal plan - that's great! Are you finding it easy to follow?" : "Would you like to try our Meal Planner app? It can help you create personalized plans!"}\n\nWhat aspect of eating would you like to improve?`;
    }

    // Sleep and recovery
    if (message.includes('sleep') || message.includes('rest') || message.includes('recovery') || message.includes('tired')) {
      return `Sleep is SO important for health! 😴 Here's what research shows works:\n\n**Before Bed:**\n• Dim lights 1-2 hours before sleep\n• Avoid screens (or use night mode)\n• Keep bedroom cool (65-68°F)\n• Skip caffeine after 2pm\n\n**Habits:**\n• Same wake time daily (even weekends)\n• Get morning sunlight\n• Limit naps to 20 minutes\n\n**Wind-down ritual:**\n• Light stretching or reading\n• Gratitude journaling\n• Deep breathing exercises\n\nWhat's your biggest sleep challenge?`;
    }

    // Exercise / fitness
    if (message.includes('exercise') || message.includes('workout') || message.includes('fitness') || message.includes('active')) {
      return `Movement is medicine! 💪 Here's how to build an exercise habit:\n\n**Start Small:**\n• 10-minute walks count!\n• Find activities you actually enjoy\n• Don't go from 0 to 100\n\n**Build Consistency:**\n• Schedule it like a meeting\n• Lay out workout clothes the night before\n• Find an accountability partner\n\n**Mix It Up:**\n• Cardio for heart health\n• Strength for metabolism\n• Flexibility for mobility\n\nWhat type of movement do you enjoy most?`;
    }

    // Stress
    if (message.includes('stress') || message.includes('anxious') || message.includes('overwhelm') || message.includes('calm')) {
      return `Managing stress is crucial for overall health! 🧘 Here are evidence-based techniques:\n\n**Quick Relief (1-2 min):**\n• Box breathing: 4 in, 4 hold, 4 out, 4 hold\n• 5-4-3-2-1 grounding (5 things you see, 4 hear, etc.)\n• Progressive muscle relaxation\n\n**Daily Practices:**\n• 10 minutes of mindfulness or meditation\n• Journaling thoughts and feelings\n• Regular physical activity\n• Time in nature\n\n**Lifestyle:**\n• Set boundaries with work\n• Connect with supportive people\n• Limit news/social media consumption\n\nWould you like me to guide you through a quick breathing exercise?`;
    }

    // Gratitude / positive
    if (message.includes('thank') || message.includes('helpful') || message.includes('great')) {
      return `You're so welcome! 😊 I'm here for you anytime. Remember, every step forward - no matter how small - is progress. Is there anything else you'd like to chat about?`;
    }

    // Hello / greeting
    if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('good morning') || message.includes('good evening')) {
      return `Hello! 👋 Great to chat with you! How are you feeling today? Is there something specific you'd like to work on, or would you just like to check in?`;
    }

    // Default response
    return `That's a great topic! 🤔 Here are some thoughts:\n\nWhile I may not have a specific answer to that, I can help you with:\n• Setting and tracking health goals\n• Improving eating habits\n• Building consistency with routines\n• Staying motivated\n• Understanding your health score\n\nWould you like to explore any of these areas? Or feel free to ask me something more specific!`;
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion.text);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    if (window.confirm('Clear all chat history?')) {
      localStorage.removeItem('coaching_chat_history');
      addWelcomeMessage();
      setShowSuggestions(true);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="coaching-chat">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="coach-avatar">
          <span>🤖</span>
        </div>
        <div className="coach-info">
          <h3>AI Health Coach</h3>
          <span className="status">Always here to help</span>
        </div>
        <button className="clear-chat-btn" onClick={handleClearChat} title="Clear chat">
          🗑️
        </button>
      </div>

      {/* Messages Container */}
      <div className="chat-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.role} ${message.isError ? 'error' : ''}`}
          >
            {message.role === 'coach' && (
              <div className="message-avatar">🤖</div>
            )}
            <div className="message-content">
              <div className="message-text">
                {message.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line.startsWith('**') && line.endsWith('**') ? (
                      <strong>{line.slice(2, -2)}</strong>
                    ) : line.startsWith('• ') ? (
                      <span className="bullet-point">{line}</span>
                    ) : (
                      line
                    )}
                    {i < message.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="message coach">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="chat-suggestions">
          <p className="suggestions-label">Try asking:</p>
          <div className="suggestions-grid">
            {suggestions.map((suggestion, index) => (
              <button 
                key={index}
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="suggestion-icon">{suggestion.icon}</span>
                <span className="suggestion-text">{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          rows={1}
          disabled={isLoading}
        />
        <button 
          className="send-btn"
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isLoading}
        >
          <span>➤</span>
        </button>
      </div>
    </div>
  );
}
