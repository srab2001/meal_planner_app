const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateChatCompletion({ model = 'gpt-4o-mini', messages = [], temperature = 0.3, max_tokens = 2000 }) {
  const start = Date.now();
  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens,
  });
  const duration = Date.now() - start;

  return {
    model: completion.model || model,
    text: completion.choices?.[0]?.message?.content || '',
    duration,
  };
}

module.exports = {
  generateChatCompletion,
};
