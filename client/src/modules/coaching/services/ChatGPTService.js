/**
 * ChatGPTService - ChatGPT API integration for AI Coaching
 * 
 * Features:
 * - OpenAI ChatGPT API integration
 * - Context injection (meal plan, nutrition summary)
 * - Medical guardrails enforcement
 * - Response streaming support
 * - Audit logging for all prompts and responses
 * 
 * @module coaching/services/ChatGPTService
 */

import { API_BASE, fetchWithAuth } from '../../../shared/utils/api';
import auditLogger from '../../../shared/services/AuditLogger';

// Configuration
const CONFIG = {
  MODEL: 'gpt-4o-mini', // Cost-effective model with good performance
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  TOP_P: 1,
  FREQUENCY_PENALTY: 0.3,
  PRESENCE_PENALTY: 0.3,
  TIMEOUT_MS: 30000
};

// System prompt for AI coach persona
const SYSTEM_PROMPT = `You are a friendly, supportive AI Health Coach for the ASR Health Portal meal planning app. Your role is to help users with nutrition, healthy eating habits, meal planning, and general wellness.

**Your Personality:**
- Warm, encouraging, and non-judgmental
- Use emojis sparingly to add friendliness (🎯💪🥗)
- Keep responses concise but helpful (under 300 words)
- Ask follow-up questions to engage the user

**What You CAN Help With:**
- Meal planning advice and recipe ideas
- Nutritional guidance and balanced eating
- Healthy lifestyle habits and routines
- Motivation and goal-setting strategies
- Understanding macros, portions, and food labels
- Stress management and sleep hygiene
- General wellness tips

**What You CANNOT Do (STRICT LIMITS):**
- Provide medical diagnoses
- Recommend treatments for medical conditions
- Prescribe medications or supplements with specific dosages
- Replace professional healthcare advice
- Make claims about curing or treating diseases

**When Medical Topics Arise:**
If a user asks about medical conditions, symptoms, or treatments, you MUST:
1. Acknowledge their concern with empathy
2. Clearly state you cannot provide medical advice
3. Recommend they consult a healthcare professional
4. Offer to help with general wellness topics instead

**Context Awareness:**
You have access to the user's meal plan and nutrition data. Use this information to provide personalized, relevant advice. Reference specific meals or nutritional patterns when helpful.

Always prioritize user safety and well-being. When in doubt, defer to professional healthcare guidance.`;

// Medical guardrails - patterns that require safety response
const MEDICAL_GUARDRAILS = {
  conditions: [
    'diabetes', 'diabetic', 'cancer', 'tumor', 'heart disease', 'hypertension',
    'depression', 'anxiety disorder', 'bipolar', 'schizophrenia', 'anorexia',
    'bulimia', 'eating disorder', 'arthritis', 'asthma', 'copd', 'kidney disease',
    'liver disease', 'thyroid', 'hypothyroid', 'hyperthyroid', 'celiac',
    'crohn', 'colitis', 'ibs', 'fibromyalgia', 'lupus', 'ms', 'multiple sclerosis',
    'parkinson', 'alzheimer', 'dementia', 'epilepsy', 'seizure', 'hiv', 'aids',
    'autoimmune', 'chronic fatigue', 'pcos', 'endometriosis'
  ],
  treatments: [
    'treat my', 'cure my', 'heal my', 'fix my', 'prescribe', 'medication for',
    'medicine for', 'drug for', 'remedy for', 'therapy for', 'what pill',
    'should i take', 'dosage', 'how much should i take', 'treatment for',
    'diagnose', 'diagnosis', 'do i have', 'am i sick', 'is this serious',
    'emergency', 'symptom of', 'symptoms of', 'side effects'
  ],
  professional: [
    'instead of doctor', 'instead of medication', 'replace my medicine',
    'stop taking', 'quit my medication', 'alternative to prescription',
    'natural cure', 'home remedy for disease'
  ]
};

/**
 * ChatGPTService class for AI coaching interactions
 */
