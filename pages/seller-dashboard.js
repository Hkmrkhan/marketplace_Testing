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
          •
        </button>
        
        {/* Message Count Badge */}
        
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
  const [buyerProfiles, setBuyerProfiles] = useState({}); // Store buyer profile information
  const [imageIndexes, setImageIndexes] = useState({});
  const [showChatModal, setShowChatModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [chatCarId, setChatCarId] = useState(null);
  const [chatBuyerId, setChatBuyerId] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [localMessage, setLocalMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [currentChatMessages, setCurrentChatMessages] = useState([]); // Messages for current chat only
  const [chatListData, setChatListData] = useState([]); // Chat list from seller_chat_list view
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [availableCars, setAvailableCars] = useState(0);
  const [soldCars, setSoldCars] = useState(0);
  const [buyersLoading, setBuyersLoading] = useState(true); // Add loading state for buyers
  const [stripeSetupLoading, setStripeSetupLoading] = useState(false); // Add loading state for Stripe setup
  
  // 🔹 Chat Functions (functions already exist above)


  // Fetch chat list from seller_chat_list view
  const fetchChatList = async () => {
    try {
      console.log('📱 Fetching chat list from seller_chat_list view...');
      const { data, error } = await supabase
        .from('seller_chat_list')
        .select('*')
        .eq('seller_id', user?.id)
        .order('last_message_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching chat list:', error);
        return;
      }
      
      console.log('✅ Chat list fetched successfully:', data?.length || 0, 'chats');
      setChatListData(data || []);
    } catch (error) {
      console.error('❌ Error in fetchChatList:', error);
    }
  };

  // Fetch chat list when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchChatList();
    }
  }, [user?.id]);

  // Fetch buyer profiles for chat list
  const fetchBuyerProfiles = async (buyerIds) => {
    try {
      if (!buyerIds || buyerIds.length === 0) return;
      
      const uniqueBuyerIds = [...new Set(buyerIds)];
      console.log('👥 Fetching buyer profiles for:', uniqueBuyerIds);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uniqueBuyerIds);
      
      if (error) {
        console.error('❌ Error fetching buyer profiles:', error);
        return;
      }
      
      const profilesMap = {};
      data?.forEach(profile => {
        profilesMap[profile.id] = profile;
      });
      
      setBuyerProfiles(profilesMap);
      console.log('✅ Buyer profiles fetched:', Object.keys(profilesMap).length);
    } catch (error) {
      console.error('❌ Error in fetchBuyerProfiles:', error);
    }
  };

  // Fetch existing messages for a specific car and buyer
  const fetchExistingMessages = async (carId, sellerId, buyerId) => {
    try {
      console.log('📡 Seller: Fetching existing messages for car:', carId, 'seller:', sellerId, 'buyer:', buyerId);
      
      // Try to get messages with user names from messages_with_names view first
      let { data, error } = await supabase
        .from('messages_with_names')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: true });

      // If messages_with_names fails, get from basic messages table
      if (error || !data) {
        console.log('⚠️ messages_with_names failed, trying basic messages table...');
        const result = await supabase
          .from('messages')
          .select('*')
          .eq('car_id', carId)
          .order('created_at', { ascending: true });
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Seller: Error fetching messages:', error);
        return [];
      }

      // Filter messages to only include conversation between seller and specific buyer
      // AND ensure the message is for the specific car
      const filteredMessages = data?.filter(msg => {
        // Message should be between seller and the specific buyer
        // AND should be for the specific car
        const isCorrectParticipants = (msg.sender_id === sellerId && msg.receiver_id === buyerId) ||
                                    (msg.sender_id === buyerId && msg.receiver_id === sellerId);
        
        const isCorrectCar = msg.car_id === carId;
        
        console.log('🔍 Message filter check:', {
          messageId: msg.id,
          carId: msg.car_id,
          expectedCarId: carId,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          expectedSellerId: sellerId,
          expectedBuyerId: buyerId,
          isCorrectParticipants,
          isCorrectCar,
          shouldInclude: isCorrectParticipants && isCorrectCar
        });
        
        return isCorrectParticipants && isCorrectCar;
      }) || [];

      // Add sender names if not present - FIXED BUYER IDENTIFICATION
      const messagesWithNames = filteredMessages.map(msg => {
        let senderName = 'You';
        let receiverName = 'Buyer';
        
        if (msg.sender_id === sellerId) {
          senderName = 'You';
          receiverName = msg.receiver_name || `Buyer ${buyerId.substring(0, 8)}`;
        } else {
          senderName = msg.sender_name || `Buyer ${buyerId.substring(0, 8)}`;
          receiverName = 'You';
        }
        
        return {
          ...msg,
          sender_name: senderName,
          receiver_name: receiverName
        };
      });

      console.log('✅ Seller: Messages filtered for specific buyer successfully:', messagesWithNames.length, 'messages');
      if (messagesWithNames.length > 0) {
        console.log('📝 Seller: Sample message with names:', messagesWithNames[0]);
      }

      // Mark messages as read for this specific buyer
      if (buyerId && sellerId) {
        try {
          const { error: updateError } = await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('car_id', carId)
            .eq('sender_id', buyerId)
            .eq('receiver_id', sellerId)
            .eq('is_read', false);
          
          if (!updateError) {
            console.log('✅ Messages marked as read for buyer:', buyerId);
            // Update unread counts
            setUnreadCounts(prev => ({
              ...prev,
              [carId]: Math.max(0, (prev[carId] || 0) - 1)
            }));
          }
        } catch (error) {
          console.log('⚠️ Could not mark messages as read:', error);
        }
      }

      return messagesWithNames;
    } catch (error) {
      console.error('❌ Seller: Error in fetchExistingMessages:', error);
      return [];
    }
  };

  // Chat functions
  const onOpenChat = async (carId, sellerId, buyerId, messages, setMessages, newMessage, setNewMessage, sending, sendMessage) => {
    console.log('🚀 Seller: onOpenChat function called!');
    console.log('📊 Parameters received:', { carId, sellerId, buyerId, messages: messages?.length });
    
    setChatCarId(carId);
    setShowChatModal(true);
    
    // Always fetch fresh messages from database
    console.log('📡 Seller: Fetching fresh messages from database...');
    const existingMessages = await fetchExistingMessages(carId, sellerId, buyerId);
    setLocalMessages(existingMessages);
    console.log('✅ Seller: Fresh messages loaded:', existingMessages.length);
    
    // Try to get buyer ID from messages
    let actualBuyerId = buyerId;
    if (!actualBuyerId && existingMessages.length > 0) {
      const buyerMessage = existingMessages.find(msg => msg.sender_id !== sellerId);
      if (buyerMessage) {
        actualBuyerId = buyerMessage.sender_id;
        console.log('✅ Seller: Found buyer ID from messages:', actualBuyerId);
      }
    }
    
    // Set the buyer ID for the chat
    setChatBuyerId(actualBuyerId);
    
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
              markMessagesAsRead(carId, sellerId, buyerId);
    }
    
    console.log('🎯 Seller: Chat modal should now be visible');
    console.log('👤 Final buyer ID for chat:', actualBuyerId);
  };

  const closeChat = () => {
    console.log('🔒 Seller: Closing chat...');
    setShowChatModal(false);
    setChatCarId(null);
    setChatBuyerId(null);
    setChatData(null);
    setLocalMessage('');
    setSending(false);
    // Clear current chat messages when closing
    setCurrentChatMessages([]);
    console.log('✅ Seller: Chat closed, messages cleared');
  };

  // Open chat function
  const openChat = async (carId, buyerId) => {
    console.log('🎯 Opening chat for car:', carId, 'buyer:', buyerId);
    
    // Clear old chat data first
    setCurrentChatMessages([]);
    setLocalMessage('');
    
    // Set new chat context
    setShowChatModal(true);
    setChatCarId(carId);
    setChatBuyerId(buyerId);
    
    // Show loading state
    setCurrentChatMessages([{ 
      id: 'loading', 
      message: 'Loading messages...', 
      sender_name: 'System',
      created_at: new Date().toISOString()
    }]);
    
    // Fetch fresh messages for this specific chat
    const messages = await fetchExistingMessages(carId, user?.id, buyerId);
    console.log('📨 Fresh messages loaded for car:', carId, 'buyer:', buyerId, 'count:', messages.length);
    
    // Double-check that we're still in the same context
    if (chatCarId === carId && chatBuyerId === buyerId) {
      setCurrentChatMessages(messages);
      console.log('✅ Context verified, messages set successfully');
    } else {
      console.log('⚠️ Context changed during fetch, not updating messages');
    }
    
    // Mark messages as read and update unread count
          await markMessagesAsRead(carId, user?.id, buyerId);
    
    // Update unread count - remove count for specific buyer-car combination
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      const key = `${carId}-${buyerId}`;
      if (newCounts[key]) {
        delete newCounts[key];
        console.log('📊 Removed unread count for car:', carId, 'buyer:', buyerId);
      }
      return newCounts;
    });
  };

  // Refresh current chat messages
  const refreshCurrentChat = async () => {
    if (!chatCarId || !chatBuyerId || !user?.id) {
      console.log('⚠️ Cannot refresh: missing chat context');
      return;
    }
    
    console.log('🔄 Refreshing current chat for car:', chatCarId, 'buyer:', chatBuyerId);
    
    // Fetch fresh messages
    const freshMessages = await fetchExistingMessages(chatCarId, user.id, chatBuyerId);
    console.log('📨 Fresh messages loaded:', freshMessages.length);
    
    // Only update if context is still the same
    if (chatCarId && chatBuyerId) {
      setCurrentChatMessages(freshMessages);
      console.log('✅ Current chat refreshed successfully');
    } else {
      console.log('⚠️ Context changed during refresh, not updating');
    }
  };

  // Refresh messages function
  const refreshMessages = async () => {
    if (chatCarId && sellerId) {
      console.log('🔄 Seller: Refreshing messages...');
      const freshMessages = await fetchExistingMessages(chatCarId, sellerId, chatBuyerId);
      setLocalMessages(freshMessages);
      console.log('✅ Seller: Messages refreshed:', freshMessages.length);
    }
  };

  // Get user profile name
  const getUserProfileName = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.log('⚠️ Could not fetch profile for user:', userId);
        return 'Unknown User';
      }
      
      return data?.full_name || 'Unknown User';
    } catch (error) {
      console.log('⚠️ Error fetching profile:', error);
      return 'Unknown User';
    }
  };

  const markMessagesAsRead = async (carId, sellerId, buyerId) => {
    try {
      console.log('🔍 Marking messages as read for car:', carId, 'seller:', sellerId, 'buyer:', buyerId);
      
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('car_id', carId)
        .eq('receiver_id', sellerId)
        .eq('sender_id', buyerId)
        .eq('read', false);
      
      if (error) {
        console.error('❌ Error marking messages as read:', error);
      } else {
        console.log('✅ Messages marked as read for car:', carId, 'buyer:', buyerId);
        // Reset unread count for specific buyer-car combination
        const key = `${carId}-${buyerId}`;
        setUnreadCounts(prev => ({
          ...prev,
          [key]: 0
        }));
      }
    } catch (error) {
      console.error('❌ Error in markMessagesAsRead:', error);
    }
  };



  const handleSendMessage = async () => {
    console.log('🚀 Seller: handleSendMessage called!');
    console.log('📊 Message data:', { 
      localMessage: localMessage?.trim(), 
      chatCarId, 
      chatBuyerId, 
      userId: user?.id 
    });
    
    if (!localMessage.trim() || !chatCarId || !chatBuyerId || !user?.id) {
      console.log('❌ Seller: Validation failed:', { 
        hasMessage: !!localMessage?.trim(), 
        hasCarId: !!chatCarId, 
        hasBuyerId: !!chatBuyerId, 
        hasUserId: !!user?.id 
      });
      return;
    }
    
    try {
      console.log('✅ Seller: Starting to send message...');
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
      
      console.log('📝 Seller: New message object:', newMessageObj);
      
      // Add message to local messages immediately (optimistic update)
      setLocalMessages(prev => [...prev, newMessageObj]);
      // Also add to current chat messages for immediate display
      setCurrentChatMessages(prev => [...prev, newMessageObj]);
      console.log('✅ Seller: Message added to local state and current chat');
      
      // Send message to database
      console.log('📡 Seller: Sending to database...');
      const { error } = await supabase
        .from('messages')
        .insert([{
          car_id: chatCarId,
          sender_id: user.id,
          receiver_id: chatBuyerId,
          message: localMessage.trim()
        }]);
      
      if (error) {
        console.error('❌ Seller: Database error:', error);
        // Remove message from local state if database save failed
        setLocalMessages(prev => prev.filter(msg => msg.id !== newMessageObj.id));
        return;
      }
      
      console.log('✅ Seller: Message saved to database successfully!');
      
      // Clear input
      setLocalMessage('');
      console.log('✅ Seller: Input cleared');
      
      // Refresh messages in CarChat component
      if (chatData?.setMessages && typeof chatData.setMessages === 'function') {
        try {
        chatData.setMessages(prev => [...prev, newMessageObj]);
          console.log('✅ Seller: CarChat messages updated');
        } catch (error) {
          console.log('⚠️ Seller: Could not update CarChat messages:', error);
        }
      }
      
    } catch (error) {
      console.error('❌ Seller: Error in handleSendMessage:', error);
    } finally {
      setSending(false);
      console.log('✅ Seller: Sending state reset');
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
        console.log('📊 Fetching unread counts for seller:', sellerId);
        
        const { data, error } = await supabase
        .from('messages')
        .select('car_id, id, sender_id, receiver_id')
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
            console.log('📝 Processing unread message:', {
              car_id: msg.car_id,
              sender_id: msg.sender_id,
              receiver_id: msg.receiver_id,
              message_id: msg.id
            });
            counts[msg.car_id] = (counts[msg.car_id] || 0) + 1;
          });
          
          console.log('🎯 Final unread counts per car:', counts);
          console.log('🔢 Total cars with unread messages:', Object.keys(counts).length);
          console.log('📊 Raw unread messages data:', data);
          setUnreadCounts(counts);
        }
      } catch (error) {
        console.error('❌ Error in fetchUnread:', error);
        setUnreadCounts({});
      }
    };
    
    fetchUnread();
    
    // Set up real-time subscription for unread messages
    console.log('🔌 Setting up real-time subscription for seller:', sellerId);
    
    const subscription = supabase
      .channel('unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${sellerId}`
      }, (payload) => {
        console.log('📨 New message received, updating unread count for car:', payload.new.car_id);
        console.log('📨 Message details:', payload.new);
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
          console.log('✅ Message marked as read, decreasing unread count for car:', payload.new.car_id);
          setUnreadCounts(prev => ({
            ...prev,
            [payload.new.car_id]: Math.max(0, (prev[payload.new.car_id] || 0) - 1)
          }));
        }
      })
      .subscribe((status) => {
        console.log('🔌 Real-time subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [sellerId]);

  // Real-time subscription for chat messages
  useEffect(() => {
    if (!user?.id) return;
    
    console.log('🔌 Setting up real-time subscription for chat messages');
    
    // Create a simple channel name to avoid conflicts
    const channelName = `chat_messages_${user.id}`;
    
    const chatSubscription = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('📨 New chat message received:', payload.new);
        
        // Check if this message is relevant to the seller
        if (payload.new.sender_id === user.id || payload.new.receiver_id === user.id) {
          console.log('✅ Relevant message for seller, processing...');
          
          // Create formatted message object
          const newMessage = {
            ...payload.new,
            sender_name: payload.new.sender_id === user.id ? 'You' : 'Buyer',
            receiver_name: payload.new.receiver_id === user.id ? 'You' : 'Buyer'
          };
          
          // Add to localMessages for chat list
          setLocalMessages(prev => [...prev, newMessage]);
          
          // Only add to current chat if it's for the active conversation
          // AND ensure strict car and buyer matching
          const isForCurrentCar = payload.new.car_id === chatCarId;
          const isForCurrentBuyer = (payload.new.sender_id === chatBuyerId || payload.new.receiver_id === chatBuyerId);
          const isForCurrentChat = isForCurrentCar && isForCurrentBuyer;
          
          console.log('🔍 Real-time message check:', {
            messageCarId: payload.new.car_id,
            currentChatCarId: chatCarId,
            messageSenderId: payload.new.sender_id,
            messageReceiverId: payload.new.receiver_id,
            currentChatBuyerId: chatBuyerId,
            isForCurrentCar,
            isForCurrentBuyer,
            isForCurrentChat,
            shouldAddToCurrentChat: isForCurrentChat
          });
          
          if (isForCurrentChat) {
            setCurrentChatMessages(prevChat => [...prevChat, newMessage]);
            console.log('✅ Message added to current chat');
          } else {
            console.log('⚠️ Message not for current chat, skipping');
          }
          
          // Refresh unread counts
          if (payload.new.receiver_id === user.id && !payload.new.is_read) {
            setUnreadCounts(prev => ({
              ...prev,
              [payload.new.car_id]: (prev[payload.new.car_id] || 0) + 1
            }));
          }
          
          // Refresh chat list to update unread counts and last messages
          refreshChatList();
        } else {
          console.log('⚠️ Message not relevant to seller, skipping');
        }
      })
      .subscribe((status) => {
        console.log('🔌 Chat messages subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription failed. Retrying in 5 seconds...');
          setTimeout(() => {
            console.log('🔄 Retrying real-time subscription...');
            // The useEffect will re-run and create a new subscription
          }, 5000);
        } else if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription successful');
        } else if (status === 'TIMED_OUT') {
          console.log('⚠️ Real-time subscription timed out, will retry automatically');
        }
      });

    return () => {
      chatSubscription.unsubscribe();
    };
  }, [user?.id, chatCarId, chatBuyerId]);

  // Effect to refresh current chat when context changes
  useEffect(() => {
    if (chatCarId && chatBuyerId && user?.id) {
      console.log('🔄 Chat context changed, refreshing current chat...');
      // Only refresh if we have a valid context
      if (chatCarId && chatBuyerId) {
        refreshCurrentChat();
      }
    }
  }, [chatCarId, chatBuyerId, user?.id]);

  // Effect to validate chat context and clear if invalid
  useEffect(() => {
    if (showChatModal && (!chatCarId || !chatBuyerId)) {
      console.log('⚠️ Invalid chat context detected, clearing chat...');
      setCurrentChatMessages([]);
      setLocalMessage('');
    }
  }, [showChatModal, chatCarId, chatBuyerId]);

  // Function to clear chat context completely
  const clearChatContext = () => {
    console.log('🧹 Clearing chat context completely...');
    setChatCarId(null);
    setChatBuyerId(null);
    setCurrentChatMessages([]);
    setLocalMessage('');
    setSending(false);
  };

  // Function to get buyer name
  const getBuyerName = useCallback(async (buyerId) => {
    try {
      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', buyerId)
        .single();
      
      return buyerProfile?.full_name || 'Buyer';
    } catch (error) {
      console.log('⚠️ Could not fetch buyer name for:', buyerId);
      return 'Buyer';
    }
  }, []);

  // Function to refresh chat list for ALL cars
  const refreshChatList = useCallback(async () => {
    if (!user?.id || !myCars || myCars.length === 0) return;
    
    try {
      console.log('🔄 Refreshing chat list for ALL cars...');
      console.log('📊 Processing', myCars.length, 'cars');
      
      // Fetch all messages for seller's cars with names
      const allMessages = [];
      console.log('🔍 Available cars for message fetching:', myCars.map(car => ({ id: car.id, title: car.title })));
      
      for (const car of myCars) {
        console.log(`📡 Fetching messages for car: ${car.id} (${car.title})`);
        
        try {
          // Try to get messages with names first
          let { data: carMessages, error } = await supabase
            .from('messages_with_names')
            .select('*')
            .eq('car_id', car.id)
            .order('created_at', { ascending: true });
          
          // If messages_with_names fails, get from basic messages table
          if (error || !carMessages) {
            console.log(`⚠️ messages_with_names failed for car ${car.id}, trying basic messages table...`);
            const result = await supabase
              .from('messages')
              .select('*')
              .eq('car_id', car.id)
              .order('created_at', { ascending: true });
            
            carMessages = result.data;
            error = result.error;
          }
          
          if (error) {
            console.error(`❌ Error fetching messages for car ${car.id}:`, error);
          } else if (carMessages && carMessages.length > 0) {
            console.log(`✅ Found ${carMessages.length} messages for car ${car.id}`);
            console.log(`📝 Sample message for car ${car.id}:`, carMessages[0]);
            allMessages.push(...carMessages);
          } else {
            console.log(`ℹ️ No messages found for car ${car.id}`);
          }
        } catch (carError) {
          console.error(`❌ Unexpected error fetching messages for car ${car.id}:`, carError);
        }
      }
      
      console.log(`📊 Total messages collected: ${allMessages.length}`);
      
      // Update localMessages with fresh data
      const messagesWithNames = allMessages.map(msg => ({
        ...msg,
        sender_name: msg.sender_id === user.id ? 'You' : 'Buyer',
        receiver_name: msg.receiver_id === user.id ? 'You' : 'Buyer'
      }));
      
      setLocalMessages(messagesWithNames);
      console.log('✅ Chat list refreshed with', messagesWithNames.length, 'messages');
      
      // If no messages found, set empty array to prevent errors
      if (messagesWithNames.length === 0) {
        console.log('ℹ️ No messages found, setting empty chat list');
      }
      
      // Debug: Log unique buyers per car
      const buyersPerCar = {};
      allMessages.forEach(msg => {
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          const buyerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          if (buyerId !== user.id) {
            if (!buyersPerCar[msg.car_id]) {
              buyersPerCar[msg.car_id] = new Set();
            }
            buyersPerCar[msg.car_id].add(buyerId);
          }
        }
      });
      
      console.log('🚗 Buyers per car:', Object.keys(buyersPerCar).map(carId => ({
        carId,
        buyerCount: buyersPerCar[carId].size,
        buyers: Array.from(buyersPerCar[carId])
      })));
      
      // Fetch buyer profiles for display names
      const allBuyerIds = new Set();
      Object.values(buyersPerCar).forEach(buyerSet => {
        buyerSet.forEach(buyerId => allBuyerIds.add(buyerId));
      });
      
      if (allBuyerIds.size > 0) {
        fetchBuyerProfiles(Array.from(allBuyerIds));
      }
      
      // Calculate unread message counts for specific buyer-car combinations
      const unreadCountsMap = {};
      allMessages.forEach(msg => {
        if (msg.receiver_id === user.id && !msg.read) {
          const carId = msg.car_id;
          const buyerId = msg.sender_id;
          const key = `${carId}-${buyerId}`;
          
          if (!unreadCountsMap[key]) {
            unreadCountsMap[key] = 0;
          }
          unreadCountsMap[key]++;
        }
      });
      
      setUnreadCounts(unreadCountsMap);
      console.log('📊 Unread message counts by buyer-car:', unreadCountsMap);
      
    } catch (error) {
      console.error('❌ Error refreshing chat list:', error);
    }
  }, [user?.id, myCars]);

  // Function to refresh chat list for SPECIFIC car only
  const refreshCarChats = useCallback(async (carId) => {
    if (!user?.id || !carId) return;
    
    try {
      console.log(`🔄 Refreshing chat list for specific car: ${carId}`);
      
      // Fetch messages for specific car only
      let { data: carMessages, error } = await supabase
        .from('messages_with_names')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: true });
      
      // If messages_with_names fails, get from basic messages table
      if (error || !carMessages) {
        console.log(`⚠️ messages_with_names failed for car ${carId}, trying basic messages table...`);
        const result = await supabase
          .from('messages')
          .select('*')
          .eq('car_id', carId)
          .order('created_at', { ascending: true });
        
        carMessages = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error(`❌ Error fetching messages for car ${carId}:`, error);
        return;
      }
      
      if (carMessages && carMessages.length > 0) {
        console.log(`✅ Found ${carMessages.length} messages for car ${carId}`);
        
        // Update currentChatMessages for this specific car
        const messagesWithNames = carMessages.map(msg => ({
          ...msg,
          sender_name: msg.sender_id === user.id ? 'You' : 'Buyer',
          receiver_name: msg.receiver_id === user.id ? 'You' : 'Buyer'
        }));
        
        setCurrentChatMessages(messagesWithNames);
        console.log(`✅ Chat messages updated for car ${carId}`);
        
        // Don't refresh the main chat list here to prevent infinite loops
        console.log('✅ Chat messages updated for car, skipping main refresh');
      } else {
        console.log(`ℹ️ No messages found for car ${carId}`);
        setCurrentChatMessages([]);
      }
      
    } catch (error) {
      console.error(`❌ Error refreshing chat for car ${carId}:`, error);
    }
  }, [user?.id, refreshChatList]);

  // Initialize chat list when component loads (ONLY ONCE)
  useEffect(() => {
    if (user?.id && myCars && myCars.length > 0) {
      console.log('🚀 Initializing chat list...');
      refreshChatList();
    }
  }, [user?.id, myCars]); // Removed refreshChatList dependency

  // Refresh chat list when modal opens (ONLY WHEN NEEDED)
  useEffect(() => {
    if (showChatModal && user?.id && myCars && myCars.length > 0) {
      console.log('🔄 Chat modal opened, refreshing chat list...');
      // Only refresh if we don't have messages already
      if (localMessages.length === 0) {
        refreshChatList();
      } else {
        console.log('✅ Chat list already loaded, skipping refresh');
      }
    }
  }, [showChatModal, user?.id, myCars]); // Removed refreshChatList dependency

  // Make chat modal accessible from header navbar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.openChatModal = () => {
        console.log('🎯 Header chat button clicked!');
        setShowChatModal(true);
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.openChatModal;
      }
    };
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleSellerAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setProfileMsg('❌ Please select an image file (PNG, JPG, JPEG, GIF)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setProfileMsg('❌ File size must be less than 5MB');
        return;
      }

      try {
        setProfileMsg('📸 Uploading profile picture...');
        
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
          .from('user-avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          throw error;
        }

        // Get public URL manually (Supabase storage issue fix)
        // Extract project ref from Supabase URL
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fdddzfnawuykljrdrlrp.supabase.co';
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'fdddzfnawuykljrdrlrp';
        const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/user-avatars/${filePath}`;

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        // Update local state
        setUserProfile(prev => ({
          ...prev,
          avatar_url: publicUrl
        }));

        setProfileMsg('✅ Profile picture updated successfully!');
        
        // Clear the file input
        e.target.value = '';

      } catch (error) {
        console.error('Error uploading avatar:', error);
        setProfileMsg('❌ Failed to upload profile picture: ' + error.message);
      }
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
              {userProfile?.avatar_url ? (
                <img 
                  src={userProfile.avatar_url} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                userProfile?.full_name?.charAt(0) || 'S'
              )}
            </div>
            <h3>{userProfile?.full_name || 'Seller'}</h3>
            <p>Car Seller</p>

          </div>
            

          




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
            {console.log('🔍 Rendering navigation with Chat button')}
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
              onClick={() => {
                setEditName(userProfile?.full_name || '');
                setEditEmail(user?.email || '');
                setOriginalName(userProfile?.full_name || '');
                setOriginalEmail(user?.email || '');
                setShowEditProfileModal(true);
                setProfileMsg('');
              }}
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
          {/* Stripe Setup Reminder - Always Visible */}
          {userProfile && !userProfile.stripe_account_id && (
            <div className={styles.stripeSetupReminder} style={{
              margin: '0 0 20px 0',
              padding: '20px',
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
              borderRadius: '12px',
              color: 'white',
              boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ fontSize: '2rem' }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '600' }}>Payment Setup Required</h4>
                <p style={{ margin: '0 0 12px 0', opacity: 0.9 }}>Complete your Stripe setup to receive payments</p>
                <button 
                  onClick={handleCompleteStripeSetup}
                  disabled={stripeSetupLoading}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {stripeSetupLoading ? 'Setting up...' : 'Complete Stripe Setup'}
                </button>
              </div>
            </div>
          )}

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
                {/* Total Sales card removed */}
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
                          {/* Gallery block - Enhanced */}
                          <div className={styles.carImageContainer}>
                            {/* Main image */}
                            <img
                              src={getAllImages(car)[imageIndexes[car.id] || 0]}
                              alt={car.title}
                              className={styles.mainImage}
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
                          
                          {/* Enhanced Car Info Section */}
                          <div className={styles.carInfo}>
                            {/* Car Title - Bold and Large */}
                            <h3 className={styles.carTitle}>{car.title}</h3>
                            
                            {/* Car Description */}
                            <p className={styles.carDescription}>{car.description}</p>
                            
                            {/* Price - Professional Badge Style */}
                            <div className={styles.priceContainer}>
                              <span className={styles.priceLabel}>Price:</span>
                              <span className={styles.price}>${car.price?.toLocaleString() || '0'}</span>
                            </div>
                            
                            {/* Status Section - Combined Badge */}
                            <div className={styles.statusSection}>
                              <div className={styles.statusRow}>
                                <span className={car.status === 'sold' ? styles.soldBadge : styles.availableBadge}>
                              {car.status === 'sold' ? 'Sold' : 'Available'}
                                </span>
                                
                                {/* Approval Status */}
                            {car.admin_approvals && car.admin_approvals.length > 0 && (
                                  <span className={`${styles.approvalBadge} ${styles[car.admin_approvals[car.admin_approvals.length - 1].approval_status]}`}>
                                    {car.admin_approvals[car.admin_approvals.length - 1].approval_status === 'approved' ? '✅ Approved' : 
                                     car.admin_approvals[car.admin_approvals.length - 1].approval_status === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                                  </span>
                                )}
                              </div>
                            </div>
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
                        {/* Enhanced Car Info Section */}
                        <div className={styles.carInfo}>
                          {/* Car Title - Bold and Large */}
                          <h3 className={styles.carTitle}>{car.title}</h3>
                          
                          {/* Car Description */}
                          <p className={styles.carDescription}>{car.description}</p>
                          
                          {/* Price - Professional Badge Style */}
                          <div className={styles.priceContainer}>
                            <span className={styles.priceLabel}>Price:</span>
                            <span className={styles.price}>${car.price?.toLocaleString() || '0'}</span>
                          </div>
                          
                          {/* Status Section - Combined Badge */}
                          <div className={styles.statusSection}>
                            <div className={styles.statusRow}>
                              <span className={car.status === 'sold' ? styles.soldBadge : styles.availableBadge}>
                              {car.status === 'sold' ? 'Sold' : 'Available'}
                              </span>
                            
                            {/* Approval Status */}
                              <span className={`${styles.approvalBadge} ${styles[approvalStatusClass]}`}>
                                {car.status === 'sold' ? '✅ Auto-Approved' : 
                                 approvalStatus === 'approved' ? '✅ Approved' : 
                                 approvalStatus === 'pending' ? '⏳ Pending' : '❌ Rejected'}
                              </span>
                            </div>
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
                        </div>
                          
                                                {/* Enhanced Action Buttons with Chat Integration */}
                          {car.status !== 'sold' && (
                            <div className={styles.carActions}>
                              <button 
                                className={styles.editBtn}
                                onClick={() => router.push(`/edit-car/${car.car_id || car.id}`)}
             >
               Edit
             </button>
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleDeleteCar(car.car_id || car.id)}
                              >
                                Delete
             </button>

                            </div>
                          )}
                          
                                 {/* Chat Section for each car - Hidden but functional for badge count */}
         <div style={{ display: 'none' }}>
                            <CarChat 
                              carId={car.car_id || car.id} 
                              sellerId={sellerId} 
                              buyerId={buyersByCar[car.car_id || car.id]?.[0]?.id} 
                              currentUserId={sellerId} 
                              onOpenChat={onOpenChat}
                              unreadCount={unreadCounts[car.car_id || car.id] || 0}
                              onMarkAsRead={() => {}}
                            />
           
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
            maxWidth: '1200px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'row',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            
            {/* Left Side - Chat List */}
            <div style={{
              width: '350px',
              background: '#f8f9fa',
              borderRight: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Chat List Header */}
              <div style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderTopLeftRadius: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>💬 Chats</h3>
                  {/* Professional chat system - no manual refresh needed */}
                </div>
                                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    opacity: 0.9, 
                    fontSize: '13px' 
                  }}>
                    <span>📱 {(() => {
                      // Use the same logic as the chat list to count active chats
                      const allMessages = Array.isArray(localMessages) ? localMessages : [];
                      const buyerCarMap = new Map();
                      
                      allMessages.forEach(msg => {
                        const carId = msg.car_id;
                        
                        // Only process messages that involve the current seller
                        if (msg.sender_id === user?.id || msg.receiver_id === user?.id) {
                          const buyerId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
                          
                          if (carId && buyerId && buyerId !== user?.id) {
                            const key = `${carId}-${buyerId}`;
                            if (!buyerCarMap.has(key)) {
                              buyerCarMap.set(key, { carId, buyerId, lastMessage: msg });
                            } else {
                              const existing = buyerCarMap.get(key);
                              if (new Date(msg.created_at) > new Date(existing.lastMessage.created_at)) {
                                existing.lastMessage = msg;
                              }
                            }
                          }
                        }
                      });
                      
                      // Filter to only show chats with actual conversations
                      const activeChats = Array.from(buyerCarMap.values()).filter(chat => {
                        if (!chat.lastMessage) return false;
                        
                        // Check if this is a real conversation (not just a single message)
                        const messagesForThisChat = allMessages.filter(msg => 
                          msg.car_id === chat.carId && 
                          (msg.sender_id === chat.buyerId || msg.receiver_id === chat.buyerId) &&
                          (msg.sender_id === user?.id || msg.receiver_id === user?.id)
                        );
                        
                        // Must have at least 2 messages (one from each side) to be a real conversation
                        return messagesForThisChat.length >= 2;
                      });
                      
                      return activeChats.length;
                    })()} active chats</span>
                    

                  </div>
              </div>
              
              {/* Chat List */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0'
              }}>
                {/* Get all unique buyers who have chatted */}
                {(() => {
                  // Get all messages and extract unique buyer-car combinations
                  const allMessages = Array.isArray(localMessages) ? localMessages : [];
                  const buyerCarMap = new Map();
                  
                  allMessages.forEach(msg => {
                    const carId = msg.car_id;
                    
                    // Only process messages that involve the current seller
                    if (msg.sender_id === user?.id || msg.receiver_id === user?.id) {
                      // Determine the buyer ID (the other person in the conversation)
                      const buyerId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
                      
                      // Skip if buyerId is the same as seller (shouldn't happen but safety check)
                      if (carId && buyerId && buyerId !== user?.id) {
                        const key = `${carId}-${buyerId}`;
                        if (!buyerCarMap.has(key)) {
                          buyerCarMap.set(key, {
                            carId,
                            buyerId,
                            lastMessage: msg,
                            unreadCount: 0
                          });
                        } else {
                          // Update last message if this is newer
                          const existing = buyerCarMap.get(key);
                          if (new Date(msg.created_at) > new Date(existing.lastMessage.created_at)) {
                            existing.lastMessage = msg;
                          }
                        }
                    
                        // Count unread messages from buyer (messages sent by buyer to seller)
                        if (msg.sender_id !== user?.id && msg.receiver_id === user?.id) {
                          const existing = buyerCarMap.get(key);
                          // Check if message is unread (is_read field might not exist, so we'll count all)
                          existing.unreadCount = (existing.unreadCount || 0) + 1;
                        }
                      }
                    }
                  });
                  
                  // Build professional chat list from local messages (simplified approach)
                  console.log('📱 Building professional chat list from local messages...');
                  console.log('🔍 localMessages sample:', localMessages?.slice(0, 3));
                  
                  const professionalChatList = [];
                  
                  if (localMessages && localMessages.length > 0) {
                    console.log('🔍 Processing', localMessages.length, 'messages for chat list...');
                    
                    // Use the already processed buyerCarMap data
                    const processedChats = new Set();
                    
                    localMessages.forEach((msg, index) => {
                      if (msg.sender_id === user?.id || msg.receiver_id === user?.id) {
                        const buyerId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
                        const carId = msg.car_id;
                        const chatKey = `${carId}-${buyerId}`;
                        
                        if (!processedChats.has(chatKey) && buyerId !== user?.id) {
                          processedChats.add(chatKey);
                          
                          const car = myCars.find(c => c.id === carId);
                          const carTitle = car ? car.title : 'Car';
                          
                          const chatMessages = localMessages.filter(m => 
                            m.car_id === carId && 
                            (m.sender_id === buyerId || m.receiver_id === buyerId)
                          );
                          
                          const lastMessage = chatMessages[chatMessages.length - 1];
                          const messageText = lastMessage?.content || lastMessage?.message || 'No message';
                          
                          professionalChatList.push({
                            carId,
                            buyerId,
                            carTitle,
                            lastMessage: messageText,
                            messageCount: chatMessages.length,
                            unreadCount: 0,
                            timestamp: lastMessage?.created_at || new Date()
                          });
                          
                          console.log(`✅ Added chat: Car ${carTitle} | Buyer | Messages: ${chatMessages.length}`);
                        }
                      }
                    });
                    
                    // Sort by most recent message first
                    professionalChatList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    
                    console.log('📊 Final professional chat list:', professionalChatList);
                  }
                  
                  console.log('📊 Professional chat list length:', professionalChatList.length);
                  
                  // Debug: Check if we have the required data
                  console.log('🔍 Debug check:');
                  console.log('  - localMessages length:', localMessages?.length || 0);
                  console.log('  - myCars length:', myCars?.length || 0);
                  console.log('  - user?.id:', user?.id);
                  console.log('  - professionalChatList empty?', professionalChatList.length === 0);
                  
                  // Force some test data if list is empty but we have messages
                  if (professionalChatList.length === 0 && localMessages && localMessages.length > 0) {
                    console.log('⚠️ Chat list is empty but we have messages. Adding test data...');
                    
                    // Add a test chat entry
                    const testMessage = localMessages[0];
                    if (testMessage) {
                      const testBuyerId = testMessage.sender_id === user?.id ? testMessage.receiver_id : testMessage.sender_id;
                      const testCarId = testMessage.car_id;
                      const testCar = myCars.find(c => c.id === testCarId);
                      
                      professionalChatList.push({
                        carId: testCarId,
                        buyerId: testBuyerId,
                        carTitle: testCar ? testCar.title : 'Car',
                        lastMessage: 'Test message',
                        messageCount: 1,
                        unreadCount: 0,
                        timestamp: new Date()
                      });
                      
                      console.log('✅ Added test chat entry:', professionalChatList[0]);
                    }
                  }
                  
                  // Force display if we have data but list is still empty
                  if (professionalChatList.length === 0 && localMessages && localMessages.length > 0) {
                    console.log('🚨 CRITICAL: Still no chats after test data. Forcing display...');
                    
                    // Create a simple chat list from available data
                    const availableChats = [];
                    const processedKeys = new Set();
                    
                    localMessages.forEach(msg => {
                      if (msg.sender_id === user?.id || msg.receiver_id === user?.id) {
                        const buyerId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
                        const carId = msg.car_id;
                        const key = `${carId}-${buyerId}`;
                        
                        if (!processedKeys.has(key) && buyerId !== user?.id) {
                          processedKeys.add(key);
                          const car = myCars.find(c => c.id === carId);
                          
                          availableChats.push({
                            carId,
                            buyerId,
                            carTitle: car ? car.title : 'Car',
                            lastMessage: 'Available chat',
                            messageCount: 1,
                            unreadCount: 0,
                            timestamp: new Date()
                          });
                        }
                      }
                    });
                    
                    if (availableChats.length > 0) {
                      console.log('✅ Force created', availableChats.length, 'chats');
                      professionalChatList.push(...availableChats);
                    }
                  }
                  
                  if (professionalChatList.length === 0) {
                    console.log('⚠️ No chats found, showing empty state');
                    
                    // Show loading state if we're still fetching data
                    if (localMessages.length === 0) {
                      return (
                        <div style={{
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: '#999'
                        }}>
                          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Loading Chats...</h4>
                          <p style={{ margin: 0, fontSize: '14px' }}>Please wait while we fetch your conversations</p>
                        </div>
                      );
                    }
                    
                    // Show no chats state if data loaded but no chats found
                    return (
                      <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#999'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No Chats Yet</h4>
                        <p style={{ margin: 0, fontSize: '14px' }}>When buyers message you, they'll appear here</p>
                        <div style={{ marginTop: '20px', fontSize: '12px', color: '#ccc' }}>
                          Debug: localMessages={localMessages?.length || 0}, myCars={myCars?.length || 0}
                        </div>
                      </div>
                    );
                  }
                  
                  return professionalChatList.map(({ carId, buyerId, carTitle, lastMessage, messageCount, unreadCount, timestamp }) => (
                    <div
                      key={`${carId}-${buyerId}`}
                      onClick={() => {
                        console.log('🎯 Chat list item clicked for car:', carId, 'buyer:', buyerId);
                        
                        // Clear previous chat messages first
                        setCurrentChatMessages([]);
                        
                        // Set the chat data and open the chat
                        setChatCarId(carId);
                        setChatBuyerId(buyerId);
                        setShowChatModal(true);
                        
                        // Fetch messages for this specific car and buyer
                        if (carId && buyerId && user?.id) {
                          fetchExistingMessages(carId, user?.id, buyerId)
                            .then(messages => {
                              setCurrentChatMessages(messages);
                              console.log('✅ Chat opened with messages:', messages.length);
                              console.log('🔍 Messages for buyer:', buyerId, 'in car:', carId);
                            })
                            .catch(error => {
                              console.error('❌ Error opening chat:', error);
                            });
                          
                          // Also refresh the main chat list to update unread counts
                          refreshChatList().catch(error => {
                            console.error('❌ Error refreshing chat list:', error);
                          });
                        }
                      }}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: (chatCarId === carId && chatBuyerId === buyerId) ? '#e3f2fd' : 'transparent',
                        borderLeft: (chatCarId === carId && chatBuyerId === buyerId) ? '4px solid #667eea' : '4px solid transparent'
                      }}
                      onMouseOver={(e) => {
                        if (chatCarId !== carId || chatBuyerId !== buyerId) {
                          e.target.style.background = '#f0f0f0';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (chatCarId !== carId || chatBuyerId !== buyerId) {
                          e.target.style.background = 'transparent';
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        {/* Buyer Avatar */}
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '18px',
                          fontWeight: '600'
                        }}>
                          👤
                        </div>
                        
                        {/* Chat Info */}
                        <div style={{
                          flex: 1,
                          minWidth: 0
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px'
                          }}>
                            <h4 style={{
                              margin: 0,
                              fontSize: '15px',
                              fontWeight: '600',
                              color: '#333',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              Buyer {buyerId.substring(0, 8)} • {carTitle}
                            </h4>
                            
                            {/* Message Count Badge */}
                            <span style={{
                              background: '#667eea',
                              color: 'white',
                              borderRadius: '50%',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              minWidth: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {messageCount}
                            </span>
                            
                            {/* Unread Count Badge */}
                            {unreadCount > 0 && (
                              <span style={{
                                background: '#ff4757',
                                color: 'white',
                                borderRadius: '50%',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                minWidth: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: '8px'
                              }}>
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          
                          {/* Last Message Preview */}
                          <div style={{
                            fontSize: '13px',
                            color: '#666',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            <strong>{lastMessage}</strong>
                          </div>
                  
                          {/* Timestamp */}
                          <div style={{
                            fontSize: '11px',
                            color: '#999',
                            marginTop: '2px'
                          }}>
                            {new Date(timestamp).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                  
                })}
              </div>
            </div>
            
            {/* Right Side - Chat Area */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: '#fff'
          }}>
            {/* Chat Header */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
                padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
                borderTopRightRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', marginBottom: '6px' }}>💬 Chat with {(() => {
                  // Get buyer name from currentChatMessages or chatBuyerId
                  if (currentChatMessages.length > 0) {
                    const firstMessage = currentChatMessages[0];
                    if (firstMessage.sender_id === chatBuyerId) {
                      return firstMessage.sender_name || 'Buyer';
                    } else if (firstMessage.receiver_id === chatBuyerId) {
                      return firstMessage.receiver_name || 'Buyer';
                    }
                  }
                  return 'Buyer';
                })()}</h3>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  opacity: 0.9, 
                  fontSize: '13px' 
                }}>
                  <span>🚗 {myCars.find(c => c.id === chatCarId)?.title || `Car ${chatCarId?.substring(0, 8)}`}</span>
                  <span>•</span>
                  <span>👤 {(() => {
                    // Get buyer name for status
                    if (currentChatMessages.length > 0) {
                      const firstMessage = currentChatMessages[0];
                      if (firstMessage.sender_id === chatBuyerId) {
                        return `${firstMessage.sender_name || 'Buyer'}: Connected`;
                      } else if (firstMessage.receiver_id === chatBuyerId) {
                        return `${firstMessage.receiver_name || 'Buyer'}: Connected`;
                      }
                    }
                    return 'Buyer: Connected';
                  })()}</span>
              </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
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
            </div>
            
            {/* Chat Interface - WhatsApp Style */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              minHeight: '250px',
              position: 'relative'
            }}>
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.03,
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                pointerEvents: 'none'
              }} />
              
              {(() => {
                // Use currentChatMessages directly
                if (currentChatMessages.length === 0) {
                  return (
                <div style={{ 
                  textAlign: 'center', 
                      color: '#fff', 
                  marginTop: '80px',
                      fontSize: '14px',
                      position: 'relative',
                      zIndex: 1
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                  No messages yet.<br/>
                      <small style={{ fontSize: '12px', opacity: '0.8' }}>Start the conversation!</small>
                </div>
                  );
                }
                
                return currentChatMessages.map((msg, index) => {
                  const isSeller = msg.sender_id === user?.id;
                  const senderName = msg.sender_name || (isSeller ? 'You' : 'Buyer');
                  const timestamp = new Date(msg.created_at).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  
                  return (
                  <div key={msg.id || index} style={{
                    display: 'flex',
                    flexDirection: 'column',
                      alignItems: isSeller ? 'flex-end' : 'flex-start',
                      marginBottom: 16,
                      position: 'relative',
                      zIndex: 1
                    }}>
                      {/* Sender Name Label */}
                    <div style={{
                        fontSize: '11px',
                        color: '#fff',
                        marginBottom: '4px',
                        opacity: 0.8,
                        fontWeight: '500',
                        textAlign: isSeller ? 'right' : 'left',
                        padding: '0 8px'
                      }}>
                        {senderName} • {timestamp}
                      </div>
                      
                      {/* Message Bubble */}
                      <div style={{
                        background: isSeller ? '#dcf8c6' : '#fff',
                        color: isSeller ? '#000' : '#333',
                        padding: '12px 16px',
                        borderRadius: isSeller ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        maxWidth: '75%',
                        fontSize: '14px',
                      lineHeight: 1.4,
                      wordWrap: 'break-word',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        border: isSeller ? 'none' : '1px solid rgba(0,0,0,0.1)',
                        position: 'relative'
                    }}>
                        {msg.message}
                        
                        {/* Message Status Indicator */}
                        {isSeller && (
                      <div style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '8px',
                            fontSize: '10px',
                            opacity: 0.6
                          }}>
                            ✓✓
                      </div>
                        )}
                    </div>
                  </div>
                  );
                });
              })()}
            </div>
            
            {/* Chat Input - Professional Style */}
            <div style={{ 
              display: 'flex', 
              gap: 16, 
              alignItems: 'flex-end',
              padding: '20px 24px',
              background: '#fff',
              borderTop: '1px solid #e0e0e0',
              position: 'relative',
              zIndex: 10,
              boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
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
                placeholder="Type your message here..."
                style={{
                  flex: 1,
                  padding: '16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '25px',
                  resize: 'none',
                  minHeight: '56px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  position: 'relative',
                  zIndex: 10,
                  lineHeight: '1.4'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
                rows="2"
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!localMessage.trim() || sending}
                style={{
                  background: localMessage.trim() && !sending ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e0e0e0',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '56px',
                  height: '56px',
                  cursor: localMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                  fontSize: '20px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 10
                }}
                onMouseOver={(e) => {
                  if (localMessage.trim() && !sending) {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (localMessage.trim() && !sending) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                  }
                }}
              >
                {sending ? '⏳' : '📤'}
              </button>
            </div>
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
                {/* Profile Picture Upload - Professional Style */}
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '24px',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    width: '120px', 
                    height: '120px', 
                    margin: '0 auto 16px',
                    position: 'relative'
                  }}>
                    {userProfile?.avatar_url ? (
                      <img 
                        src={userProfile.avatar_url} 
                        alt="Profile" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: '50%',
                          border: '3px solid #667eea'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        border: '2px dashed #d1d5db',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f9fafb',
                        color: '#6b7280',
                        fontSize: '3rem',
                        fontWeight: 'bold'
                      }}>
                        {userProfile?.full_name?.charAt(0) || 'S'}
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSellerAvatarChange}
                    style={{ display: 'none' }}
                    id="sellerModalAvatarInput"
                  />
                  <label
                    htmlFor="sellerModalAvatarInput"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'inline-block',
                      transition: 'all 0.3s ease',
                      marginBottom: '8px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    📷 Change Profile Picture
                  </label>
                  <p style={{ 
                    fontSize: '0.8rem', 
                    color: '#6b7280', 
                    margin: '8px 0 0 0',
                    fontStyle: 'italic'
                  }}>
                    PNG, JPG, JPEG, GIF up to 5MB
                  </p>
                </div>

                <div className={authStyles.formGroup}>
                  <label>Full Name <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      value={editName || userProfile?.full_name || ''}
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
                      value={editEmail || user?.email || ''}
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
                      background: '#dc3545', 
                      color: 'white',
                      flex: 1,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }} 
                    onClick={() => setShowEditProfileModal(false)}
                    onMouseOver={(e) => {
                      e.target.style.background = '#c82333';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#dc3545';
                      e.target.style.transform = 'translateY(0)';
                    }}
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



      {/* 🔹 Chat Modal Component */}
      {showChatModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '95%',
            maxWidth: '1200px',
            height: '90%',
            maxHeight: '600px',
            background: 'white',
            borderRadius: '16px',
            display: 'flex',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            {/* Left Panel - Chat List (Full width on Mobile) */}
            <div style={{
              width: isMobile ? '100%' : '350px',
              minHeight: isMobile ? '100%' : 'auto',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>💬 Chats</h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: 0.9,
                  fontSize: '13px',
                  marginTop: '8px'
                }}>
                  <span>📱 {localMessages.filter(msg => 
                    msg.sender_id === user?.id || msg.receiver_id === user?.id
                  ).length} active chats</span>
                </div>
                
                {/* Mobile: Show selected chat info */}
                {isMobile && chatCarId && chatBuyerId && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginTop: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                                              🚗 {myCars.find(c => c.id === chatCarId)?.title || 'Car'}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                                              👤 {buyerProfiles[chatBuyerId]?.full_name || buyerProfiles[chatBuyerId]?.email || 'Buyer'}
                    </div>
                    <button
                      onClick={() => {
                        setChatCarId(null);
                        setChatBuyerId(null);
                        setCurrentChatMessages([]);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      ← Back to Chats
                    </button>
                  </div>
                )}
              </div>
              
              {/* Chat List - Hidden on Mobile when chat is selected */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto',
                display: isMobile && chatCarId && chatBuyerId ? 'none' : 'block',
                position: 'relative',
                zIndex: 1
              }}>
                {localMessages && localMessages.length > 0 ? (
                  (() => {
                    const chatGroups = new Map();
                    
                    localMessages.forEach(msg => {
                      if (msg.sender_id === user?.id || msg.receiver_id === user?.id) {
                        const buyerId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
                        const carId = msg.car_id;
                        const key = `${carId}-${buyerId}`;
                        
                        if (buyerId !== user?.id && !chatGroups.has(key)) {
                          const car = myCars.find(c => c.id === carId);
                          const carTitle = car ? car.title : 'Car';
                          
                          // Get buyer name from profiles
                          const buyerProfile = buyerProfiles[buyerId];
                          const buyerName = buyerProfile?.full_name || buyerProfile?.email || 'Buyer';
                          
                          chatGroups.set(key, {
                            carId,
                            buyerId,
                            carTitle,
                            buyerName,
                            lastMessage: msg.message || 'No message',
                            timestamp: msg.created_at
                          });
                        }
                      }
                    });
                    
                    // Sort chat list by most recent message first
                    const chatList = Array.from(chatGroups.values()).sort((a, b) => {
                      const dateA = new Date(a.timestamp);
                      const dateB = new Date(b.timestamp);
                      return dateB - dateA; // Most recent first
                    });
                    
                    return chatList.map(({ carId, buyerId, carTitle, lastMessage, timestamp }) => (
                      <div
                        key={`${carId}-${buyerId}`}
                        onClick={() => openChat(carId, buyerId)}
                        style={{
                          padding: isMobile ? '20px 16px' : '16px 20px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: (chatCarId === carId && chatBuyerId === buyerId) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                          minHeight: isMobile ? '80px' : 'auto'
                        }}
                        onMouseOver={(e) => {
                          if (!isMobile && (chatCarId !== carId || chatBuyerId !== buyerId)) {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isMobile && (chatCarId !== carId || chatBuyerId !== buyerId)) {
                            e.target.style.background = 'transparent';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '600',
                            position: 'relative'
                          }}>
                            👤
                            {/* Recent activity indicator */}
                            {(() => {
                              const messageAge = Date.now() - new Date(timestamp).getTime();
                              const isRecent = messageAge < 24 * 60 * 60 * 1000; // Last 24 hours
                              return isRecent ? (
                                <span style={{
                                  position: 'absolute',
                                  top: '2px',
                                  right: '2px',
                                  background: '#4CAF50',
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  border: '2px solid rgba(255, 255, 255, 0.2)'
                                }} title="Recent activity"></span>
                              ) : null;
                            })()}
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '4px'
                            }}>
                              <h4 style={{
                                margin: 0,
                                fontSize: '15px',
                                fontWeight: '600',
                                color: 'white',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {buyerProfiles[buyerId]?.full_name || buyerProfiles[buyerId]?.email || 'Buyer'} • {carTitle}
                              </h4>
                            </div>
                            
                            <div style={{
                              fontSize: '13px',
                              color: 'rgba(255, 255, 255, 0.8)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              <strong>{lastMessage}</strong>
                            </div>
                            
                            <div style={{
                              fontSize: '11px',
                              color: 'rgba(255, 255, 255, 0.6)',
                              marginTop: '2px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span>
                                {new Date(timestamp).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                              {/* Recent activity indicator */}
                              {(() => {
                                const messageAge = Date.now() - new Date(timestamp).getTime();
                                const isRecent = messageAge < 24 * 60 * 60 * 1000; // Last 24 hours
                                return isRecent ? (
                                  <span style={{
                                    background: 'rgba(255, 255, 255, 0.3)',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    display: 'inline-block'
                                  }} title="Recent activity"></span>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })()
                ) : (
                  <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No Chats Yet</h4>
                    <p style={{ margin: 0, fontSize: '14px' }}>When buyers message you, they'll appear here</p>
                  </div>
                )}
              </div>
              
              {/* Mobile: Chat Messages View (Shows when chat is selected) */}
              {isMobile && chatCarId && chatBuyerId && (
                <div style={{
                  flex: 1,
                  background: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  minHeight: '400px',
                  position: 'relative',
                  zIndex: 5
                }}>
                  {/* Mobile Chat Header Removed */}
                  
                  {/* Mobile Chat Messages */}
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px 16px',
                    background: '#f8f9fa',
                    minHeight: '250px',
                    position: 'relative',
                    zIndex: 3
                  }}>
                    {currentChatMessages.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        color: '#666',
                        marginTop: '40px',
                        fontSize: '14px'
                      }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                        No messages yet.<br/>
                        <small style={{ fontSize: '12px', opacity: '0.8' }}>Start the conversation!</small>
                      </div>
                    ) : (
                      currentChatMessages.map((message, index) => {
                        if (message.id === 'loading') {
                          return (
                            <div key={index} style={{
                              textAlign: 'center',
                              color: '#666',
                              marginTop: '20px',
                              fontSize: '14px'
                            }}>
                              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                              {message.message}
                            </div>
                          );
                        }
                        
                        return (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              justifyContent: message.sender_id === user?.id ? 'flex-end' : 'flex-start',
                              marginBottom: '12px'
                            }}
                          >
                            <div style={{
                              maxWidth: '80%',
                              padding: '12px 16px',
                              borderRadius: '18px',
                              background: message.sender_id === user?.id ? '#25D366' : '#fff',
                              color: message.sender_id === user?.id ? '#fff' : '#333',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                              wordWrap: 'break-word'
                            }}>
                              <div style={{ marginBottom: '4px' }}>
                                <strong style={{ fontSize: '12px', opacity: 0.7 }}>
                                  {message.sender_id === user?.id ? 'You' : buyerProfiles[message.sender_id]?.full_name || buyerProfiles[message.sender_id]?.email || 'Buyer'}
                                </strong>
                              </div>
                              <div>{message.message}</div>
                              <div style={{
                                fontSize: '10px',
                                opacity: 0.6,
                                marginTop: '4px',
                                textAlign: 'right'
                              }}>
                                {new Date(message.created_at).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Mobile Message Input */}
                  <div style={{
                    padding: '20px 16px',
                    borderTop: '1px solid #e0e0e0',
                    background: 'white',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 15,
                    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
                  }}>
                    <input
                      type="text"
                      value={localMessage}
                      onChange={(e) => setLocalMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message here..."
                      style={{
                        flex: 1,
                        padding: '14px 18px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '24px',
                        fontSize: '15px',
                        outline: 'none',
                        background: '#f8f9fa',
                        transition: 'all 0.2s ease',
                        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                      onFocus={(e) => {
                        e.target.style.border = '2px solid #25D366';
                        e.target.style.background = 'white';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = '1px solid #e0e0e0';
                        e.target.style.background = '#f8f9fa';
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sending || !localMessage.trim()}
                      style={{
                        padding: '14px 20px',
                        background: sending || !localMessage.trim() ? '#ccc' : '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '24px',
                        cursor: sending || !localMessage.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        minWidth: '80px',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                        position: 'relative',
                        zIndex: 20
                      }}
                      onMouseOver={(e) => {
                        if (!sending && localMessage.trim()) {
                          e.target.style.transform = 'scale(1.05)';
                          e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!sending && localMessage.trim()) {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                        }
                      }}
                    >
                      {sending ? '⏳' : '📤'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Panel - Chat Conversation (Hidden on Mobile) */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: 'white',
              display: isMobile ? 'none' : 'flex'
            }}>
              {/* Chat Header */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                    💬 Chat with Buyer
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: 0.9,
                    fontSize: '13px',
                    marginTop: '4px'
                  }}>
                                            <span>🚗 {myCars.find(c => c.id === chatCarId)?.title || 'Car'}</span>
                        <span>•</span>
                        <span>👤 {chatBuyerId ? (buyerProfiles[chatBuyerId]?.full_name || buyerProfiles[chatBuyerId]?.email || 'Buyer') : 'Not Selected'}</span>
                    {currentChatMessages.length > 0 && (
                      <span style={{ 
                        background: '#667eea', 
                        color: 'white', 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '11px',
                        marginLeft: '8px'
                      }}>
                        {currentChatMessages.length} messages
                      </span>
                    )}
                    {/* Debug info */}
                    <div style={{
                      fontSize: '10px',
                      opacity: 0.7,
                      marginTop: '4px',
                      fontFamily: 'monospace'
                    }}>
                      Chat with Buyer
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={clearChatContext}
                    style={{
                      background: 'rgba(255, 107, 53, 0.1)',
                      border: 'none',
                      color: '#ff6b35',
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
                    title="Clear Context"
                  >
                    🧹
                  </button>
                  <button
                    onClick={closeChat}
                    style={{
                      background: 'rgba(102, 126, 234, 0.1)',
                      border: 'none',
                      color: '#667eea',
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
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                minHeight: '250px',
                position: 'relative'
              }}>
                {currentChatMessages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#fff',
                    marginTop: '80px',
                    fontSize: '14px',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                    No messages yet.<br/>
                    <small style={{ fontSize: '12px', opacity: '0.8' }}>Start the conversation!</small>
                  </div>
                ) : (
                  currentChatMessages.map((message, index) => {
                    // Handle loading state
                    if (message.id === 'loading') {
                      return (
                        <div key={index} style={{
                          textAlign: 'center',
                          color: '#fff',
                          marginTop: '40px',
                          fontSize: '14px'
                        }}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                          {message.message}
                        </div>
                      );
                    }
                    
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: message.sender_id === user?.id ? 'flex-end' : 'flex-start',
                          marginBottom: '12px'
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: '18px',
                                                     background: message.sender_id === user?.id ? '#25D366' : 'rgba(255, 255, 255, 0.9)',
                           color: message.sender_id === user?.id ? '#fff' : '#333',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          wordWrap: 'break-word'
                        }}>
                          <div style={{ marginBottom: '4px' }}>
                            <strong style={{ fontSize: '12px', opacity: 0.7 }}>
                              {message.sender_name}
                            </strong>
                          </div>
                          <div>{message.message}</div>
                          <div style={{
                            fontSize: '10px',
                            opacity: 0.6,
                            marginTop: '4px',
                            textAlign: 'right'
                          }}>
                            {new Date(message.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Message Input */}
              <div style={{
                padding: '20px',
                borderTop: '1px solid #e0e0e0',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  value={localMessage}
                  onChange={(e) => setLocalMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message here..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '24px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !localMessage.trim()}
                  style={{
                    padding: '12px 20px',
                    background: sending || !localMessage.trim() ? '#ccc' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '24px',
                    cursor: sending || !localMessage.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button Removed */}

      <Footer userType="seller" />
    </div>
  );
} 