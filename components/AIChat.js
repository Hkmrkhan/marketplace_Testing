import { useState, useRef, useEffect } from 'react';
import { AI_CONFIG } from '../utils/aiConfig';
import styles from '../styles/AIChat.module.css';

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

  // Enhanced search suggestions with better categorization
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

  // Enhanced autocorrect dictionary
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
    'pric': 'price',
    'prce': 'price',
    'maket': 'market',
    'mrket': 'market',
    'availabe': 'available',
    'availble': 'available',
    'budgt': 'budget',
    'budjet': 'budget',
    'cars': 'car',
    'car': 'cars',
    'tips': 'tip',
    'tip': 'tips',
    'dolar': 'dollar',
    'doller': 'dollar',
    'recomendation': 'recommendation',
    'sugest': 'suggest',
    'advice': 'advice',
    'advise': 'advice'
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced auto-suggestions based on input
  const handleInputChange = (value) => {
    setInputMessage(value);
    setError(null); // Clear any previous errors
    
    if (value.length > 1) {
      const contextSuggestions = userId ? searchSuggestions.buyer : searchSuggestions.general;
      const filtered = contextSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().split(' ').some(word => 
          suggestion.toLowerCase().includes(word)
        )
      ).slice(0, 5);
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Enhanced autocorrect with better word boundary detection
  const applyAutocorrect = (text) => {
    let correctedText = text;
    Object.keys(autocorrect).forEach(typo => {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      correctedText = correctedText.replace(regex, autocorrect[typo]);
    });
    return correctedText;
  };

  // Handle quick query buttons
  const handleQuickQuery = (query) => {
    setInputMessage(query);
    setShowSuggestions(false);
    setError(null);
    // Auto-send the query
    setTimeout(() => {
      if (!isLoading) {
        handleSendMessage(query);
      }
    }, 100);
  };

  // Enhanced message sending with better error handling
  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim() || isLoading) return;

    // Apply autocorrect before sending
    const correctedMessage = applyAutocorrect(message.trim());
    
    const userMessage = {
      id: Date.now(),
      text: correctedMessage,
      isAI: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setShowSuggestions(false);
    setError(null);
    setIsLoading(true);

    try {
      // Use configured AI provider
      const response = await fetch(AI_CONFIG.getEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: correctedMessage,
          context: context,
          userId: userId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: data.message || 'Sorry, kuch problem hui. Dobara try kariye.',
        isAI: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `❌ **Error:** ${error.message || 'Connection problem hai. Internet check kar ke dobara try kariye.'}`,
        isAI: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setError(error.message || 'Connection issue');
    } finally {
      setIsLoading(false);
    }
  };

  // Update sendMessage to use the new function
  const sendMessage = () => handleSendMessage();

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Enhanced floating button with notification
  if (isFloating && !isOpen) {
    console.log('Rendering floating button:', { isFloating, isOpen, error });
    return (
      <button
        className={styles.floatingButton}
        onClick={() => setIsOpen(true)}
        title="AI Assistant se help lein"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex'
        }}
      >
        🤖
        {error && <span className={styles.errorBadge}>!</span>}
      </button>
    );
  }

  return (
    <div className={`${styles.chatContainer} ${isFloating ? styles.floating : styles.embedded}`}>
      {isFloating && (
        <div className={styles.chatHeader}>
          <div className={styles.headerInfo}>
            <span className={styles.headerIcon}>🤖</span>
            <div>
              <h4>AI Assistant</h4>
              <span className={styles.status}>Online</span>
            </div>
          </div>
          <button 
            className={styles.closeButton}
            onClick={() => {
              setIsOpen(false);
              onClose && onClose();
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${message.isAI ? styles.aiMessage : styles.userMessage}`}
          >
            <div className={styles.messageContent}>
              <div className={styles.messageText}>{message.text}</div>
              <div className={styles.messageTime}>
                {message.timestamp.toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.message} ${styles.aiMessage}`}>
            <div className={styles.messageContent}>
              <div className={styles.typing}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className={styles.typingText}>AI thinking...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className={styles.errorContainer}>
          <span className={styles.errorIcon}>⚠️</span>
          <span className={styles.errorText}>{error}</span>
          <button 
            className={styles.errorClose}
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.inputContainer}>
        <textarea
          value={inputMessage}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Car ke baare mein kuch puchhiye..."
          className={styles.messageInput}
          rows="1"
          disabled={isLoading}
        />
        {showSuggestions && (
          <div className={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={styles.suggestionItem}
                onClick={() => {
                  setInputMessage(suggestion);
                  setShowSuggestions(false);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className={styles.sendButton}
          title={isLoading ? 'Processing...' : 'Send message'}
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </div>
      
      {/* Enhanced Quick Access Buttons */}
      {!isLoading && (
        <div className={styles.quickButtonsContainer}>
          <div className={styles.quickButtons}>
            <button 
              onClick={() => handleQuickQuery("Cheapest car kya hai?")}
              className={styles.quickButton}
              title="Find the cheapest car"
            >
              💰 Cheapest Car
            </button>
            <button 
              onClick={() => handleQuickQuery("Market status check karo")}
              className={styles.quickButton}
              title="Check current market status"
            >
              📊 Market Status
            </button>
            <button 
              onClick={() => handleQuickQuery("Selling tips")}
              className={styles.quickButton}
              title="Get selling advice"
            >
              🏪 Selling Tips
            </button>
            <button 
              onClick={() => handleQuickQuery("Buying tips")}
              className={styles.quickButton}
              title="Get buying advice"
            >
              🛒 Buying Tips
            </button>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
} 