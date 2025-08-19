import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIChat from '../components/AIChat';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/Dashboard.module.css';
import authStyles from '../styles/Auth.module.css';

// CarChat Component for Seller Dashboard
function CarChat({ carId, sellerId, buyerId, currentUserId, onOpenChat, unreadCount, onMarkAsRead }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef(null);



  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages_with_names')
        .select('*')
        .eq('car_id', carId)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${buyerId}),and(sender_id.eq.${buyerId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      const formattedMessages = data?.map(msg => ({
        ...msg,
        sender_name: msg.sender_name || (msg.sender_id === currentUserId ? 'You' : 'Buyer'),
        receiver_name: msg.receiver_name || (msg.receiver_id === currentUserId ? 'You' : 'Buyer')
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('messages')
        .insert([{
          car_id: carId,
          sender_id: currentUserId,
          receiver_id: buyerId,
          message: newMessage.trim()
        }]);

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (carId && currentUserId && buyerId) {
      fetchMessages();
    }
  }, [carId, currentUserId, buyerId]);



  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length]);

    return (
      <div className="chat-icon-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => onOpenChat(carId, sellerId, buyerId, messages, setMessages, newMessage, setNewMessage, sending, sendMessage)}
            style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '20px',
            boxShadow: '0 2px 8px rgba(0,123,255,0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,123,255,0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 2px 8px rgba(0,123,255,0.3)';
          }}
          title="Chat with buyer"
        >
          💬
        </button>
        
        {/* Message Count Badge */}
        {console.log('CarChat Badge Debug:', { carId, unreadCount, showBadge: unreadCount > 0 })}
        {unreadCount > 0 && (
          <span 
            className="badge" 
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: 'red',
              color: 'white',
              borderRadius: '50%',
              padding: '3px 6px',
                fontSize: '12px',
                  fontWeight: 'bold',
              minWidth: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            {unreadCount}
          </span>
        )}
    </div>
  );
}



