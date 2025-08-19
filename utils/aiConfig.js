// AI Provider Configuration
export const AI_CONFIG = {
  // Switch between providers easily
  CURRENT_PROVIDER: 'marketplace', // 'openai' | 'huggingface' | 'marketplace' | 'fallback'
  
  PROVIDERS: {
    openai: {
      endpoint: '/api/chat',
      name: 'OpenAI GPT-3.5',
      free: false,
      rateLimit: '3 req/min (free tier)'
    },
    huggingface: {
      endpoint: '/api/chat-hf', 
      name: 'Hugging Face DialoGPT',
      free: true,
      rateLimit: '1000 req/month'
    },
    marketplace: {
      endpoint: '/api/chat-marketplace',
      name: 'Marketplace Assistant',
      free: true,
      rateLimit: 'Unlimited',
      dynamic: true
    },
    fallback: {
      endpoint: '/api/chat', // Uses fallback responses
      name: 'Local Fallback',
      free: true,
      rateLimit: 'Unlimited'
    }
  },
  
  // Get current provider config
  getCurrentProvider() {
    return this.PROVIDERS[this.CURRENT_PROVIDER];
  },
  
  // Get API endpoint
  getEndpoint() {
    return this.getCurrentProvider().endpoint;
  }
};

// Enhanced fallback responses for offline/fallback mode
export const FALLBACK_RESPONSES = {
  'buyer-dashboard': [
    '🛒 **Car buying ke liye tips:** Budget set karo, financing options check karo, test drive zaroori hai! Market research karo aur negotiate karne se na sharmao!',
    '📊 **Smart buying strategy:** Multiple cars compare karo, seller verification karo, car history check karo. Insurance aur maintenance cost bhi calculate karo purchase se pehle!',
    '💡 **Buyer pro tips:** Best time to buy is end of month, cash payment mein discount mil sakta hai, aur always ask for maintenance records!',
    '🎯 **Budget planning:** Set clear price limit, hidden costs consider karo (insurance, registration, repairs), aur emergency fund rakho!',
    '🚗 **Car selection:** Mileage, year, condition check karo. Test drive zaroori hai aur mechanic se inspection karwao!'
  ],
  'seller-dashboard': [
    '💼 **Car selling tips:** Competitive price research karo, honest description likho! Quality photos lagao aur responsive raho buyers ke saath!',
    '📈 **Market success:** Price competitively, market timing important hai - peak season mein better price milti hai! Professional presentation zaroori hai!',
    '📸 **Listing optimization:** Multiple angles se photos lagao, detailed description likho, quick responses do buyers ko. WhatsApp contact provide karo!',
    '💰 **Pricing strategy:** Market average ke near rakho, quick sale ke liye slightly below average price set karo. Premium listing ke liye extra photos add karo!',
    '🎯 **Seller pro tips:** Keep listing updated, respond within 1 hour, build trust with accurate information, aur meet in safe locations!'
  ],
  'general': [
    '🤖 **Main aap ki car marketplace assistant hun!** Car buying ya selling ke barey mein koi sawal ho? Kya specific help chahiye?',
    '🏪 **Car marketplace mein welcome!** Kya aap car buy karna chahte hain ya sell karna chahte hain? Main guide kar sakta hun!',
    '🚗 **Car marketplace assistant at your service!** Budget, tips, market analysis - kya chahiye? Simply ask kar sakte hain!',
    '💬 **Car marketplace help desk!** Buying tips, selling strategies, market trends - koi bhi sawal puch sakte hain!',
    '🎯 **Car marketplace expert hun!** Kya aap buyer hain ya seller? Main dono ke liye detailed guidance provide kar sakta hun!'
  ]
}; 