class ChatGPTService {
  constructor() {
    this.conversationHistory = [];
    this.maxHistoryLength = 10; // Keep last 10 messages for context
  }

  /**
   * Check if message triggers medical guardrails
   * @param {string} message - User message to check
   * @returns {Object} - { triggered: boolean, reason: string, details: object }
   */
  checkMedicalGuardrails(message) {
    const lowerMessage = message.toLowerCase();
    
    const hasCondition = MEDICAL_GUARDRAILS.conditions.some(c => lowerMessage.includes(c));
    const hasTreatment = MEDICAL_GUARDRAILS.treatments.some(t => lowerMessage.includes(t));
    const hasProfessional = MEDICAL_GUARDRAILS.professional.some(p => lowerMessage.includes(p));
    
    if (hasCondition && hasTreatment) {
      return {
        triggered: true,
        reason: 'medical_treatment_request',
        details: {
          condition: MEDICAL_GUARDRAILS.conditions.find(c => lowerMessage.includes(c)),
          treatment: MEDICAL_GUARDRAILS.treatments.find(t => lowerMessage.includes(t))
        }
      };
    }
    
    if (hasProfessional) {
      return {
        triggered: true,
        reason: 'replacing_professional_care',
        details: {
          pattern: MEDICAL_GUARDRAILS.professional.find(p => lowerMessage.includes(p))
        }
      };
    }
    
    if (lowerMessage.includes('do i have') || lowerMessage.includes('diagnose me')) {
      return {
        triggered: true,
        reason: 'diagnosis_request',
        details: {}
      };
    }
    
    return { triggered: false };
  }

  /**
   * Generate safety response when guardrails are triggered
   * @param {Object} guardrailResult - Result from checkMedicalGuardrails
   * @returns {string} - Safe response message
   */
  getMedicalSafetyResponse(guardrailResult) {
    const conditionMentioned = guardrailResult.details?.condition || 'your health concern';
    
    return `I appreciate you sharing this with me, but I need to be clear about my limitations. 🩺

**I'm not able to provide:**
- Medical diagnoses
- Treatment recommendations for medical conditions
- Advice that replaces professional healthcare

**What I recommend:**
- Please consult with a qualified healthcare provider about ${conditionMentioned}
- If this is urgent, please contact your doctor or visit an urgent care facility
- For emergencies, call 911 or go to your nearest emergency room

**How I CAN help:**
- General wellness and nutrition tips
- Healthy lifestyle habits
- Motivation and goal-setting
- Meal planning guidance

Would you like to discuss any of these areas instead? I'm here to support your overall wellness journey! 💪`;
  }

  /**
   * Build context string from user data
   * @param {Object} context - User context data
   * @returns {string} - Formatted context string
   */
  buildContextString(context) {
    let contextParts = [];
    
    if (context.mealPlan) {
      const planSummary = this.summarizeMealPlan(context.mealPlan);
      contextParts.push(`**Current Meal Plan:** ${planSummary}`);
    }
    
    if (context.nutritionSummary) {
      const nutritionStr = this.summarizeNutrition(context.nutritionSummary);
      contextParts.push(`**Nutrition Summary:** ${nutritionStr}`);
    }
    
    if (context.healthScore) {
      contextParts.push(`**Health Score:** ${context.healthScore}/100`);
    }
    
    if (context.activeProgram) {
      contextParts.push(`**Active Program:** ${context.activeProgram.name} (${context.activeProgram.progress}% complete)`);
    }
    
    if (contextParts.length === 0) {
      return 'No meal plan or nutrition data available yet.';
    }
    
    return contextParts.join('\n');
  }

  /**
   * Summarize meal plan for context injection
   * @param {Object} mealPlan - User's meal plan data
   * @returns {string} - Summary string
   */
  summarizeMealPlan(mealPlan) {
    if (!mealPlan || !mealPlan.days) {
      return 'No active meal plan';
    }
    
    const daysCount = mealPlan.days.length;
    const meals = [];
    
    mealPlan.days.slice(0, 3).forEach(day => {
      if (day.meals) {
        day.meals.forEach(meal => {
          if (meal.name || meal.title) {
            meals.push(meal.name || meal.title);
          }
        });
      }
    });
    
    const mealsList = meals.slice(0, 5).join(', ');
    return `${daysCount}-day plan with meals like: ${mealsList}${meals.length > 5 ? '...' : ''}`;
  }

