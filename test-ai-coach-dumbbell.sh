#!/bin/bash

# Debug script to test fitness AI coach endpoint
# This simulates what the frontend does when requesting a dumbbell workout

API_URL="https://meal-planner-app-mve2.onrender.com"
ENDPOINT="/api/fitness/ai-interview"

echo "🧪 Testing Fitness AI Coach Endpoint"
echo "===================================="
echo ""

# First, let's try to get a valid token
# For testing, we'll use a sample token structure
# In production, you'd need a real JWT from logging in

echo "📍 Target: ${API_URL}${ENDPOINT}"
echo ""

# Test 1: Check if endpoint exists (no auth)
echo "Test 1: Check endpoint exists (expect 401 auth error)"
echo "---"
curl -s -X POST "${API_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "I want a dumbbell workout"
      }
    ]
  }' | jq . 2>/dev/null || curl -s -X POST "${API_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "I want a dumbbell workout"
      }
    ]
  }'

echo ""
echo ""

# Test 2: Try with a dummy auth header (will fail but shows API response structure)
echo "Test 2: Request with dummy token (expect 401 or proper response)"
echo "---"
curl -s -X POST "${API_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-for-debugging" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Create a dumbbell workout plan for someone who wants to build muscle"
      }
    ]
  }' | jq . 2>/dev/null || curl -s -X POST "${API_URL}${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token-for-debugging" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Create a dumbbell workout plan for someone who wants to build muscle"
      }
    ]
  }'

echo ""
echo ""

# Test 3: Test with full interview flow
echo "Test 3: Full interview flow (needs valid token)"
echo "---"
echo "This would need a real JWT token. Get one by:"
echo "1. Login to the app"
echo "2. Open DevTools → Application → localStorage"
echo "3. Copy the 'auth_token' value"
echo "4. Run this command with your real token:"
echo ""
echo "curl -X POST 'https://meal-planner-app-mve2.onrender.com/api/fitness/ai-interview' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \\"
echo "  -d '{\"messages\": [{\"role\": \"user\", \"content\": \"I want a dumbbell workout for muscle building\"}]}'"
echo ""
echo ""

# Test 4: Check if OpenAI API key is configured
echo "Test 4: Check server health endpoint"
echo "---"
curl -s "${API_URL}/health" 2>/dev/null | jq . || echo "No /health endpoint"

echo ""
echo "✅ Testing complete"
