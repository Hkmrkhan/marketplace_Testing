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
      endpoint: '/api/chat-hf', // Uses fallback responses
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

// Test responses for offline/fallback mode
export const FALLBACK_RESPONSES = {
  'buyer-dashboard': [
    'Car buying ke liye tips: Budget set karo, financing options check karo, test drive zaroori hai!',
    'Market research karo, car history check karo, aur negotiate karne se na sharmao!',
    'Insurance, registration aur maintenance cost bhi calculate karo purchase se pehle!'
  ],
  'seller-dashboard': [
    'Car selling tips: Competitive price research karo, honest description likho!',
    'Achay photos lagao, paperwork ready rakho, aur responsive raho buyers ke saath!',
    'Market timing important hai - peak season mein better price milti hai!'
  ],
  'general': [
    'Main aap ki car marketplace assistant hun! Car buying ya selling ke barey mein koi sawal ho?',
    'Pakistan ki car market ke barey mein koi specific information chahiye?',
    'Koi particular car model ke barey mein janna chahte hain?'
  ]
}; 