export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

      try {
      // Hugging Face Inference API call with better prompt
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.HUGGING_FACE_TOKEN || 'hf_dummy'}`,
        },
        body: JSON.stringify({
          inputs: `You are a helpful car marketplace assistant in Pakistan. User asks: "${message}". Respond in Roman Urdu (English script with Urdu words) with specific car advice. Keep it conversational and helpful.`,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.8,
            return_full_text: false,
            do_sample: true,
            top_p: 0.9
          }
        }),
      });

    if (!response.ok) {
      console.error('Hugging Face API Error:', response.status);
      // Use smart fallback instead of generic response
      throw new Error('API failed - using smart fallback');
    }

    const data = await response.json();
    let aiMessage = data[0]?.generated_text || data.generated_text || 'Sorry, samajh nahi aaya. Dobara try kariye.';
    
    // Clean up the response
    aiMessage = aiMessage.replace(/^(Car marketplace assistant|User:|Assistant:)/gi, '').trim();
    
    // Add context-specific response if too generic
    if (aiMessage.length < 20) {
      aiMessage = `${aiMessage} Main aap ki car marketplace assistant hun! ${context === 'buyer-dashboard' ? 'Car buying guidance' : context === 'seller-dashboard' ? 'Car selling tips' : 'Car marketplace help'} ke liye yahan hun.`;
    }

    res.status(200).json({ 
      message: aiMessage,
      success: true,
      provider: 'huggingface'
    });

  } catch (error) {
    console.error('Hugging Face API error:', error);
    
    // Smart fallback responses based on keywords and context
    let fallbackMessage = '';
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('konsi car') || lowerMessage.includes('which car') || lowerMessage.includes('prefer')) {
      fallbackMessage = `Aap ke liye car recommendation: Budget ke hisab se - Suzuki Wagon R (economical), Toyota Corolla (reliable), Honda Civic (stylish), ya Suzuki Swift (compact). Aap ka budget kya hai?`;
    } else if (lowerMessage.includes('12') || lowerMessage.includes('lac') || lowerMessage.includes('lakh') || lowerMessage.includes('budget')) {
      fallbackMessage = `12 lakh budget mein ye cars mil sakti hain: Suzuki Wagon R (8-12 lakh), Suzuki Swift (15-20 lakh), Honda City (18-25 lakh), Toyota Vitz (10-15 lakh). Wagon R best option hai aap ke budget mein - fuel efficient aur reliable!`;
    } else if (lowerMessage.includes('price') || lowerMessage.includes('paisa') || lowerMessage.includes('cost')) {
      fallbackMessage = `Pakistan mein car prices: Wagon R (8-12 lakh), Corolla (25-40 lakh), Civic (30-45 lakh), Swift (15-20 lakh). Market condition aur car age pe depend karta hai.`;
    } else if (lowerMessage.includes('wagon') || lowerMessage.includes('corolla') || lowerMessage.includes('civic')) {
      fallbackMessage = `Popular cars comparison: Wagon R (fuel efficient, small), Corolla (reliable, spacious), Civic (sporty, modern). Aap ka priority kya hai - fuel economy, reliability, ya style?`;
    } else if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      fallbackMessage = `Car buying tips: Budget set karo, test drive zaroor lena, documents verify karo, insurance compare karo, aur negotiate karne se na sharmao!`;
    } else if (lowerMessage.includes('sell') || lowerMessage.includes('selling')) {
      fallbackMessage = `Car selling tips: Market research karo, competitive price rakho, achay photos lagao, honest description likho, aur responsive raho buyers ke saath!`;
    } else if (context === 'buyer-dashboard') {
      fallbackMessage = `Buyer dashboard mein aap: Available cars dekh sakte hain, prices compare kar sakte hain, aur direct purchase kar sakte hain. Koi specific car interested hai?`;
    } else if (context === 'seller-dashboard') {
      fallbackMessage = `Seller dashboard mein aap: Apni cars list kar sakte hain, buyer messages dekh sakte hain, aur sales track kar sakte hain. Koi help chahiye listing ke liye?`;
    } else {
      fallbackMessage = `Main aap ki car marketplace assistant hun! Car buying, selling, price comparison, ya koi specific car ke barey mein puchhiye. Pakistan ki market ke hisab se advice dunga!`;
    }
    
    res.status(200).json({ 
      message: fallbackMessage,
      success: true,
      provider: 'fallback'
    });
  }
} 