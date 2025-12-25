#!/bin/bash

# Test script for AI Coach endpoint
# This verifies the /api/fitness/ai-interview endpoint is working

echo "🧪 Testing AI Coach Endpoint"
echo "============================"
echo ""

# Get a valid JWT token from localStorage would be needed in a real test
# For now, we'll test the endpoint structure

API_URL="https://meal-planner-app-mve2.onrender.com/api/fitness/ai-interview"

echo "📍 API Endpoint: $API_URL"
echo ""

# Test 1: Basic connectivity
echo "Test 1: Check endpoint responds"
curl -i -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "I want to create a fitness plan"
      }
    ]
  }' 2>/dev/null | head -20

echo ""
echo ""

# Test 2: Check if missing auth gives proper error
echo "Test 2: Check endpoint without auth"
curl -i -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "I want to create a fitness plan"
      }
    ]
  }' 2>/dev/null | head -20

echo ""
echo "✅ Endpoint test completed"
