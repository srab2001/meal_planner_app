import React, { useState, useRef, useEffect } from 'react';
import '../styles/AIWorkoutInterview.css';
import TextQuestionDisplay from './TextQuestionDisplay';
import MultipleChoiceDisplay from './MultipleChoiceDisplay';
import YesNoDisplay from './YesNoDisplay';
import RangeDisplay from './RangeDisplay';

/**
 * AIWorkoutInterview - AI-powered workout planning with admin-configured questions
 * 
 * Features:
 * - Fetches questions from admin panel
 * - Displays questions based on type
 * - Collects structured answers
 * - Sends to ChatGPT for workout generation
 * - Supports 4 question types: text, multiple_choice, yes_no, range
 */
export default function AIWorkoutInterview({ user, onWorkoutGenerated, onClose }) {
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [workoutGenerated, setWorkoutGenerated] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch questions and start interview on mount
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch admin questions
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_URL}/api/admin/questions/active`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch questions: ${response.status}`);
        }

        const data = await response.json();
        const fetchedQuestions = data.questions || [];

        if (fetchedQuestions.length === 0) {
          // Fallback to default question if none configured
          setQuestions([{
            id: 'default',
            question_text: 'What type of workout are you interested in?',
            question_type: 'text',
            options: [],
            order_position: 1
          }]);
        } else {
          // Sort by order position
          const sortedQuestions = fetchedQuestions.sort((a, b) => 
            (a.order_position || 0) - (b.order_position || 0)
          );
          setQuestions(sortedQuestions);
        }

        // Start interview
        const initialMessage = {
          role: 'assistant',
          content: "🏋️ Hi! I'm your AI Fitness Coach. I'll ask you a few questions to plan the perfect workout for you today!\n\nLet's get started →"
        };
        setMessages([initialMessage]);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing interview:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initializeInterview();
  }, []);

  /**
   * Handle answer to current question
   */
  const handleAnswerQuestion = (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    // Record answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));

    // Add user message
    const userMessage = {
      role: 'user',
      content: typeof answer === 'string' ? answer : String(answer)
    };
    setMessages(prev => [...prev, userMessage]);

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      // Show next question
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // All questions answered - send to ChatGPT
      generateWorkout(answers);
    }
  };

  /**
   * Generate workout from interview answers
   */
  const generateWorkout = async (collectedAnswers) => {
    setLoading(true);

    try {
      // Add thinking message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '💭 Creating your personalized workout...'
      }]);

      const token = localStorage.getItem('auth_token');

      // Build interview answers object with question text as key
      const interviewAnswers = {};
      questions.forEach((q, idx) => {
        const questionKey = `q${idx + 1}_${q.question_text.toLowerCase().substring(0, 20).replace(/\s+/g, '_')}`;
        interviewAnswers[questionKey] = collectedAnswers[q.id];
      });

      // Call AI interview endpoint with structured answers
      const response = await fetch(`${API_URL}/api/fitness/ai-interview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages.filter(m => m.role === 'user'),
          userProfile: user,
          interview_answers: interviewAnswers,
          question_count: questions.length
        }),
        signal: AbortSignal.timeout(120000) // 120 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error ${response.status}: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();

      // Update messages with response
      setMessages(prev => prev.map((m, idx) => 
        idx === prev.length - 1 ? { role: 'assistant', content: data.message } : m
      ));

      if (data.workoutGenerated && data.workout) {
        setWorkoutGenerated(true);
        
        // Show success message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ Workout created! Closing in 3 seconds...'
        }]);

        // Call callback with generated workout
        setTimeout(() => {
          onWorkoutGenerated(data.workout);
        }, 3000);
      }
    } catch (err) {
      console.error('Error generating workout:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render current question based on type
   */
  const renderCurrentQuestion = () => {
    if (currentQuestionIndex >= questions.length) {
      return null;
    }

    const currentQuestion = questions[currentQuestionIndex];

    switch (currentQuestion.question_type) {
      case 'text':
        return (
          <TextQuestionDisplay
            question={currentQuestion}
            onAnswer={handleAnswerQuestion}
            disabled={loading}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoiceDisplay
            question={currentQuestion}
            onAnswer={handleAnswerQuestion}
            disabled={loading}
          />
        );
      case 'yes_no':
        return (
          <YesNoDisplay
            question={currentQuestion}
            onAnswer={handleAnswerQuestion}
            disabled={loading}
          />
        );
      case 'range':
        return (
          <RangeDisplay
            question={currentQuestion}
            onAnswer={handleAnswerQuestion}
            disabled={loading}
          />
        );
      default:
        return (
          <TextQuestionDisplay
            question={currentQuestion}
            onAnswer={handleAnswerQuestion}
            disabled={loading}
          />
        );
    }
  };

  // Show loading state
  if (loading && messages.length === 0) {
    return (
      <div className="ai-workout-interview">
        <div className="ai-header">
          <h2>🤖 AI Workout Coach</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="ai-messages">
          <div className="ai-message ai-message-assistant">
            <div className="ai-message-content">
              <span className="ai-thinking">💭 Loading interview questions...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="ai-workout-interview">
        <div className="ai-header">
          <h2>🤖 AI Workout Coach</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="ai-messages">
          <div className="ai-message ai-message-assistant">
            <div className="ai-message-content">
              <span className="ai-error">❌ Error: {error}</span>
            </div>
          </div>
        </div>
        <div className="ai-input-container">
          <button className="send-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-workout-interview">
      <div className="ai-header">
        <h2>🤖 AI Workout Coach</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Question Progress */}
      {questions.length > 0 && (
        <div className="question-progress">
          Question {Math.min(currentQuestionIndex + 1, questions.length)} of {questions.length}
        </div>
      )}

      {/* Messages */}
      <div className="ai-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`ai-message ai-message-${msg.role}`}>
            <div className="ai-message-content">
              {msg.role === 'assistant' && <span className="ai-icon">🤖</span>}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div ref={messagesEndRef} />}
      </div>

      {/* Current Question Display */}
      {!workoutGenerated && currentQuestionIndex < questions.length && (
        <div className="ai-question-container">
          {renderCurrentQuestion()}
        </div>
      )}

      {/* Success Message */}
      {workoutGenerated && (
        <div className="ai-success">
          ✅ Workout created! Closing in 3 seconds...
        </div>
      )}

      {/* Thinking Indicator */}
      {loading && currentQuestionIndex >= questions.length && (
        <div className="ai-thinking-container">
          <span className="spinner"></span>
          <span className="ai-thinking">Creating your workout...</span>
        </div>
      )}
    </div>
  );
}
