import { FALLBACK_RESPONSES } from '../../utils/aiConfig';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context, userId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const lowerMessage = message.toLowerCase();
    
    // Basic fallback responses
    let response = '';
    
    if (lowerMessage.includes('buying') || lowerMessage.includes('buyer')) {
      response = FALLBACK_RESPONSES['buyer-dashboard'][Math.floor(Math.random() * FALLBACK_RESPONSES['buyer-dashboard'].length)];
    } else if (lowerMessage.includes('selling') || lowerMessage.includes('seller')) {
      response = FALLBACK_RESPONSES['seller-dashboard'][Math.floor(Math.random() * FALLBACK_RESPONSES['seller-dashboard'].length)];
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('assalam')) {
      response = 'Assalam o Alaikum! Main aap ki car marketplace assistant hun. Kya help chahiye?';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('tips')) {
      response = 'Main aap ko car buying aur selling ke tips de sakta hun. Kya specific help chahiye?';
    } else {
      response = FALLBACK_RESPONSES['general'][Math.floor(Math.random() * FALLBACK_RESPONSES['general'].length)];
    }

    res.status(200).json({ 
      message: response,
      success: true,
      provider: 'fallback'
    });

  } catch (error) {
    console.error('Fallback chat error:', error);
    res.status(500).json({ 
      message: 'Sorry, kuch problem hui. Thoda wait kar ke dobara try kariye.',
      success: false 
    });
  }
} 