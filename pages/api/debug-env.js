export default function handler(req, res) {
  const hasKey = !!process.env.OPENAI_API_KEY;
  const keyPrefix = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'Not found';
  
  res.status(200).json({
    hasOpenAIKey: hasKey,
    keyPrefix: keyPrefix,
    nodeEnv: process.env.NODE_ENV,
    message: hasKey ? 'Environment variables theek hain!' : 'OpenAI API key missing hai!'
  });
} 