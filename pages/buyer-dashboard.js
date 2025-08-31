import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIChat from '../components/AIChat';
import { supabase } from '../utils/supabaseClient';
import styles from '../styles/Dashboard.module.css';
import authStyles from '../styles/Auth.module.css';
import dynamic from 'next/dynamic';
const StripeCheckoutModal = dynamic(() => import('../components/StripeCheckout'), { ssr: false });

// WhatsApp number formatting function
const formatWhatsAppNumber = (number) => {
  if (!number) return null;
  
  // Remove non-digit characters
  let cleaned = number.replace(/\D/g, '');
  
  // Convert 03XX... to 92XX... (Pakistan format)
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  }
  
  // If already starts with 92, return as is
  if (cleaned.startsWith('92')) {
    return cleaned;
  }
  
  // If it's a 10-digit number, assume it's Pakistan and add 92
  if (cleaned.length === 10) {
    return '92' + cleaned;
  }
  
  return cleaned;
};













export default function BuyerDashboard() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [availableCars, setAvailableCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const router = useRouter();
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [checkoutCar, setCheckoutCar] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatCarId, setChatCarId] = useState(null);
  const [chatSellerId, setChatSellerId] = useState(null);
  const [chatSellerInfo, setChatSellerInfo] = useState(null); // Store seller info
  const [chatData, setChatData] = useState(null);
  const [buyerId, setBuyerId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({}); // Track unread counts per car
  
  // Local chat state for modal
  const [localMessage, setLocalMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState([]); // Local messages for modal
  const [imageIndexes, setImageIndexes] = useState({}); // carId: index



  // Fetch existing messages for buyer dashboard
  const fetchExistingMessages = async (carId, sellerId, buyerId) => {
    try {
      console.log('🔍 Buyer Dashboard: Fetching existing messages for car:', carId, 'seller:', sellerId, 'buyer:', buyerId);
      
      // Try messages_with_names first - get messages for this specific car AND between this buyer and seller
      let { data, error } = await supabase
        .from('messages_with_names')
        .select('*')
        .eq('car_id', carId)
        .or(`and(sender_id.eq.${buyerId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${buyerId})`)
        .order('created_at', { ascending: true });

      // If messages_with_names fails, try basic messages table
      if (error || !data) {
        console.log('⚠️ Buyer Dashboard: messages_with_names failed, trying basic messages table...');
        const result = await supabase
          .from('messages')
          .select('*')
          .eq('car_id', carId)
          .or(`and(sender_id.eq.${buyerId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${buyerId})`)
          .order('created_at', { ascending: true });
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Buyer Dashboard: Error fetching messages:', error);
        return [];
      }

      console.log('✅ Buyer Dashboard: Messages fetched successfully:', data?.length || 0, 'messages');
      if (data && data.length > 0) {
        console.log('📝 Buyer Dashboard: Sample message:', data[0]);
        console.log('📝 Buyer Dashboard: All messages:', data);
        console.log('🔍 Buyer Dashboard: Checking message details...');
        data.forEach((msg, index) => {
          console.log(`📝 Message ${index + 1}:`, {
            id: msg.id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            sender_name: msg.sender_name,
            message: msg.message,
            created_at: msg.created_at
          });
        });
      } else {
        console.log('⚠️ Buyer Dashboard: No messages found for this car');
      }

      // Format messages with proper names
      const formattedMessages = data?.map(msg => ({
        ...msg,
        sender_name: msg.sender_name || (msg.sender_id === buyerId ? 'You' : 'Seller'),
        receiver_name: msg.receiver_name || (msg.receiver_id === buyerId ? 'You' : 'Seller')
      })) || [];

      return formattedMessages;
    } catch (error) {
      console.error('❌ Buyer Dashboard: Error in fetchExistingMessages:', error);
      return [];
    }
  };

  // Chat functions
  const onOpenChat = async (carId, sellerId, messages, setMessages, newMessage, setNewMessage, sending, sendMessage) => {
    console.log('🚀 onOpenChat function called!');
    console.log('📊 Parameters received:', { carId, sellerId, messages, setMessages, newMessage, setNewMessage, sending, sendMessage });
    console.log('📱 Current showChat state:', showChat);
    console.log('🎯 Current chatCarId:', chatCarId);
    console.log('👤 Current chatSellerId:', chatSellerId);
    
    setChatCarId(carId);
    setChatSellerId(sellerId);
    setShowChat(true);
    
    console.log('✅ State updated:');
    console.log('✅ State updated:');
    console.log('   - chatCarId set to:', carId);
    console.log('   - chatSellerId set to:', sellerId);
    console.log('   - showChat set to:', true);
    
    // Store seller information for persistence
    if (sellerId) {
      // Find seller info from available cars
      const carWithSeller = availableCars.find(car => car.id === carId);
      if (carWithSeller && carWithSeller.seller) {
        setChatSellerInfo(carWithSeller.seller);
        console.log('👤 Seller info stored:', carWithSeller.seller);
      }
    }
    
    // Fetch existing messages from database
    if (carId && sellerId && user?.id) {
      console.log('📡 Fetching existing messages...');
      const existingMessages = await fetchExistingMessages(carId, sellerId, user.id);
      setLocalMessages(existingMessages);
      console.log('✅ Existing messages loaded:', existingMessages.length);
    } else {
      // Fallback to passed messages if available
    setLocalMessages(messages || []);
      console.log('⚠️ Using fallback messages:', messages?.length || 0);
    }
    
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
    if (carId && user?.id) {
      markMessagesAsRead(carId, user.id);
    }
    
    console.log('🎯 Chat modal should now be visible');
    console.log('🔍 Final state check - chatCarId:', chatCarId, 'chatSellerId:', chatSellerId);
  };

  // Fetch unread message counts for all cars
  const fetchUnreadCounts = async () => {
    if (!user?.id) {
      console.log('❌ Buyer: No user ID available for fetchUnreadCounts');
      return;
    }
    
    try {
      console.log('📡 Buyer: Fetching unread messages for user:', user.id);
      
      const { data, error } = await supabase
        .from('messages')
        .select('car_id, id')
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      
      if (error) {
        console.error('❌ Buyer: Error fetching unread counts:', error);
        return;
      }
      
      console.log('✅ Buyer: Unread messages data received:', data);
      console.log('📊 Buyer: Raw data length:', data?.length || 0);
      
      const counts = {};
      data?.forEach(msg => {
        console.log('📝 Buyer: Processing message:', msg);
        counts[msg.car_id] = (counts[msg.car_id] || 0) + 1;
      });
      
      console.log('🎯 Buyer: Final unread counts per car:', counts);
      console.log('🔢 Buyer: Total cars with unread messages:', Object.keys(counts).length);
      
      setUnreadCounts(counts);
    } catch (error) {
      console.error('❌ Buyer: Error in fetchUnreadCounts:', error);
    }
  };

  // Handle sending message from modal
  const handleSendMessage = async () => {
    console.log('🚀 handleSendMessage called!');
    console.log('📊 Message data:', { 
      localMessage: localMessage?.trim(), 
      chatCarId, 
      chatSellerId, 
      userId: user?.id 
    });
    
    if (!localMessage.trim() || !chatCarId || !chatSellerId || !user?.id) {
      console.log('❌ Validation failed:', { 
        hasMessage: !!localMessage?.trim(), 
        hasCarId: !!chatCarId, 
        hasSellerId: !!chatSellerId, 
        hasUserId: !!user?.id 
      });
      return;
    }
    
    try {
      console.log('✅ Starting to send message...');
      setSending(true);
      
      // Create new message object
      const newMessageObj = {
        id: Date.now(), // Temporary ID for local display
        car_id: chatCarId,
        sender_id: user.id,
        receiver_id: chatSellerId,
        message: localMessage.trim(),
        sender_name: 'You',
        receiver_name: 'Seller',
        created_at: new Date().toISOString()
      };
      
      console.log('📝 New message object:', newMessageObj);
      
      // Add message to local messages immediately (optimistic update)
      setLocalMessages(prev => [...prev, newMessageObj]);
      console.log('✅ Message added to local state');
      
      // Send message to database
      console.log('📡 Sending to database...');
      const { error } = await supabase
        .from('messages')
        .insert([{
          car_id: chatCarId,
          sender_id: user.id,
          receiver_id: chatSellerId,
          message: localMessage.trim()
        }]);
      
      if (error) {
        console.error('❌ Database error:', error);
        // Remove message from local state if database save failed
        setLocalMessages(prev => prev.filter(msg => msg.id !== newMessageObj.id));
        return;
      }
      
      console.log('✅ Message saved to database successfully!');
      
      // Clear input
      setLocalMessage('');
      console.log('✅ Input cleared');
      
      // Refresh messages in CarChat component
      if (chatData?.setMessages) {
        chatData.setMessages(prev => [...prev, newMessageObj]);
        console.log('✅ CarChat messages updated');
      }
      
    } catch (error) {
      console.error('❌ Error in handleSendMessage:', error);
    } finally {
      setSending(false);
      console.log('✅ Sending state reset');
    }
  };

  const closeChat = () => {
    console.log('🔒 Closing chat...');
    setShowChat(false);
    setChatCarId(null);
    setChatSellerId(null);
    setChatData(null);
    // Don't reset local messages and seller info - keep them for persistence
    setLocalMessage('');
    setSending(false);
    console.log('✅ Chat closed, messages and seller info preserved');
  };

  const markMessagesAsRead = async (carId, buyerId) => {
    try {
      console.log('🔍 Buyer: Marking messages as read for car:', carId, 'buyer:', buyerId);
      
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('car_id', carId)
        .eq('receiver_id', buyerId)
        .eq('is_read', false);
      
      if (error) {
        console.error('❌ Buyer: Error marking messages as read:', error);
      } else {
        console.log('✅ Buyer: Messages marked as read for car:', carId);
        // Reset unread count for this car
        setUnreadCounts(prev => ({
          ...prev,
          [carId]: 0
        }));
      }
    } catch (error) {
      console.error('❌ Buyer: Error in markMessagesAsRead:', error);
    }
  };



  // Helper to get all images for a car
  const getAllImages = (car) => {
    const images = [];
    
    // Handle both view data and fallback data structures
    const imageUrl = car.image_url || car.cars?.image_url;
    const additionalImages = car.additional_images || car.cars?.additional_images;
    
    if (imageUrl && imageUrl.trim() !== '') images.push(imageUrl);
    if (additionalImages && Array.isArray(additionalImages)) {
      images.push(...additionalImages.filter(img => img && img.trim() !== ''));
    }
    
    return images.length > 0 ? images : ['/carp2.png'];
  };

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
      console.log('Buyer user:', user);
      
      // Fetch profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      console.log('Buyer profile:', profile);
      
      // Check if user is a buyer
      if (profile?.user_type !== 'buyer') {
        router.push('/seller-dashboard');
        return;
      }
      
      // Fetch purchases for this buyer with car and seller details
      const { data: buyerPurchases, error: purchasesError } = await supabase
        .from('purchases_with_details')
        .select('*')
        .eq('buyer_id', user.id);
      
      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError);
        // Fallback to manual joins
        const { data: fallbackPurchases, error: fallbackError } = await supabase
        .from('purchases')
        .select(`
          *,
          cars:car_id (
            title,
            description,
            price,
              image_url,
              additional_images
          ),
          seller:profiles!purchases_seller_id_fkey (
            full_name,
              email,
              whatsapp_number
          )
        `)
        .eq('buyer_id', user.id);
      
        if (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          setPurchases([]);
        } else {
          // Transform fallback data
          const transformedPurchases = fallbackPurchases?.map(purchase => ({
            id: purchase.id,
            car_id: purchase.car_id,
            buyer_id: purchase.buyer_id,
            seller_id: purchase.seller_id,
            amount: purchase.amount,
            purchase_date: purchase.purchase_date,
            title: purchase.cars?.title,
            description: purchase.cars?.description,
            price: purchase.cars?.price,
            image_url: purchase.cars?.image_url,
            additional_images: purchase.cars?.additional_images,
            status: purchase.cars?.status,
            seller_name: purchase.seller?.full_name,
            seller_email: purchase.seller?.email,
            seller_whatsapp: purchase.seller?.whatsapp_number
          })) || [];
          setPurchases(transformedPurchases);
        }
      } else {
      console.log('Fetched purchases with details:', buyerPurchases);
      console.log('Number of purchases:', buyerPurchases?.length || 0);
      setPurchases(buyerPurchases || []);
      }
      
      // Fetch available cars with seller details and approval status
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select(`
          *,
          seller_id,
          admin_approvals(
            approval_status,
            approved_at
          )
        `)
        .eq('status', 'available');
      
      console.log('🚗 Cars fetched:', cars?.length || 0, 'cars');
      console.log('❌ Cars error:', carsError);
      console.log('📊 Sample car data:', cars?.[0]);
      
      // Now fetch seller details for each car
      if (cars && cars.length > 0) {
        const carsWithSellerDetails = await Promise.all(
          cars.map(async (car) => {
            if (car.seller_id) {
              const { data: sellerData, error: sellerError } = await supabase
                .from('profiles')
                .select('full_name, email, whatsapp_number')
                .eq('id', car.seller_id)
                .single();
              
              console.log(`Seller data for car ${car.title}:`, sellerData);
              
              return {
                ...car,
                seller: sellerData
              };
            }
            return car;
          })
        );
        
        console.log('Cars with seller details:', carsWithSellerDetails);
        
        // Filter approved cars for buyer
        const approvedCars = carsWithSellerDetails.filter(car => {
          console.log('Car:', car.title, 'Admin approvals:', car.admin_approvals);
          
          // Check if car has approval record
          if (car.admin_approvals && car.admin_approvals.length > 0) {
            const latestApproval = car.admin_approvals[car.admin_approvals.length - 1];
            console.log('Latest approval for', car.title, ':', latestApproval);
            
            // Only show if latest approval is 'approved'
            if (latestApproval.approval_status === 'approved') {
              console.log('Car approved:', car.title);
              return true;
            } else {
              console.log('Car not approved:', car.title);
              return false;
            }
          }
          
          // If no approval record, don't show it (new cars need approval)
          console.log('No approval record for', car.title, '- not showing');
          return false;
        });
        
        console.log('✅ Approved cars for buyer:', approvedCars.length, 'cars');
        console.log('📋 Approved cars list:', approvedCars.map(c => c.title));
        setAvailableCars(approvedCars);
      } else {
        setAvailableCars([]);
      }
      
      setLoading(false);
    };
    fetchData();
  }, [router]);

  useEffect(() => {
    const fetchBuyer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setBuyerId(user.id);
      else setBuyerId(null);
    };
    fetchBuyer();
  }, []);

  // Fetch unread counts when user changes
  useEffect(() => {
    if (user?.id) {
      console.log('🔍 Buyer: fetchUnreadCounts useEffect triggered, user.id:', user.id);
      fetchUnreadCounts();
    }
  }, [user?.id]);

  // Set up real-time subscription for unread messages
  useEffect(() => {
    if (!user?.id) return;
    
    console.log('🔍 Buyer: Setting up real-time subscription for user:', user.id);
    
    const subscription = supabase
      .channel('buyer_unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        console.log('📨 Buyer: New message received, updating unread count for car:', payload.new.car_id);
        setUnreadCounts(prev => ({
          ...prev,
          [payload.new.car_id]: (prev[payload.new.car_id] || 0) + 1
        }));
        
        // If chat is open for this car, refresh messages
        if (showChat && chatCarId === payload.new.car_id) {
          console.log('🔄 Buyer: Chat is open for this car, refreshing messages...');
          fetchExistingMessages(payload.new.car_id, chatSellerId, user.id).then(newMessages => {
            setLocalMessages(newMessages);
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, (payload) => {
        // If message is marked as read, decrease unread count for that car
        if (payload.new.is_read === true && payload.old.is_read === false) {
          console.log('✅ Buyer: Message marked as read, decreasing unread count for car:', payload.new.car_id);
          setUnreadCounts(prev => ({
            ...prev,
            [payload.new.car_id]: Math.max(0, (prev[payload.new.car_id] || 0) - 1)
          }));
        }
      })
      .subscribe();

    return () => {
      console.log('🔍 Buyer: Cleaning up real-time subscription');
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    router.push('/');
  };

  // Function to manually fix sold cars in database
  const fixSoldCars = async () => {
    try {
      console.log('Fixing sold cars in database...');
      
      // First, let's check the purchases table structure
      const { data: allPurchases, error: allPurchasesError } = await supabase
        .from('purchases')
        .select('*');
      
      console.log('All purchases table data:', allPurchases);
      console.log('Purchases table structure:', allPurchases?.[0] ? Object.keys(allPurchases[0]) : 'No data');
      console.log('All purchases error:', allPurchasesError);
      
      if (allPurchasesError) {
        console.error('Error fetching all purchases:', allPurchasesError);
        alert('❌ Error fetching purchases: ' + allPurchasesError.message);
        return;
      }
      
      // Check if car_id column exists
      if (allPurchases && allPurchases.length > 0) {
        const firstPurchase = allPurchases[0];
        console.log('First purchase record:', firstPurchase);
        console.log('Available columns:', Object.keys(firstPurchase));
        
        // Check if car_id exists
        if (!firstPurchase.car_id) {
          console.log('car_id column does not exist in purchases table!');
          alert('❌ car_id column missing in purchases table. Please check database schema.');
          
          // Alternative approach: Try to find cars by buyer/seller relationship
          console.log('Trying alternative approach using buyer/seller relationship...');
          
          // Get all unique buyer-seller pairs from purchases
          const buyerSellerPairs = allPurchases.map(p => ({
            buyer_id: p.buyer_id,
            seller_id: p.seller_id
          }));
          
          console.log('Buyer-seller pairs from purchases:', buyerSellerPairs);
          
          // For now, just show the data and ask user to check database
          alert('Please check your database schema. Purchases table should have car_id column.');
          return;
        }
      }
      
      // Get all cars that should be sold (have purchase records)
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('car_id');
      
      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError);
        alert('❌ Error fetching purchases: ' + purchasesError.message);
        return;
      }
      
      console.log('Cars with purchase records:', purchases);
      console.log('Number of purchase records:', purchases?.length || 0);
      
      // Check if any car_id values are null or invalid
      if (purchases && purchases.length > 0) {
        const validCarIds = purchases.filter(p => p.car_id && p.car_id !== null);
        const nullCarIds = purchases.filter(p => !p.car_id || p.car_id === null);
        
        console.log('Valid car_ids:', validCarIds);
        console.log('Null car_ids:', nullCarIds);
        console.log('Valid car_ids count:', validCarIds.length);
        console.log('Null car_ids count:', nullCarIds.length);
        
        if (validCarIds.length === 0) {
          alert('❌ No valid car_id found in purchases table. All car_id values are null!');
          return;
        }
        
        const soldCarIds = validCarIds.map(p => p.car_id);
        console.log('Car IDs that should be sold:', soldCarIds);
        
        // First, let's check current status of these cars
        const { data: currentCars, error: currentError } = await supabase
          .from('cars')
          .select('id, title, status')
          .in('id', soldCarIds);
        
        console.log('Current status of cars to be sold:', currentCars);
        
        if (currentError) {
          console.error('Error fetching current car status:', currentError);
          alert('❌ Error checking car status: ' + currentError.message);
          return;
        }
        
        // Update these cars to sold status
        const { data: updateResult, error: updateError } = await supabase
          .from('cars')
          .update({ status: 'sold' })
          .in('id', soldCarIds)
          .select('id, title, status');
        
        console.log('Update result:', updateResult);
        console.log('Update error:', updateError);
        
        if (updateError) {
          console.error('Error updating car status:', updateError);
          alert('❌ Error updating car status: ' + updateError.message);
          
          // Try alternative approach - update one by one
          console.log('Trying alternative approach...');
          let successCount = 0;
          for (const carId of soldCarIds) {
            const { error: singleError } = await supabase
              .from('cars')
              .update({ status: 'sold' })
              .eq('id', carId);
            
            if (!singleError) {
              successCount++;
            } else {
              console.error(`Error updating car ${carId}:`, singleError);
            }
          }
          
          alert(`✅ Updated ${successCount} out of ${soldCarIds.length} cars to sold status.`);
        } else {
          alert(`✅ Successfully updated ${updateResult?.length || 0} cars to sold status!`);
        }
        
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } else {
        alert('No purchase records found.');
      }
    } catch (error) {
      console.error('Error fixing sold cars:', error);
      alert('Error: ' + error.message);
    }
  };

  // Refactor handlePurchase to accept car object directly
  const handlePurchase = async (car) => {
    try {
      console.log('carToPurchase:', car);
      console.log('seller_id being sent:', car?.seller_id);
      if (!car) {
        alert('Car not found!');
        return;
      }
      // Insert purchase record with all required fields
      const purchaseData = {
        car_id: car.id,
        buyer_id: user.id,
        seller_id: car.seller_id, // Always use car.seller_id
        amount: car.price,
        purchase_date: new Date().toISOString()
      };
      const { data: purchaseResult, error: purchaseError } = await supabase
        .from('purchases')
        .insert([purchaseData])
        .select();
      if (purchaseError) {
        console.error('Purchase error:', purchaseError);
        alert('Error making purchase: ' + purchaseError.message);
        return;
      }
      // Update car status to sold
      const { data: updateResult, error: carError } = await supabase
        .from('cars')
        .update({ status: 'sold' })
        .eq('id', car.id)
        .select();
      if (carError) {
        console.error('Car update error:', carError);
        alert('Warning: Purchase successful but car status update failed. Please use "Fix Sold Cars" button.');
      }
      alert('✅ Car purchased successfully! Check My Purchases tab.');
      setAvailableCars(prevCars => prevCars.filter(c => c.id !== car.id));
      // Refresh purchases list
      const { data: updatedPurchases, error: purchasesRefreshError } = await supabase
        .from('purchases')
        .select(`
          *,
          cars:car_id (
            title,
            description,
            price,
            image_url
          ),
          seller:profiles!purchases_seller_id_fkey (
            full_name,
            email
          )
        `)
        .eq('buyer_id', user.id);
      setPurchases(updatedPurchases || []);
      setActiveTab('purchases');
    } catch (error) {
      console.error('Error:', error);
      alert('Error making purchase: ' + error.message);
    }
  };

  const handleEditProfile = () => {
    setEditName(userProfile?.full_name || '');
    setEditEmail(user?.email || '');
    setOriginalName(userProfile?.full_name || '');
    setOriginalEmail(user?.email || '');
    setShowEditProfileModal(true);
    setProfileMsg('');
  };

  const handleAvatarChange = async (e) => {
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

  const handleRemoveAvatar = async () => {
    try {
      setProfileMsg('🗑️ Removing profile picture...');
      
      // Remove avatar_url from profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setUserProfile(prev => ({
        ...prev,
        avatar_url: null
      }));

      setProfileMsg('✅ Profile picture removed successfully!');

    } catch (error) {
      console.error('Error removing avatar:', error);
      setProfileMsg('❌ Failed to remove profile picture: ' + error.message);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    if (!editName || !editEmail) {
      setProfileMsg('❌ Name and email are required.');
      return;
    }
    // Update profile in Supabase
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
    if (profileError) {
      setProfileMsg('❌ ' + profileError.message);
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
  };

  // Place this useEffect at the top level of the component, not inside any other function or block
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        // Use purchases_with_details view for better data
        const { data, error } = await supabase
          .from('purchases_with_details')
          .select('*')
          .eq('buyer_id', user.id);
        
        if (error) {
          console.error('Error fetching from purchases_with_details:', error);
          
          // Fallback: fetch with manual joins
          console.log('Trying fallback approach...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('purchases')
            .select(`
              *,
              cars:car_id (
                id,
                title,
                description,
                price,
                image_url,
                additional_images,
                status
              ),
              seller:profiles!purchases_seller_id_fkey (
                full_name,
                email,
                whatsapp_number
              )
            `)
            .eq('buyer_id', user.id);
          
          if (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            setPurchases([]);
            return;
          }
          
          // Transform fallback data to match view format
          const transformedData = fallbackData?.map(purchase => ({
            id: purchase.id,
            car_id: purchase.car_id,
            buyer_id: purchase.buyer_id,
            seller_id: purchase.seller_id,
            amount: purchase.amount,
            purchase_date: purchase.purchase_date,
            title: purchase.cars?.title,
            description: purchase.cars?.description,
            price: purchase.cars?.price,
            image_url: purchase.cars?.image_url,
            additional_images: purchase.cars?.additional_images,
            status: purchase.cars?.status,
            seller_name: purchase.seller?.full_name,
            seller_email: purchase.seller?.email,
            seller_whatsapp: purchase.seller?.whatsapp_number
          })) || [];
          
          console.log('Fallback data:', transformedData);
          setPurchases(transformedData);
          return;
        }
        
        console.log('Purchases with details:', data);
        console.log('Number of purchases:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('First purchase sample:', data[0]);
          console.log('Available fields:', Object.keys(data[0]));
        }
        setPurchases(data || []);
      } catch (error) {
        console.error('Error in fetchPurchases:', error);
        setPurchases([]);
      }
    };
    if (user) fetchPurchases();
  }, [user]);

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
      <Navbar logoText="Buyer Dashboard" />
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
                userProfile?.full_name?.charAt(0) || 'B'
              )}
            </div>
            <h3>{userProfile?.full_name || 'Buyer'}</h3>
            <p>Car Buyer</p>

          </div>
          

          <nav className={styles.sidebarNav}>
            <button 
              className={`${styles.navItem} ${activeTab === 'browse' ? styles.active : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              Dashboard
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'purchases' ? styles.active : ''}`}
              onClick={() => setActiveTab('purchases')}
            >
              My Purchases
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
              onClick={() => setShowEditProfileModal(true)}
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
          {activeTab === 'browse' && (
            <div className={styles.browseCars}>
              {/* Overview Stats Section */}
              <div className={styles.overviewStats}>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🚗</div>
                    <h3>Available Cars</h3>
                    <p className={styles.statNumber}>{availableCars.length}</p>
                    <small>Cars ready for purchase</small>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>💰</div>
                    <h3>Total Purchases</h3>
                    <p className={styles.statNumber}>{purchases.length}</p>
                    <small>Cars you've bought</small>
                  </div>
                  
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>👤</div>
                    <h3>Your Profile</h3>
                    <p className={styles.statNumber}>Active</p>
                    <small>Account status</small>
                  </div>
                </div>
              </div>
              
              {availableCars.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No cars available for purchase at the moment.</p>
                </div>
              ) : (
                <div className={styles.carsGrid}>
                  {availableCars.map(car => {
                    const carImages = getAllImages(car);
                    const currentImageIndex = imageIndexes[car.id] || 0;
                    
                    console.log('🚗 Car in map:', car.title, 'ID:', car.id); // Debug: Check car details
                    console.log('🖼️ Car images:', carImages, 'Count:', carImages.length); // Debug: Check images array
                    console.log('📍 Current image index:', currentImageIndex, 'Total images:', carImages.length); // Debug: Check current index
                    
                    return (
                      <div key={car.id} className={styles.carCard}>
                        {/* Car Title - Clear and Professional */}
                        <h3 className={styles.carTitle}>
                          {car.title || `${car.make || 'Car'} ${car.model || ''} ${car.year || ''}`}
                        </h3>
                        
                        {/* Gallery block - improved version */}
                        <div className={styles.carImageContainer}>
                          {/* Main image */}
                          <img
                            src={carImages[currentImageIndex] || '/carp2.png'}
                            alt={car.title}
                            className={styles.mainImage}
                            onError={(e) => {
                              e.target.src = '/carp2.png';
                              console.log('Image failed to load, using fallback');
                            }}
                          />
                        </div>
                        
                        {/* Thumbnails row - only show if more than 1 image */}
                        {carImages.length > 1 && (
                          <div className={styles.thumbnailsRow}>
                            {carImages.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className={
                                  styles.thumbnail +
                                  (currentImageIndex === idx ? ' ' + styles.activeThumbnail : '')
                                }
                                onClick={() => {
                                  console.log('Clicking thumbnail:', idx, 'for car:', car.id);
                                  setImageIndexes(prev => ({ ...prev, [car.id]: idx }));
                                }}
                                onError={(e) => {
                                  e.target.src = '/carp2.png';
                                  console.log('Thumbnail failed to load, using fallback');
                                }}
                              />
                            ))}
                          </div>
                        )}
                        
                        <div className={styles.carDetails}>
                          {/* Car Description */}
                          <p className={styles.carDescription}>{car.description}</p>
                          
                          {/* Price - Professional Badge Style */}
                          <div className={styles.priceContainer}>
                            <span className={styles.priceLabel}>Price:</span>
                            <span className={styles.price}>${car.price?.toLocaleString() || '0'}</span>
                          </div>
                          
                          {/* Status Badge - Professional Style */}
                          <div className={styles.statusContainer}>
                            <span className={car.status === 'sold' ? styles.soldBadge : styles.availableBadge}>
                          {car.status === 'sold' ? 'Sold' : 'Available'}
                            </span>
                          </div>
                          
                          {/* Seller Info - Enhanced with Avatar */}
                          <div className={styles.sellerInfo}>
                            <div className={styles.sellerAvatar}>
                              {car.seller?.avatar_url ? (
                                <img 
                                  src={car.seller.avatar_url} 
                                  alt="Seller Avatar" 
                                  className={styles.avatarImage}
                                />
                              ) : (
                                <div className={styles.avatarPlaceholder}>
                                  {car.seller?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                                </div>
                              )}
                            </div>
                            <div className={styles.sellerDetails}>
                              <span className={styles.sellerName}>
                                <strong>Seller:</strong> {car.seller?.full_name || 'N/A'}
                              </span>
                              {car.seller?.email && (
                                <span className={styles.sellerEmail}>{car.seller.email}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons - Professional Layout */}
                          <div className={styles.actionButtons}>
                          {car.status === 'available' ? (
                            <button 
                              className={styles.buyBtn}
                            onClick={() => setCheckoutCar({ ...car, seller_id: car.seller_id })}
                            >
                              Buy Now
                            </button>
                          ) : (
                            <div className={styles.soldBadge}>
                              Sold
                          </div>
                        )}
                          
                            {/* Message Button - Integrated */}
                            <button 
                              className={styles.messageBtn}
                              onClick={() => {
                                console.log('🎯 Message button clicked!');
                                console.log('📊 Full Car Object:', car);
                                console.log('📊 Car data breakdown:', { 
                                  carId: car.id, 
                                  sellerId: car.seller_id,
                                  seller: car.seller,
                                  seller_id: car.seller_id,
                                  'car.seller?.id': car.seller?.id,
                                  'car.seller_id': car.seller_id
                                });
                                
                                // Try to get seller ID from multiple possible sources
                                const sellerId = car.seller_id || car.seller?.id || car.seller_id;
                                console.log('🎯 Final sellerId to use:', sellerId);
                                
                                if (!sellerId) {
                                  console.error('❌ No seller ID found! Cannot open chat.');
                                  alert('Error: Seller information not available for this car.');
                                  return;
                                }
                                
                                onOpenChat(car.id, sellerId, [], null, '', null, false, null);
                              }}
                              style={{ position: 'relative' }}
                            >
                              💬 Message
                              {/* Unread Count Badge */}
                              {unreadCounts[car.id] > 0 && (
                                <span 
                                  style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-8px',
                                    background: 'red',
                                    color: 'white',
                                    borderRadius: '50%',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    minWidth: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    zIndex: 10
                                  }}
                                >
                                  {unreadCounts[car.id]}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === 'purchases' && (
            <div>
              <h1 className={styles.pageTitle}>My Purchases</h1>
              {purchases.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>You have not purchased any cars yet.</p>
                </div>
              ) : (
                <div className={styles.purchases}>
                  {purchases.map((purchase) => {
                    const purchaseImages = getAllImages(purchase);
                    const currentImageIndex = imageIndexes[purchase.id] || 0;
                    
                    return (
                      <div key={purchase.id} className={styles.carCard}>
                        <h3 className={styles.carTitle}>{purchase.title || purchase.cars?.title || "Car"}</h3>
                        
                        {/* Gallery block for purchased cars - improved version */}
                      <div className={styles.carImageContainer}>
                        {/* Main image */}
                        <img
                            src={purchaseImages[currentImageIndex] || '/carp2.png'}
                          alt={purchase.title || purchase.cars?.title || "Car"}
                            className={styles.mainImage}
                            onError={(e) => {
                              e.target.src = '/carp2.png';
                              console.log('Purchase image failed to load, using fallback');
                            }}
                        />
                          
                          {/* Thumbnails row - only show if more than 1 image */}
                          {purchaseImages.length > 1 && (
                          <div className={styles.thumbnailsRow}>
                              {purchaseImages.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className={
                                  styles.thumbnail +
                                    (currentImageIndex === idx ? ' ' + styles.activeThumbnail : '')
                                  }
                                  onClick={() => {
                                    console.log('Clicking purchase thumbnail:', idx, 'for purchase:', purchase.id);
                                    setImageIndexes(prev => ({ ...prev, [purchase.id]: idx }));
                                  }}
                                  onError={(e) => {
                                    e.target.src = '/carp2.png';
                                    console.log('Purchase thumbnail failed to load, using fallback');
                                  }}
                              />
                            ))}
                          </div>
                          )}
                        </div>
                        
                        <div className={styles.carDetails}>
                          <p className={styles.carDescription}>{purchase.description || purchase.cars?.description}</p>
                      <p className={styles.price}>${purchase.price || purchase.cars?.price || 'N/A'}</p>
                          
                      <div className={styles.sellerInfo}>
                        <div>Seller: <b>{purchase.seller_name || purchase.seller?.full_name || 'Unknown'}</b></div>
                        {(purchase.seller_email || purchase.seller?.email) && (
                          <div style={{ color: '#888', fontSize: '12px' }}>
                            {purchase.seller_email || purchase.seller?.email}
                          </div>
                        )}
                      </div>
                          
                      <div className={styles.soldBadge}>Purchased</div>
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
                <p>Car buying ke liye koi b sawal pooch sktay hein.</p>
              </div>
              <div className={styles.chatSection}>
                <AIChat 
                  context="buyer-dashboard"
                  isFloating={false}
                  userId={user?.id}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Chat Modal */}
      {console.log('🔍 Rendering chat modal. showChat:', showChat)}
      {showChat && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{ 
            background: '#fff', 
            padding: 0, 
            borderRadius: 12, 
            width: '100%', 
            maxWidth: 500, 
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px 20px',
              background: '#007bff',
              color: 'white'
            }}>
              <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '600' }}>💬 Chat with Seller</h2>
                {chatSellerInfo && (
                  <div style={{ 
                    fontSize: '12px', 
                    opacity: 0.9, 
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>👤 {chatSellerInfo.full_name || 'Seller'}</span>
                    {chatSellerInfo.email && (
                      <span style={{ opacity: 0.8 }}>• {chatSellerInfo.email}</span>
                    )}
                  </div>
                )}
              </div>
              <button 
                onClick={closeChat}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: 'none',
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
            
            {/* Chat Interface */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px',
              background: '#f8f9fa',
              minHeight: '250px'
            }}>
              {localMessages.length > 0 ? (
                    localMessages.map((msg, index) => (
                      <div key={index} style={{
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
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#888', 
                  marginTop: '80px',
                  fontSize: '14px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>💬</div>
                  No messages yet.<br/>
                  <small style={{ fontSize: '12px', opacity: 0.7 }}>Start the conversation!</small>
                </div>
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
                onClick={() => {
                  console.log('🎯 Send button clicked!');
                  console.log('📝 Current message:', localMessage);
                  console.log('🔒 Button disabled:', !localMessage.trim() || sending);
                  handleSendMessage();
                }}
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

      {checkoutCar && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 350 }}>
            <h2>Pay for {checkoutCar.title}</h2>
            <StripeCheckoutModal
              car={checkoutCar}
              userId={user.id}
              onSuccess={async (paymentIntent) => {
                await handlePurchase(checkoutCar); // Insert purchase from frontend (old working way)
                setCheckoutCar(null);
                alert('Payment successful! Car marked as sold.');
              }}
            />
            <button onClick={() => setCheckoutCar(null)} style={{ marginTop: 16 }}>Cancel</button>
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
                        alt="Buyer Profile" 
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
                        {userProfile?.full_name?.charAt(0) || 'B'}
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                    id="buyerModalAvatarInput"
                  />
                  <label
                    htmlFor="buyerModalAvatarInput"
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

      <Footer userType="buyer" />
    </div>
  );
} 