  /**
   * Summarize nutrition data for context injection
   * @param {Object} nutritionData - User's nutrition summary
   * @returns {string} - Summary string
   */
  summarizeNutrition(nutritionData) {
    if (!nutritionData) {
      return 'No nutrition data tracked yet';
    }
    
    const parts = [];
    if (nutritionData.avgCalories) {
      parts.push(`~${Math.round(nutritionData.avgCalories)} cal/day avg`);
    }
    if (nutritionData.protein) {
      parts.push(`${Math.round(nutritionData.protein)}g protein`);
    }
    if (nutritionData.carbs) {
      parts.push(`${Math.round(nutritionData.carbs)}g carbs`);
    }
    if (nutritionData.fat) {
      parts.push(`${Math.round(nutritionData.fat)}g fat`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Limited nutrition data';
  }

  /**
   * Send message to ChatGPT API and get response
   * @param {string} userMessage - User's message
   * @param {Object} context - Context data (mealPlan, nutritionSummary, etc.)
   * @returns {Promise<Object>} - { success: boolean, response: string, error?: string }
   */
  async sendMessage(userMessage, context = {}) {
    const startTime = Date.now();
    
    // Step 1: Check medical guardrails FIRST
    const guardrailCheck = this.checkMedicalGuardrails(userMessage);
    if (guardrailCheck.triggered) {
      // Log guardrail trigger
      auditLogger.log({
        category: auditLogger.CATEGORIES.SECURITY,
        action: 'chatgpt_guardrail_triggered',
        level: auditLogger.LEVELS.WARNING,
        details: {
          reason: guardrailCheck.reason,
          ...guardrailCheck.details,
          messagePreview: userMessage.substring(0, 50)
        }
      });
      
      return {
        success: true,
        response: this.getMedicalSafetyResponse(guardrailCheck),
        guardrailTriggered: true
      };
    }
    
    // Step 2: Build context-aware prompt
    const contextString = this.buildContextString(context);
    const userMessageWithContext = `**User Context:**
${contextString}

**User Message:**
${userMessage}`;

    // Step 3: Build conversation history for API
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...this.conversationHistory.slice(-this.maxHistoryLength),
      { role: 'user', content: userMessageWithContext }
    ];
    
    // Step 4: Log the prompt (before API call)
    auditLogger.log({
      category: auditLogger.CATEGORIES.CHAT,
      action: 'chatgpt_prompt_sent',
      level: auditLogger.LEVELS.INFO,
      details: {
        messageLength: userMessage.length,
        hasContext: !!context.mealPlan || !!context.nutritionSummary,
        conversationLength: this.conversationHistory.length
      }
    });
    
    try {
      // Step 5: Call backend API (which proxies to OpenAI)
      const response = await fetchWithAuth(`${API_BASE}/api/coaching/chat`, {
        method: 'POST',
        body: JSON.stringify({
          messages,
          config: {
            model: CONFIG.MODEL,
            max_tokens: CONFIG.MAX_TOKENS,
            temperature: CONFIG.TEMPERATURE
          }
        }),
        timeout: CONFIG.TIMEOUT_MS
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponse = data.response || data.message || data.content;
      
      // Step 6: Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      );
      
      // Step 7: Log successful response
      const duration = Date.now() - startTime;
      auditLogger.log({
        category: auditLogger.CATEGORIES.CHAT,
        action: 'chatgpt_response_received',
        level: auditLogger.LEVELS.INFO,
        details: {
          responseLength: aiResponse.length,
          durationMs: duration,
          tokensUsed: data.usage?.total_tokens || 'unknown'
        }
      });
      
      return {
        success: true,
        response: aiResponse,
        usage: data.usage
      };
      
    } catch (error) {
      // Log API error
      auditLogger.log({
        category: auditLogger.CATEGORIES.ERROR,
        action: 'chatgpt_api_error',
        level: auditLogger.LEVELS.ERROR,
        details: {
          error: error.message,
          durationMs: Date.now() - startTime
        }
      });
      
      // Fall back to local response generation
      console.warn('ChatGPT API unavailable, using local fallback');
      return {
        success: true,
        response: this.generateLocalFallback(userMessage, context),
        fallback: true
      };
    }
  }

  /**
   * Generate local fallback response when API is unavailable
   * @param {string} message - User message
   * @param {Object} context - Context data
   * @returns {string} - Generated response
   */
  generateLocalFallback(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Goal setting
    if (lowerMessage.includes('goal') || lowerMessage.includes('target')) {
      return `Setting effective goals is key to success! 🎯 Here's my SMART goal framework:

**S**pecific - Be clear about what you want
**M**easurable - How will you track progress?
**A**chievable - Start small and build up
**R**elevant - Connect it to what matters to you
**T**ime-bound - Set a deadline

For example, instead of "eat healthier," try "I will eat a serving of vegetables with lunch 5 days this week."

Want me to help you create a specific goal?`;
    }
    
    // Meal planning
    if (lowerMessage.includes('meal') || lowerMessage.includes('plan') || lowerMessage.includes('recipe')) {
      const hasPlan = context.mealPlan ? 'I see you have a meal plan going - great job!' : 'Try our Meal Planner to create a personalized plan!';
      return `Great question about meal planning! 🍽️

${hasPlan}

Here are some fundamentals:
• **Plan ahead** - Decide meals for the week on Sunday
• **Prep basics** - Wash veggies, cook grains in batches
• **Balance plates** - Half veggies, quarter protein, quarter carbs
• **Stay flexible** - It's okay to adjust your plan

What aspect would you like to explore further?`;
    }
    
    // Motivation
    if (lowerMessage.includes('motivat') || lowerMessage.includes('struggling') || lowerMessage.includes('help me')) {
      return `I hear you - staying motivated can be challenging! 💪

Here are strategies that work:
1. **Remember your "why"** - What made you start this journey?
2. **Track small wins** - Every healthy choice counts
3. **Be kind to yourself** - Progress isn't always linear
4. **Find your support** - Share your goals with someone
5. **Make it easy** - Remove friction from healthy choices

Remember: You don't have to be perfect, just consistent. What's been your biggest challenge lately?`;
    }
    
    // Nutrition questions
    if (lowerMessage.includes('calori') || lowerMessage.includes('protein') || lowerMessage.includes('carb') || lowerMessage.includes('nutrit')) {
      return `Great nutrition question! 📊

Here are the basics:
• **Protein** - Aim for 0.8-1g per pound of goal body weight
• **Carbs** - Focus on complex carbs (whole grains, vegetables)
• **Fats** - Include healthy fats (avocado, nuts, olive oil)
• **Calories** - Quality matters as much as quantity

${context.nutritionSummary ? 'Based on your tracking, you\'re doing well! Keep it up.' : 'Start tracking your meals to get personalized insights.'}

What specific aspect would you like to learn more about?`;
    }
    
    // Default response
    return `Thanks for your message! 😊

I'm here to help you with:
• Setting and tracking health goals
• Meal planning and nutrition tips
• Building consistent healthy habits
• Staying motivated on your journey

What would you like to focus on today?`;
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    auditLogger.log({
      category: auditLogger.CATEGORIES.CHAT,
      action: 'conversation_history_cleared',
      level: auditLogger.LEVELS.DEBUG
    });
  }

  /**
   * Get conversation history for persistence
   * @returns {Array} - Conversation history
   */
  getHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Load conversation history from storage
   * @param {Array} history - Previously stored history
   */
  loadHistory(history) {
    if (Array.isArray(history)) {
      this.conversationHistory = history.slice(-this.maxHistoryLength * 2);
    }
  }
}

// Export singleton instance
export const chatGPTService = new ChatGPTService();
export default chatGPTService;