// Unified Chat Component for Seller
function UnifiedSellerChat({ sellerId, myCars, buyersByCar }) {
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Get all unique buyers across all cars
  const allBuyers = useMemo(() => {
    console.log('=== Building allBuyers ===');
    console.log('buyersByCar:', buyersByCar);
    console.log('buyersByCar keys:', Object.keys(buyersByCar));
    
    const buyers = [];
    const seenBuyers = new Set(); // Track seen buyer IDs
    
    // Process each car's buyers
    Object.keys(buyersByCar).forEach((carId, carIndex) => {
      const car = myCars.find(c => c.id === carId);
      if (!car) {
        console.log(`Car not found for ID: ${carId}`);
        return;
      }
      
      console.log(`\n--- Processing Car ${carIndex + 1}/${Object.keys(buyersByCar).length}: ${car.title} (${carId}) ---`);
      console.log(`Buyers for this car:`, buyersByCar[carId]);
      console.log(`Buyers array length:`, buyersByCar[carId]?.length || 0);
      
      if (!buyersByCar[carId] || buyersByCar[carId].length === 0) {
        console.log(`No buyers found for car: ${car.title}`);
        return;
      }
      
      // Add each buyer for this car
      buyersByCar[carId].forEach((buyer, buyerIndex) => {
        console.log(`Processing buyer ${buyerIndex + 1}/${buyersByCar[carId].length}:`, buyer);
        
        if (!buyer || !buyer.id) {
          console.log(`Invalid buyer data:`, buyer);
          return;
        }
        
        // Only add if we haven't seen this buyer before
        if (!seenBuyers.has(buyer.id)) {
          seenBuyers.add(buyer.id);
          const buyerData = {
            ...buyer,
            carId: carId,
            carTitle: car.title || 'Unknown Car',
            displayName: `${buyer.full_name || 'Unknown'} - ${car.title || 'Unknown Car'}`
          };
          
          console.log(`✅ Adding buyer ${buyerIndex + 1}/${buyersByCar[carId].length} for car ${car.title}:`, buyerData);
          buyers.push(buyerData);
        } else {
          console.log(`⏭️ Buyer ${buyer.full_name} already exists for car ${car.title}, skipping...`);
        }
      });
    });
    
    console.log('\n=== FINAL allBuyers RESULT ===');
    console.log('Final allBuyers array:', buyers);
    console.log('Total buyers found:', buyers.length);
    console.log('Buyers by car:');
    buyers.forEach((buyer, index) => {
      console.log(`${index + 1}. ${buyer.full_name} - ${buyer.carTitle} (Car ID: ${buyer.carId})`);
    });
    
    return buyers;
  }, [buyersByCar, myCars]);

  const fetchMessages = async () => {
    if (!selectedCar || !selectedBuyer) return;
    
    console.log('Fetching messages for:', { selectedCar, selectedBuyer, sellerId });
    
    try {
      setLoadingMessages(true);
      
      // First, get all messages for the selected car
      const { data, error } = await supabase
        .from('messages_with_names')
        .select('*')
        .eq('car_id', selectedCar)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      console.log('Raw messages data:', data);

      // Filter messages to ensure they belong to the specific car and buyer conversation
      const filteredMessages = (data || []).filter(msg => {
        // Message must be between the selected buyer and seller
        const isBetweenSelectedUsers = (
          (msg.sender_id === selectedBuyer && msg.receiver_id === sellerId) ||
          (msg.sender_id === sellerId && msg.receiver_id === selectedBuyer)
        );
        
        // Message must be for the selected car
        const isForSelectedCar = msg.car_id === selectedCar;
        
        const isValid = isBetweenSelectedUsers && isForSelectedCar;
        console.log(`Message ${msg.id}:`, {
          sender: msg.sender_id,
          receiver: msg.receiver_id,
          car: msg.car_id,
          isBetweenUsers: isBetweenSelectedUsers,
          isForCar: isForSelectedCar,
          isValid
        });
        
        return isValid;
      });

      console.log('Filtered messages:', filteredMessages);
      setMessages(filteredMessages);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading || !selectedCar || !selectedBuyer) return;

    console.log('Sending message:', {
      message: newMessage.trim(),
      carId: selectedCar,
      senderId: sellerId,
      receiverId: selectedBuyer
    });

    try {
      setLoading(true);
      
      // Add the new message to the current conversation immediately for better UX
      const newMsg = {
        id: Date.now().toString(), // Temporary ID
        car_id: selectedCar,
        sender_id: sellerId,
        receiver_id: selectedBuyer,
        message: newMessage.trim(),
        sender_name: 'You',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMsg]);
      
      const { error } = await supabase
        .from('messages')
        .insert([{
          car_id: selectedCar,
          sender_id: sellerId,
          receiver_id: selectedBuyer,
          message: newMessage.trim()
        }]);

      if (error) {
        console.error('Error sending message:', error);
        // Remove the temporary message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== newMsg.id));
        return;
      }

      console.log('Message sent successfully');
      setNewMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the temporary message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== newMsg.id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCar && selectedBuyer) {
      fetchMessages();
    }
  }, [selectedCar, selectedBuyer]);

  // Real-time subscription to new messages for current conversation
  useEffect(() => {
    if (!selectedCar || !selectedBuyer) return;

    console.log('Setting up real-time subscription for:', { selectedCar, selectedBuyer, sellerId });

    const subscription = supabase
      .channel(`messages:${selectedCar}:${selectedBuyer}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `car_id=eq.${selectedCar}`
      }, (payload) => {
        const newMessage = payload.new;
        console.log('New message received:', newMessage);
        
        // Only add message if it's relevant to current conversation
        if (
          newMessage.car_id === selectedCar &&
          ((newMessage.sender_id === selectedBuyer && newMessage.receiver_id === sellerId) ||
           (newMessage.sender_id === sellerId && newMessage.receiver_id === selectedBuyer))
        ) {
          console.log('Adding new message to current conversation:', newMessage);
          setMessages(prev => [...prev, {
            ...newMessage,
            sender_name: newMessage.sender_id === sellerId ? 'You' : 'Buyer'
          }]);
        } else {
          console.log('Message not relevant to current conversation:', {
            messageCar: newMessage.car_id,
            selectedCar,
            messageSender: newMessage.sender_id,
            messageReceiver: newMessage.receiver_id,
            selectedBuyer,
            sellerId
          });
        }
      })
      .subscribe();

    return () => {
      console.log('Unsubscribing from real-time updates');
      subscription.unsubscribe();
    };
  }, [selectedCar, selectedBuyer, sellerId]);

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length]);

  // Auto-select first buyer if available
  useEffect(() => {
    if (allBuyers.length > 0 && !selectedBuyer && !selectedCar) {
      const firstBuyer = allBuyers[0];
      console.log('Auto-selecting first buyer:', firstBuyer);
      setSelectedCar(firstBuyer.carId);
      setSelectedBuyer(firstBuyer.id);
    }
  }, [allBuyers, selectedBuyer, selectedCar]);

  if (allBuyers.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        background: '#f8f9fa',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <p>No buyers have messaged you yet.</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>When buyers contact you, their messages will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      margin: '20px 0',
      overflow: 'hidden'
    }}>
      {/* Header with buyer selection */}
      <div style={{
        background: '#667eea',
        color: 'white',
        padding: '16px 20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>💬 Chat with Buyers</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={selectedBuyer || ''}
            onChange={(e) => {
              const selectedBuyerId = e.target.value;
              console.log('Dropdown changed to:', selectedBuyerId);
              console.log('Selected buyer ID type:', typeof selectedBuyerId);
              console.log('Available buyers:', allBuyers);
              
              // Fix type mismatch: Convert to string for comparison
              const buyer = allBuyers.find(b => String(b.id) === String(selectedBuyerId));
              console.log('Found buyer:', buyer);
              console.log('Buyer ID type:', typeof buyer?.id);
              console.log('Comparison:', `String(${buyer?.id}) === String(${selectedBuyerId})`);
              
              if (buyer) {
                console.log('Setting selected buyer:', buyer);
                setSelectedCar(buyer.carId);
                setSelectedBuyer(buyer.id);
                
                // Clear messages when switching conversations
                setMessages([]);
              } else {
                console.log('No buyer found for ID:', selectedBuyerId);
                console.log('All buyer IDs:', allBuyers.map(b => ({ id: b.id, type: typeof b.id })));
              }
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: '200px'
            }}
          >
            <option value="">Select a buyer to chat...</option>
            {(() => {
              console.log('=== RENDERING DROPDOWN ===');
              console.log('allBuyers:', allBuyers);
              console.log('allBuyers.length:', allBuyers?.length);
              console.log('allBuyers type:', typeof allBuyers);
              console.log('allBuyers is array:', Array.isArray(allBuyers));
              
              if (!allBuyers || !Array.isArray(allBuyers) || allBuyers.length === 0) {
                console.log('No buyers to render');
                return <option value="" disabled>No buyers available</option>;
              }
              
              console.log(`Rendering ${allBuyers.length} buyers...`);
              
              return allBuyers.map((buyer, index) => {
                console.log(`Rendering buyer ${index + 1}/${allBuyers.length}:`, buyer);
                console.log(`Buyer ID: ${buyer.id} (type: ${typeof buyer.id})`);
                
                if (!buyer || !buyer.id) {
                  console.log(`Invalid buyer at index ${index}:`, buyer);
                  return null;
                }
                
                const optionText = buyer.displayName || `${buyer.full_name || 'Unknown'} - ${buyer.carTitle || 'Unknown Car'}`;
                console.log(`Option ${index + 1} text:`, optionText);
                console.log(`Option ${index + 1} value:`, buyer.id);
                
                return (
                  <option 
                    key={`buyer_${buyer.id}_${index}`} 
                    value={String(buyer.id)} // Ensure value is string
                    data-buyer-info={JSON.stringify(buyer)}
                  >
                    {optionText}
                  </option>
                );
              }).filter(Boolean); // Remove any null options
            })()}
          </select>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>
            {allBuyers.length} buyer{allBuyers.length > 1 ? 's' : ''} available
          </span>
        </div>
      </div>

      {/* Chat messages */}
      <div style={{
        height: '300px',
        overflowY: 'auto',
        padding: '16px',
        background: '#f8f9fb'
      }}>
        {loadingMessages ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            <p>No messages yet. Start the conversation!</p>
            {/* Debug: Show selected buyer and car info */}
            <div style={{ 
              background: '#f0f0f0', 
              padding: '10px', 
              borderRadius: '6px', 
              marginTop: '10px',
              fontSize: '12px',
              color: '#666'
            }}>
              <p><strong>Debug Info:</strong></p>
              <p>Selected Car: {selectedCar || 'None'}</p>
              <p>Selected Buyer: {selectedBuyer || 'None'}</p>
              <p>Seller ID: {sellerId || 'None'}</p>
              <p>Total Buyers: {allBuyers.length}</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender_id === sellerId ? 'flex-end' : 'flex-start',
              marginBottom: '12px'
            }}>
              <div style={{
                background: msg.sender_id === sellerId ? '#667eea' : '#e9ecef',
                color: msg.sender_id === sellerId ? 'white' : '#333',
                padding: '8px 12px',
                borderRadius: '12px',
                maxWidth: '70%',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.7, 
                  marginBottom: '4px',
                  fontWeight: 'bold'
                }}>
                  {msg.sender_name || (msg.sender_id === sellerId ? 'You' : 'Buyer')}
                </div>
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e0e0e0',
        background: '#fff'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            disabled={loading || !selectedBuyer}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim() || !selectedBuyer}
            style={{
              padding: '10px 16px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Send
            </button>
          </div>
          
          {/* Test Message Button */}
          <button
            onClick={async () => {
              if (!selectedBuyer || !selectedCar) {
                alert('Please select a buyer first');
                return;
              }
              
              try {
                const testMessage = `Test message from seller at ${new Date().toLocaleTimeString()}`;
                
                const { error } = await supabase
                  .from('messages')
                  .insert([{
                    car_id: selectedCar,
                    sender_id: sellerId,
                    receiver_id: selectedBuyer,
                    message: testMessage
                  }]);

                if (error) {
                  console.error('Error sending test message:', error);
                  alert('Error sending test message: ' + error.message);
                } else {
                  console.log('Test message sent successfully');
                  alert('✅ Test message sent successfully!');
                  // Refresh messages
                  fetchMessages();
                }
              } catch (error) {
                console.error('Error in test message:', error);
                alert('Error sending test message: ' + error.message);
              }
            }}
            style={{
              padding: '8px 12px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              alignSelf: 'flex-start'
            }}
          >
            🧪 Send Test Message
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [myCars, setMyCars] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileFormData, setProfileFormData] = useState({});
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [buyersByCar, setBuyersByCar] = useState({});
  const [sellerId, setSellerId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({}); // Track unread counts per car
  const [imageIndexes, setImageIndexes] = useState({});
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatCarId, setChatCarId] = useState(null);
  const [chatBuyerId, setChatBuyerId] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [localMessage, setLocalMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [availableCars, setAvailableCars] = useState(0);
  const [soldCars, setSoldCars] = useState(0);
  const [buyersLoading, setBuyersLoading] = useState(true); // Add loading state for buyers
  const [stripeSetupLoading, setStripeSetupLoading] = useState(false); // Add loading state for Stripe setup


  // Chat functions
  const onOpenChat = (carId, sellerId, buyerId, messages, setMessages, newMessage, setNewMessage, sending, sendMessage) => {
    setChatCarId(carId);
    setChatBuyerId(buyerId);
    setShowChatModal(true);
    
    // Copy existing messages to local state
    setLocalMessages(messages || []);
    
    // Store chat data for modal
    setChatData({ 
      messages, 
      setMessages, 
      newMessage, 
      setNewMessage, 
      sending, 
      sendMessage
    });
    
    // Mark messages as read for this specific car
    if (carId && sellerId) {
      markMessagesAsRead(carId, sellerId);
    }
  };

  const closeChat = () => {
    setShowChatModal(false);
    setChatCarId(null);
    setChatBuyerId(null);
    setChatData(null);
    setLocalMessage('');
    setSending(false);
    setLocalMessages([]);
  };

  const markMessagesAsRead = async (carId, sellerId) => {
    try {
      console.log('🔍 Marking messages as read for car:', carId, 'seller:', sellerId);
      
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('car_id', carId)
        .eq('receiver_id', sellerId)
        .eq('is_read', false);
      
      if (error) {
        console.error('❌ Error marking messages as read:', error);
      } else {
        console.log('✅ Messages marked as read for car:', carId);
        // Reset unread count for this car
        setUnreadCounts(prev => ({
          ...prev,
          [carId]: 0
        }));
      }
    } catch (error) {
      console.error('❌ Error in markMessagesAsRead:', error);
    }
  };



  const handleSendMessage = async () => {
    if (!localMessage.trim() || !chatCarId || !chatBuyerId || !user?.id) return;
    
    try {
      setSending(true);
      
      // Create new message object
      const newMessageObj = {
        id: Date.now(),
        car_id: chatCarId,
        sender_id: user.id,
        receiver_id: chatBuyerId,
        message: localMessage.trim(),
        sender_name: 'You',
        receiver_name: 'Buyer',
        created_at: new Date().toISOString()
      };
      
      // Add message to local messages immediately (optimistic update)
      setLocalMessages(prev => [...prev, newMessageObj]);
      
      // Send message to database
      const { error } = await supabase
        .from('messages')
        .insert([{
          car_id: chatCarId,
          sender_id: user.id,
          receiver_id: chatBuyerId,
          message: localMessage.trim()
        }]);
      
      if (error) {
        console.error('Error sending message:', error);
        // Remove message from local state if database save failed
        setLocalMessages(prev => prev.filter(msg => msg.id !== newMessageObj.id));
        return;
      }
      
      // Clear input
      setLocalMessage('');
      
      // Refresh messages in CarChat component
      if (chatData?.setMessages) {
        chatData.setMessages(prev => [...prev, newMessageObj]);
      }
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    } finally {
      setSending(false);
    }
  };

  // Helper to get all images for a car
  const getAllImages = (car) => {
    const images = [];
    if (car.image_url && car.image_url.trim() !== '') images.push(car.image_url);
    if (car.additional_images && Array.isArray(car.additional_images)) images.push(...car.additional_images.filter(img => img && img.trim() !== ''));
    return images.length > 0 ? images : ['/carp2.png'];
  };

  useEffect(() => {
    const fetchSeller = async () => {
      console.log('🔍 fetchSeller useEffect triggered');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('✅ User found, setting sellerId:', user.id);
        setSellerId(user.id);
      } else {
        console.log('❌ No user found');
      }
    };
    fetchSeller();
  }, []);

  useEffect(() => {
    console.log('🔍 fetchUnread useEffect triggered, sellerId:', sellerId);
    if (!sellerId) {
      console.log('❌ sellerId not available, returning early');
      return;
    }
    
    const fetchUnread = async () => {
      try {
        console.log('📡 Fetching unread messages for sellerId:', sellerId);
        
        // Get unread messages count per car for the seller
        const { data, error } = await supabase
        .from('messages')
        .select('car_id, id')
        .eq('receiver_id', sellerId)
        .eq('is_read', false);

        if (error) {
          console.error('❌ Error fetching unread counts:', error);
          setUnreadCounts({});
        } else {
          console.log('✅ Unread messages data received:', data);
          console.log('📊 Raw data length:', data?.length || 0);
          
          // Group unread messages by car_id
          const counts = {};
          data?.forEach(msg => {
            console.log('📝 Processing message:', msg);
            counts[msg.car_id] = (counts[msg.car_id] || 0) + 1;
          });
          
          console.log('🎯 Final unread counts per car:', counts);
          console.log('🔢 Total cars with unread messages:', Object.keys(counts).length);
          setUnreadCounts(counts);
        }
      } catch (error) {
        console.error('❌ Error in fetchUnread:', error);
        setUnreadCounts({});
      }
    };
    
    fetchUnread();
    
    // Set up real-time subscription for unread messages
    const subscription = supabase
      .channel('unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${sellerId}`
      }, (payload) => {
        console.log('New message received, updating unread count for car:', payload.new.car_id);
        setUnreadCounts(prev => ({
          ...prev,
          [payload.new.car_id]: (prev[payload.new.car_id] || 0) + 1
        }));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${sellerId}`
      }, (payload) => {
        // If message is marked as read, decrease unread count for that car
        if (payload.new.is_read === true && payload.old.is_read === false) {
          setUnreadCounts(prev => ({
            ...prev,
            [payload.new.car_id]: Math.max(0, (prev[payload.new.car_id] || 0) - 1)
          }));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sellerId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
      console.log('Current user:', user);
      
      // Fetch profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      console.log('User profile:', profile);
      
      // Fetch seller's cars with approval status
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select(`
          *,
          admin_approvals(
            approval_status,
            approved_at,
            admin_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      console.log('Fetched cars:', cars);
      console.log('Cars error:', carsError);
      console.log('Number of cars fetched:', cars?.length || 0);
      
      setMyCars(cars || []);
      
      // Check for pending approvals - improved logic
      const pendingCars = cars?.filter(car => {
        // If car has admin_approvals, check latest approval status
        if (car.admin_approvals && car.admin_approvals.length > 0) {
          const latestApproval = car.admin_approvals[car.admin_approvals.length - 1];
          console.log(`Car ${car.title} approval status:`, latestApproval.approval_status);
          // Car is pending if status is not 'approved' or 'rejected'
          return latestApproval.approval_status !== 'approved' && latestApproval.approval_status !== 'rejected';
        }
        // If no approval record, consider it pending
        console.log(`Car ${car.title} has no approval record - considered pending`);
        return true;
      }) || [];
      
      console.log('Pending approvals count:', pendingCars.length);
      setPendingApprovals(pendingCars);
      
      // Calculate available and sold cars
      const availableCars = cars?.filter(car => {
        const hasApproval = car.admin_approvals && car.admin_approvals.length > 0;
        const isApproved = hasApproval && car.admin_approvals.some(approval => approval.approval_status === 'approved');
        return car.status === 'available' && isApproved;
      }) || [];
      
      const soldCars = cars?.filter(car => car.status === 'sold') || [];
      
      console.log('Available (approved) cars:', availableCars.length);
      console.log('Sold cars:', soldCars.length);
      
      // Set state variables
      setAvailableCars(availableCars.length);
      setSoldCars(soldCars.length);
      
      // Fetch sales (purchases where seller is current user)
      const { data: salesData, error: salesError } = await supabase
        .from('purchases_with_details')
        .select('*')
        .eq('seller_id', user.id);
      
      if (salesError) {
        console.error('Error fetching from purchases_with_details:', salesError);
        setSales([]);
      } else {
        console.log('Sales with details:', salesData);
    setSales(salesData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [router]);

  // Fetch buyers for each car after myCars are loaded
  useEffect(() => {
    if (!myCars || myCars.length === 0 || !sellerId) return;
    const fetchAllBuyers = async () => {
      console.log('=== fetchAllBuyers START ===');
      console.log('Total cars to process:', myCars.length);
      console.log('myCars:', myCars.map(c => ({ id: c.id, title: c.title })));
      console.log('sellerId:', sellerId);
      
      const buyersMap = {};
      
      for (const car of myCars) {
        console.log(`\n--- Processing Car: ${car.title} (${car.id}) ---`);
        
        // Fetch buyers who sent messages TO the seller for THIS car
        const { data, error } = await supabase
          .from('messages')
          .select('sender_id, sender:profiles!messages_sender_id_fkey(full_name)')
          .eq('car_id', car.id)
          .eq('receiver_id', sellerId);
        
        if (error) {
          console.error('Error fetching messages for car:', car.id, error);
          continue;
        }
        
        console.log(`Messages for car ${car.title}:`, data);
        console.log(`Total messages for this car:`, data?.length || 0);
        
        // Process message buyers for this car
        const carBuyers = [];
        (data || []).forEach((row, index) => {
          if (row.sender_id && row.sender_id !== sellerId) {
            const buyer = {
              id: row.sender_id,
              full_name: row.sender?.full_name || 'Unknown Buyer',
              carId: car.id,
              carTitle: car.title || 'Unknown Car'
            };
            
            console.log(`Adding message buyer ${index + 1}/${data.length} for car ${car.title}:`, buyer);
            carBuyers.push(buyer);
          }
        });
        
        buyersMap[car.id] = carBuyers;
        console.log(`Total buyers for car ${car.title}:`, carBuyers.length);
        console.log(`Buyers for car ${car.title}:`, carBuyers);
      }
      
      console.log('\n=== FINAL RESULTS ===');
      console.log('Final buyersMap:', buyersMap);
      console.log('Total cars processed:', Object.keys(buyersMap).length);
      console.log('Cars with buyers:', Object.keys(buyersMap).filter(carId => buyersMap[carId].length > 0));
      console.log('Total unique buyers across all cars:', new Set(Object.values(buyersMap).flat().map(b => b.id)).size);
      
      setBuyersByCar(buyersMap);
      console.log('=== fetchAllBuyers END ===\n');
    };
    
    fetchAllBuyers();
  }, [myCars, sellerId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    router.push('/');
  };

  // Refresh data function
  const refreshData = async () => {
    setLoading(true);
    // Fetch seller's cars directly from cars table
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('Refreshed cars:', cars);
    console.log('Cars error:', carsError);
    
    setMyCars(cars || []);
    
    // Fetch sales (purchases where seller is current user)
    const { data: salesData, error: salesError } = await supabase
        .from('purchases_with_details')
      .select('*')
      .eq('seller_id', user.id);
    
      if (salesError) {
        console.error('Error fetching from purchases_with_details:', salesError);
        setSales([]);
      } else {
        console.log('Sales with details:', salesData);
    setSales(salesData || []);
      }
    setLoading(false);
  };

  // Delete car function
  const handleDeleteCar = async (carId) => {
    console.log('Delete car clicked for carId:', carId);
    
    if (!confirm('Are you sure you want to delete this car? This action cannot be undone.')) {
      console.log('Delete cancelled by user');
      return;
    }

    try {
      console.log('Attempting to delete car with ID:', carId);
      
      // Delete the car
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId);

      if (error) {
        console.error('Delete error:', error);
        alert('Error deleting car: ' + error.message);
        return;
      }

      console.log('Car deleted successfully');
      
      // Show success message
      alert('✅ Car deleted successfully!');
      
      // Refresh the cars list
      refreshData();
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting car: ' + error.message);
    }
  };

  // Edit Profile logic
  const handleEditProfile = () => {
    setEditName(userProfile?.full_name || '');
    setEditEmail(user?.email || '');
    setOriginalName(userProfile?.full_name || '');
    setOriginalEmail(user?.email || '');
    setShowEditProfileModal(true);
    setProfileMsg('');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    if (!editName || !editEmail) {
      setProfileMsg('❌ Name and email are required.');
      return;
    }
    
        try {
      // Update profile in Supabase with basic fields
    const { error: profileError } = await supabase
      .from('profiles')
        .update({ 
          full_name: editName
        })
      .eq('id', user.id);
        
    if (profileError) {
      setProfileMsg('❌ ' + profileError.message);
      return;
    }
      
    // Update email in auth
    const { error: emailError } = await supabase.auth.updateUser({ email: editEmail });
    if (emailError) {
      setProfileMsg('❌ ' + emailError.message);
      return;
    }
      
    setProfileMsg('✅ Profile updated successfully!');
      setUserProfile({ 
        ...userProfile, 
        full_name: editName
      });
      setShowEditProfileModal(false);
      
    // Optionally, refresh user info
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    setUser(refreshedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileMsg('❌ An unexpected error occurred: ' + error.message);
    }
  };

  // Mark messages as read when chat modal is opened
  const handleChatModalOpen = async () => {
    setShowChatModal(true);
    
    // Mark all unread messages as read
    if (unreadCount > 0 && sellerId) {
      try {
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('receiver_id', sellerId)
          .eq('read', false);
        
        if (error) {
          console.error('Error marking messages as read:', error);
        } else {
          console.log('Messages marked as read');
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('Error in handleChatModalOpen:', error);
      }
    }
  };

  const handleCompleteStripeSetup = async () => {
    setStripeSetupLoading(true);
    try {
      console.log('Initiating Stripe setup for user:', user.id);
      
      // Call the new create-seller-account API
      const response = await fetch('/api/create-seller-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          country: 'US'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        console.log('✅ Seller account created, redirecting to Stripe onboarding...');
        setProfileMsg('✅ Seller account created! Redirecting to payment setup...');
        
        // Redirect to Stripe onboarding
        setTimeout(() => {
          window.location.href = data.url;
        }, 2000);
      } else {
        console.error('Seller account creation failed:', data.error);
        setProfileMsg('❌ Seller setup failed: ' + (data.error || 'Unknown error'));
        setStripeSetupLoading(false);
      }
    } catch (error) {
      console.error('Error in handleCompleteStripeSetup:', error);
      setProfileMsg('❌ An unexpected error occurred: ' + error.message);
      setStripeSetupLoading(false);
    }
  };



  if (loading) {
    return (
      <div>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}>Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>

      <Navbar logoText="Seller Dashboard" />
      <div className={styles.dashboardContainer}>
        <div className={styles.sidebar}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {userProfile?.full_name?.charAt(0) || 'S'}
            </div>
            <h3>{userProfile?.full_name || 'Seller'}</h3>
            <p>Car Seller</p>
          </div>
            

          
          {/* Stripe Setup Reminder */}
          {userProfile && !userProfile.stripe_account_id && (
            <div className={styles.stripeSetupReminder}>
              <div className={styles.reminderIcon}>⚠️</div>
              <div className={styles.reminderContent}>
                <h4>Payment Setup Required</h4>
                <p>Complete your Stripe setup to receive payments</p>
                <button 
                  className={styles.completeSetupBtn}
                  onClick={handleCompleteStripeSetup}
                  disabled={stripeSetupLoading}
                >
                  {stripeSetupLoading ? 'Setting up...' : 'Complete Stripe Setup'}
                </button>
              </div>
            </div>
          )}



          {/* Profile Messages */}
          {profileMsg && (
            <div className={`${styles.profileMessage} ${profileMsg.includes('✅') ? styles.success : styles.error}`}>
              <span className={styles.messageText}>{profileMsg}</span>
              <button 
                className={styles.closeMessage}
                onClick={() => setProfileMsg('')}
              >
                ×
              </button>
            </div>
          )}

          <nav className={styles.sidebarNav}>
            <button 
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Dashboard
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'my-cars' ? styles.active : ''}`}
              onClick={() => setActiveTab('my-cars')}
            >
              My Cars
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'add-car' ? styles.active : ''}`}
              onClick={() => router.push('/add-car')}
            >
              Add New Car
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>

            <button 
              className={`${styles.navItem} ${activeTab === 'aihelp' ? styles.active : ''}`}
              onClick={() => setActiveTab('aihelp')}
            >
              🤖 AI Assistant
            </button>

          </nav>
        </div>

        <div className={styles.mainContent}>
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <h3>{myCars.length}</h3>
                  <p>Total Cars Listed</p>
                </div>
                <div className={styles.statCard}>
                  <h3>{soldCars}</h3>
                  <p>Cars Sold</p>
                </div>
                <div className={styles.statCard}>
                  <h3>{availableCars}</h3>
                  <p>Cars Available & Approved</p>
                </div>
                <div className={styles.statCard}>
                  <h3>{sales.length}</h3>
                  <p>Total Sales</p>
                </div>
              </div>

              <div className={styles.recentCars}>
                <h2>Available & Approved Cars</h2>
                {(() => {
                  // Filter only available and approved cars
                  const availableApprovedCars = myCars.filter(car => {
                    const hasApproval = car.admin_approvals && car.admin_approvals.length > 0;
                    const isApproved = hasApproval && car.admin_approvals.some(approval => approval.approval_status === 'approved');
                    return car.status === 'available' && isApproved;
                  });

                  if (availableApprovedCars.length === 0) {
                    return (
                      <div className={styles.emptyState}>
                        <p>No available and approved cars yet. Your cars are either pending approval or sold.</p>
                        <button 
                          className={styles.addCarBtn}
                          onClick={() => router.push('/add-car')}
                        >
                          Add New Car
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className={styles.carsGrid}>
                      {availableApprovedCars.map(car => (
                        <div key={car.id} className={styles.carCard} style={{ marginBottom: 32 }}>
                          {/* Gallery block */}
                          <div className={styles.carImageContainer}>
                            {/* Main image */}
                            <img
                              src={getAllImages(car)[imageIndexes[car.id] || 0]}
                              alt={car.title}
                            />
                            {/* Thumbnails row - only show if more than 1 image */}
                            {getAllImages(car).length > 1 && (
                              <div className={styles.thumbnailsRow}>
                                {getAllImages(car).map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className={
                                      styles.thumbnail +
                                      ((imageIndexes[car.id] || 0) === idx ? ' ' + styles.activeThumbnail : '')
                                    }
                                    onClick={() => setImageIndexes(prev => ({ ...prev, [car.id]: idx }))}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={styles.carInfo}>
                            <h3>{car.title}</h3>
                            <p>{car.description}</p>
                            <p className={styles.price}>${car.price?.toLocaleString()}</p>
                            <p className={car.status === 'sold' ? styles.sold : styles.available}>
                              {car.status === 'sold' ? 'Sold' : 'Available'}
                            </p>
                            {car.admin_approvals && car.admin_approvals.length > 0 && (
                              <p className={`${styles.approvalStatus} ${styles[car.admin_approvals[car.admin_approvals.length - 1].approval_status]}`}>
                                Approval: {car.admin_approvals[car.admin_approvals.length - 1].approval_status}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              
            </div>
          )}

          {activeTab === 'my-cars' && (
            <div className={styles.myCars}>
              {myCars.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>You haven't listed any cars yet.</p>
                  <button 
                    className={styles.addCarBtn}
                    onClick={() => router.push('/add-car')}
                  >
                    List Your First Car
                  </button>
                </div>
              ) : (
                <div className={styles.carsGrid}>
                  {myCars.map(car => {
                    const sale = sales.find(s => (s.car_id === (car.car_id || car.id)));
                    
                    // Determine approval status
                    let approvalStatus = 'pending';
                    let approvalStatusClass = 'pending';
                    
                    if (car.status === 'sold') {
                      // Sold cars are automatically considered approved
                      approvalStatus = 'approved';
                      approvalStatusClass = 'approved';
                    } else if (car.admin_approvals && car.admin_approvals.length > 0) {
                      // Check latest approval status
                      const latestApproval = car.admin_approvals[car.admin_approvals.length - 1];
                      approvalStatus = latestApproval.approval_status;
                      approvalStatusClass = latestApproval.approval_status;
                    }
                    
                    return (
                      <div key={car.car_id || car.id} className={styles.carCard} style={{ marginBottom: 32 }}>
                        {/* Gallery block */}
                        <div className={styles.carImageContainer}>
                          {/* Main image */}
                          <img
                            src={getAllImages(car)[imageIndexes[car.id] || 0]}
                            alt={car.title}
                          />
                          {/* Thumbnails row */}
                          {getAllImages(car).length > 1 && (
                            <div className={styles.thumbnailsRow}>
                              {getAllImages(car).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Thumbnail ${idx + 1}`}
                                  className={
                                    styles.thumbnail +
                                    ((imageIndexes[car.id] || 0) === idx ? ' ' + styles.activeThumbnail : '')
                                  }
                                  onClick={() => setImageIndexes(prev => ({ ...prev, [car.id]: idx }))}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={styles.carInfo}>
                          <h3>{car.title}</h3>
                          <p>{car.description}</p>
                          <p className={styles.price}>${car.price?.toLocaleString()}</p>
                          
                          {/* Car Status */}
                          <div className={styles.carStatusRow}>
                            <p className={car.status === 'sold' ? styles.sold : styles.available}>
                              {car.status === 'sold' ? 'Sold' : 'Available'}
                            </p>
                            
                            {/* Approval Status */}
                            <p className={`${styles.approvalStatus} ${styles[approvalStatusClass]}`}>
                              {car.status === 'sold' ? '✅ Auto-Approved' : `Approval: ${approvalStatus}`}
                            </p>
                          </div>
                          
                          {/* Buyer Info for Sold Cars */}
                          {car.status === 'sold' && sales.find(s => s.car_id === car.id) && (
                            <div className={styles.buyerInfo}>
                              {(() => {
                                const sale = sales.find(s => s.car_id === car.id);
                                return (
                                  <>
                                    <span>Buyer: <b>{sale.buyer_name || 'N/A'}</b></span>
                                    {sale.buyer_email && (
                                      <span style={{ marginLeft: 8, color: '#888' }}>({sale.buyer_email})</span>
                                    )}

                                  </>
                                );
                              })()}
                            </div>
                          )}
                          
                          {/* Only show actions for non-sold cars */}
                          {car.status !== 'sold' && (
                            <div className={styles.carActions}>
                              <button 
                                className={styles.editBtn}
                                onClick={() => router.push(`/edit-car/${car.car_id || car.id}`)}
                              >Edit</button>
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteCar(car.car_id || car.id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                          
                          {/* Chat Section for each car */}
                          <div style={{ marginTop: 12 }}>
                            <CarChat 
                              carId={car.car_id || car.id} 
                              sellerId={sellerId} 
                              buyerId={buyersByCar[car.car_id || car.id]?.[0]?.id} 
                              currentUserId={sellerId} 
                              onOpenChat={onOpenChat}
                              unreadCount={unreadCounts[car.car_id || car.id] || 0}
                              onMarkAsRead={() => {}}
                            />
                            {console.log('🎯 Main Component Badge Debug:', { 
                              carId: car.car_id || car.id, 
                              carTitle: car.title,
                              unreadCounts, 
                              count: unreadCounts[car.car_id || car.id] || 0,
                              showBadge: (unreadCounts[car.car_id || car.id] || 0) > 0,
                              allUnreadCounts: unreadCounts
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className={styles.profile}>
              <h1>Profile Settings</h1>
              <div className={styles.profileCard}>
                <div className={styles.profileInfo}>
                  <div className={styles.avatar}>
                    {userProfile?.full_name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h3>{userProfile?.full_name || 'Seller'}</h3>
                    <p>{user?.email}</p>
                    <p>Car Seller</p>
                  </div>
                </div>
                <button className={styles.editProfileBtn} onClick={handleEditProfile}>Edit Profile</button>
              </div>

            </div>
          )}
          {activeTab === 'aihelp' && (
            <div className={styles.aiAssistant}>
              <div className={styles.sectionHeader}>
                <h1>🤖 AI Car Assistant</h1>
                <p>Car selling ke liye expert advice len! Market analysis, pricing tips aur zyada.</p>
              </div>
              <div className={styles.chatSection}>
                <AIChat 
                  context="seller-dashboard"
                  isFloating={false}
                  userId={user?.id}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            {/* Chat Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>💬 Chat with Buyer</h3>
                <small style={{ opacity: 0.9, fontSize: '12px' }}>Car ID: {chatCarId}</small>
              </div>
              <button
                onClick={closeChat}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Chat Interface */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px',
              background: '#f8f9fa',
              minHeight: '250px'
            }}>
              {localMessages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#888', 
                  marginTop: '80px',
                  fontSize: '14px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                  No messages yet.<br/>
                  <small style={{ fontSize: '12px', opacity: '0.7' }}>Start the conversation!</small>
                </div>
              ) : (
                localMessages.map((msg, index) => (
                  <div key={msg.id || index} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.sender_id === user?.id ? 'flex-end' : 'flex-start',
                    marginBottom: 16
                  }}>
                    <div style={{
                      background: msg.sender_id === user?.id ? '#007bff' : '#fff',
                      color: msg.sender_id === user?.id ? 'white' : '#333',
                      padding: '10px 14px',
                      borderRadius: '16px',
                      maxWidth: '80%',
                      fontSize: '13px',
                      lineHeight: 1.4,
                      wordWrap: 'break-word',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      border: msg.sender_id === user?.id ? 'none' : '1px solid #e0e0e0'
                    }}>
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: '11px',
                        marginBottom: 4,
                        opacity: 0.9
                      }}>
                        {msg.sender_name}
                      </div>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Chat Input */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              alignItems: 'flex-end',
              padding: '16px 20px',
              background: '#fff',
              borderTop: '1px solid #eee',
              position: 'relative',
              zIndex: 10
            }}>
              <textarea
                value={localMessage}
                onChange={(e) => setLocalMessage(e.target.value)}
                onKeyPress={(e) => { 
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleSendMessage(); 
                  } 
                }}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  resize: 'none',
                  minHeight: '50px',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  position: 'relative',
                  zIndex: 10
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff';
                  e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#ddd';
                  e.target.style.boxShadow = 'none';
                }}
                rows="2"
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!localMessage.trim() || sending}
                style={{
                  background: localMessage.trim() && !sending ? '#007bff' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: localMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 10
                }}
                onMouseOver={(e) => {
                  if (localMessage.trim() && !sending) {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (localMessage.trim() && !sending) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                {sending ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ 
            background: '#fff', 
            padding: 0, 
            borderRadius: 20, 
            width: '100%', 
            maxWidth: 500, 
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '24px 32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: '700' }}>Edit Profile</h2>
              <button 
                onClick={() => setShowEditProfileModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.3)';
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.2)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            </div>
            
                        {/* Modal Body */}
            <div style={{ padding: '32px', overflowY: 'auto' }}>
              <form onSubmit={handleProfileUpdate} className={authStyles.authForm} style={{ margin: 0 }}>
                <div className={authStyles.formGroup}>
                  <label>Full Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    className={authStyles.input}
                    placeholder="Enter your full name"
                      required
                    />
                  </div>
                <div className={authStyles.formGroup}>
                  <label>Email <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                    className={authStyles.input}
                    placeholder="Enter your email address"
                      required
                    />
                  </div>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                  <button 
                    type="submit" 
                    className={authStyles.submitBtn} 
                    style={{ 
                      flex: 1,
                      background: (editName !== originalName || editEmail !== originalEmail) ? '#667eea' : '#ccc',
                      color: (editName !== originalName || editEmail !== originalEmail) ? 'white' : '#666',
                      cursor: (editName !== originalName || editEmail !== originalEmail) ? 'pointer' : 'not-allowed'
                    }}
                    disabled={editName === originalName && editEmail === originalEmail}
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className={authStyles.submitBtn} 
                    style={{ 
                      background: '#ccc', 
                      color: '#333',
                      flex: 1
                    }} 
                    onClick={() => setShowEditProfileModal(false)}
                  >
                    Cancel
                  </button>
                </div>
                
                  {profileMsg && (
                  <div className={`${authStyles.message} ${profileMsg.startsWith('✅') ? authStyles.success : authStyles.error}`} style={{ marginTop: 20 }}>
                    {profileMsg}
                  </div>
                  )}
                </form>
            </div>
              </div>
            </div>
          )}

      <Footer userType="seller" />
    </div>
  );
} 