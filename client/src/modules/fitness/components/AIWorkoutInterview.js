import React, { useState, useRef, useEffect } from 'react';
import '../styles/AIWorkoutInterview.css';

/**
 * AIWorkoutInterview - AI-powered workout planning via conversation
 * 
 * Features:
 * - Conversational AI interview about workout preferences
 * - Real-time chat interface
 * - Generates custom workout based on responses
 * - Auto-populates workout into the log
 */
export default function AIWorkoutInterview({ user, onWorkoutGenerated, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [workoutGenerated, setWorkoutGenerated] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start interview on mount
  useEffect(() => {
    startInterview();
  }, []);

  const startInterview = async () => {
    const initialMessage = {
      role: 'assistant',
      content: "🏋️ Hi! I'm your AI Fitness Coach. I'll help you plan the perfect workout today!\n\nLet's start: What type of workout are you in the mood for? (e.g., cardio, strength training, flexibility, sports, HIIT, or something else?)"
    };
    setMessages([initialMessage]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/fitness/ai-interview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userProfile: user
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      // Check if workout was generated
      if (data.workoutGenerated) {
        setWorkoutGenerated(true);
        // Add final message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message
        }]);

        // Call callback with generated workout
        setTimeout(() => {
          onWorkoutGenerated(data.workout);
        }, 1500);
      } else {
        // Continue conversation
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message
        }]);
      }
    } catch (error) {
      console.error('Error in AI interview:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${errorMessage}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ai-workout-interview">
      <div className="ai-header">
        <h2>🤖 AI Workout Coach</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="ai-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`ai-message ai-message-${msg.role}`}>
            <div className="ai-message-content">
              {msg.role === 'assistant' && <span className="ai-icon">🤖</span>}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-message ai-message-assistant">
            <div className="ai-message-content">
              <span className="ai-thinking">💭 Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {workoutGenerated && (
        <div className="ai-success">
          ✅ Workout created! Closing in 3 seconds...
        </div>
      )}

      {!workoutGenerated && (
        <div className="ai-input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me about your preferences..."
            disabled={loading || workoutGenerated}
            rows="2"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim() || workoutGenerated}
            className="send-btn"
          >
            📤 Send
          </button>
        </div>
      )}
    </div>
  );
}
