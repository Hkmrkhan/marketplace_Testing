import { useState, useRef, useEffect } from 'react';
import { AI_CONFIG } from '../utils/aiConfig';

export default function AIChat({ context = 'general', isFloating = false, onClose, userId = null }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `**Assalam o Alaikum!** 👋

**🤖 Main aap ki Car Marketplace Assistant hun!**

**💬 How can I help you today?**

${!userId ? '🔓 **Guest Mode:** Login/Signup guidance available!' : ''}

**🚗 Ready to explore?** Just ask!

${context === 'global' ? '🌐 **Global Mode:** Available on all pages!' : ''}`,
      isAI: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const searchSuggestions = {
    buyer: [
      "Budget $500 mein kya milega?",
      "Cheapest car recommend karo",
      "Mid-range cars dikhao",
      "Premium cars $5000+",
      "Luxury cars $10000+",
      "Cars in Karachi",
      "Cars in Lahore",
      "Cars in Islamabad",
      "Rawalpindi mein cars",
      "Karachi ke cars",
      "Market status check karo",
      "Buying tips",
      "200 dollar wali car",
      "Best value cars",
      "Car history check",
      "Test drive options"
    ],
    seller: [
      "Selling tips provide karo",
      "Market analysis aur tips",
      "Competitive pricing strategy",
      "Average price kya hai?",
      "Market competition check",
      "Quick sale ke liye advice",
      "Pricing guidance do",
      "Seller success tips",
      "Photo upload tips",
      "Listing optimization"
    ],
    general: [
      "Market status check karo",
      "Total kitni cars hain?",
      "Price range kya hai?",
      "Cheapest car kya hai?",
      "Premium cars $5000+",
      "Luxury cars $10000+",
      "Cars in Rawalpindi",
      "Cars in Peshawar",
      "Karachi mein cars",
      "Lahore ke cars",
      "Seller registration",
      "Buyer signup",
      "Tips and guide",
      "Help me",
      "Car categories",
      "Market trends"
    ]
  };

  const autocorrect = {
    'sellig': 'selling',
    'sellng': 'selling', 
    'seling': 'selling',
    'byuing': 'buying',
    'bying': 'buying',
    'buyin': 'buying',
    'chep': 'cheap',
    'cheep': 'cheap',
    'expnsive': 'expensive',
    'expensiv': 'expensive',
    'recomend': 'recommend',
    'recomnd': 'recommend',
    'analsis': 'analysis',
    'anaylsis': 'analysis',
    'pric': 'price'
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (value) => {
    setInputMessage(value);
    
    if (value.trim().length > 1) {
      const allSuggestions = [
        ...searchSuggestions.buyer,
        ...searchSuggestions.seller,
        ...searchSuggestions.general
      ];
      
      const filtered = allSuggestions.filter(item => 
        item.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleQuickQuery = (query) => {
    setInputMessage(query);
    setShowSuggestions(false);
    setTimeout(() => {
      handleSendMessage(query);
    }, 100);
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    let processedText = text.trim();
    Object.keys(autocorrect).forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      processedText = processedText.replace(regex, autocorrect[key]);
    });

    const userMessage = {
      id: Date.now(),
      text: processedText,
      isAI: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setShowSuggestions(false);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: processedText,
          userId,
          context
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: data.reply || data.response || 'Main aap ki baat samajh nahi saka, barah-e-karam dobara koshish karein.',
        isAI: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        text: '⚠️ Maaf kijiye, abhi response dene mein issue aa raha hai. Dobara try karein.',
        isAI: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(err.message || 'Connection issue');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => handleSendMessage();

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isFloating && !isOpen) {
    return (
      <button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white text-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
        onClick={() => setIsOpen(true)}
        title="AI Assistant"
      >
        🤖
        {error && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold flex items-center justify-center">!</span>}
      </button>
    );
  }

  return (
    <div className={`${isFloating ? 'fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[520px]' : 'w-full h-full'} rounded-3xl backdrop-blur-2xl bg-slate-950/95 border border-white/15 flex flex-col shadow-2xl overflow-hidden`}>
      {/* Header */}
      <div className="p-4 bg-slate-900/90 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-lg">
            🤖
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-none">AI Assistant</h4>
            <span className="text-[10px] text-emerald-400 font-medium">● Online</span>
          </div>
        </div>
        {isFloating && (
          <button 
            onClick={() => {
              setIsOpen(false);
              onClose && onClose();
            }}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${message.isAI ? 'items-start' : 'items-end'}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-wrap ${
                message.isAI 
                  ? 'bg-slate-900 border border-white/10 text-slate-200' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              }`}
            >
              {message.text}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">
              {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900 border border-white/10 text-slate-400 text-xs w-max">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <span>AI thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Queries */}
      {!isLoading && (
        <div className="px-3 py-2 border-t border-white/5 flex gap-2 overflow-x-auto scrollbar-none">
          {[
            { label: '💰 Cheapest Car', query: 'Cheapest car kya hai?' },
            { label: '📊 Market Status', query: 'Market status check karo' },
            { label: '🏪 Selling Tips', query: 'Selling tips' },
            { label: '🛒 Buying Tips', query: 'Buying tips' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickQuery(item.query)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 border-t border-white/10 bg-slate-900/60 relative">
        {showSuggestions && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl bg-slate-900 border border-white/15 p-2 shadow-2xl space-y-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => {
                  setInputMessage(suggestion);
                  setShowSuggestions(false);
                }}
                className="p-2 rounded-xl text-xs text-slate-300 hover:bg-white/5 cursor-pointer truncate"
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about cars, prices, recommendations..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-md"
            title="Send"
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
