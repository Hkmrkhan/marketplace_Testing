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

**🚗 Ready to explore?** Just ask!`,
      isAI: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef(null);

  // Common search terms and suggestions
  const searchSuggestions = {
    buyer: [
      "Budget $500 mein kya milega?",
      "Cheapest car recommend karo",
      "Mid-range cars dikhao",
      "Premium cars available?",
      "Toyota cars available?",
      "Honda cars list karo",
      "Market status check karo",
      "Buying tips",
      "200 dollar wali car",
      "Best value cars"
    ],
    seller: [
      "Selling tips provide karo",
      "Market analysis aur tips",
      "Competitive pricing strategy",
      "Average price kya hai?",
      "Market competition check",
      "Quick sale ke liye advice",
      "Pricing guidance do",
      "Seller success tips"
    ],
    general: [
      "Market status check karo",
      "Total kitni cars hain?",
      "Price range kya hai?",
      "Cheapest car kya hai?",
      "Premium cars available?",
      "Seller registration",
      "Buyer signup",
      "Tips and guide",
      "Help me"
    ]
  };

  // Autocorrect dictionary
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
    'tip': 'tips'
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-suggestions based on input
  const handleInputChange = (value) => {
    setInputMessage(value);
    
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

  // Apply autocorrect
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
    // Auto-send the query
    setTimeout(() => {
      if (!isLoading) {
        handleSendMessage(query);
      }
    }, 100);
  };

  // Separate function for sending messages
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

      const data = await response.json();

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
        text: 'Connection problem hai. Internet check kar ke dobara try kariye.',
        isAI: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
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

  if (isFloating && !isOpen) {
    return (
      <button
        className={styles.floatingButton}
        onClick={() => setIsOpen(true)}
        title="AI Assistant se help lein"
      >
        🤖
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
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </div>
      
      {/* Quick Access Buttons */}
      {!isLoading && (
        <div className={styles.quickButtonsContainer}>
          <div className={styles.quickButtons}>
            <button 
              onClick={() => handleQuickQuery("Cheapest car kya hai?")}
              className={styles.quickButton}
            >
              💰 Cheapest Car
            </button>
            <button 
              onClick={() => handleQuickQuery("Market status check karo")}
              className={styles.quickButton}
            >
              📊 Market Status
            </button>
            <button 
              onClick={() => handleQuickQuery("Selling tips")}
              className={styles.quickButton}
            >
              🏪 Selling Tips
            </button>
            <button 
              onClick={() => handleQuickQuery("Buying tips")}
              className={styles.quickButton}
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