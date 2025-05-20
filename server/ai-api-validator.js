// Utility to validate OpenAI API key with a simple test call
export async function validateOpenAIKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    console.error('Invalid API key format');
    return { valid: false, error: 'Invalid API key format' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a validator. Respond with "valid" only.' },
          { role: 'user', content: 'Verify API key is working' }
        ],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API validation failed:', errorData);
      return { 
        valid: false, 
        error: errorData.error?.message || `API error: ${response.status}` 
      };
    }

    const data = await response.json();
    return { 
      valid: true, 
      modelName: data.model || 'unknown'
    };
  } catch (error) {
    console.error('API validation error:', error);
    return { 
      valid: false, 
      error: error.message || 'Unknown error during API validation' 
    };
  }
} 