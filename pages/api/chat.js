export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not found in environment variables');
    return res.status(500).json({ 
      error: 'Configuration error',
      message: 'OpenAI API key nahi mili. Environment variable check karo.'
    });
  }

  try {
    // OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for a car marketplace website. You ONLY help with:
            - Car buying and selling advice
            - Price negotiations and market analysis
            - Car features and comparisons
            - Marketplace navigation help
            - Seller/buyer guidance
            - Car condition assessment
            
            If asked about anything else, politely say "Main sirf car marketplace ke barey mein help kar sakta hun."
            
            Current context: ${context || 'general marketplace'}
            
            Respond in Roman Urdu (English script with Urdu/Hindi words mixed in) as the user prefers this style.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', response.status, errorData);
      
      if (response.status === 401) {
        return res.status(500).json({ 
          error: 'Authentication error',
          message: 'OpenAI API key invalid hai. Key check karo.'
        });
      } else if (response.status === 429) {
        return res.status(500).json({ 
          error: 'Rate limit error',
          message: 'API quota khatam ho gaya. Thoda wait karo.'
        });
      } else {
        throw new Error(`OpenAI API request failed: ${response.status}`);
      }
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, kuch problem hui hai. Dobara try kariye.';

    res.status(200).json({ 
      message: aiMessage,
      success: true 
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: `Debug: ${error.message || 'AI chat service temporarily unavailable. Please try again later.'}`
    });
  }
} 