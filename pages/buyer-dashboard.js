import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIChat from '../components/AIChat';
import { supabase } from '../utils/supabaseClient';
import { getAllCarImages, onImageErrorFallback } from '../utils/carImages';
import styles from '../styles/Dashboard.module.css';
import authStyles from '../styles/Auth.module.css';
import dynamic from 'next/dynamic';
const StripeCheckoutModal = dynamic(() => import('../components/StripeCheckout'), { ssr: false });

const formatWhatsAppNumber = (number) => {
  if (!number) return null;

  let cleaned = number.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  }

  if (cleaned.startsWith('92')) {
    return cleaned;
  }

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
  const [chatSellerInfo, setChatSellerInfo] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [buyerId, setBuyerId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const [localMessage, setLocalMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState([]);
  const [imageIndexes, setImageIndexes] = useState({});
  const [selectedCarDetails, setSelectedCarDetails] = useState(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const handleOpenDetails = (car) => {
    setSelectedCarDetails(car);
    setModalImageIndex(0);
  };

  const fetchExistingMessages = async (carId, sellerId, buyerId) => {
    try {
      console.log('🔍 Buyer Dashboard: Fetching existing messages for car:', carId, 'seller:', sellerId, 'buyer:', buyerId);

      let { data, error } = await supabase
        .from('messages_with_names')
        .select('*')
        .eq('car_id', carId)
        .or(`and(sender_id.eq.${buyerId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${buyerId})`)
        .order('created_at', { ascending: true });

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

    if (sellerId) {
      const carWithSeller = availableCars.find(car => car.id === carId);
      if (carWithSeller && carWithSeller.seller) {
        setChatSellerInfo(carWithSeller.seller);
        console.log('👤 Seller info stored:', carWithSeller.seller);
      }
    }

    if (carId && sellerId && user?.id) {
      console.log('📡 Fetching existing messages...');
      const existingMessages = await fetchExistingMessages(carId, sellerId, user.id);
      setLocalMessages(existingMessages);
      console.log('✅ Existing messages loaded:', existingMessages.length);
    } else {
      setLocalMessages(messages || []);
      console.log('⚠️ Using fallback messages:', messages?.length || 0);
    }

    setChatData({
      messages,
      setMessages,
      newMessage,
      setNewMessage,
      sending,
      sendMessage
    });

    if (carId && user?.id) {
      markMessagesAsRead(carId, user.id);
    }

    console.log('🎯 Chat modal should now be visible');
    console.log('🔍 Final state check - chatCarId:', chatCarId, 'chatSellerId:', chatSellerId);
  };

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

      const newMessageObj = {
        id: Date.now(),
        car_id: chatCarId,
        sender_id: user.id,
        receiver_id: chatSellerId,
        message: localMessage.trim(),
        sender_name: 'You',
        receiver_name: 'Seller',
        created_at: new Date().toISOString()
      };

      console.log('📝 New message object:', newMessageObj);

      setLocalMessages(prev => [...prev, newMessageObj]);
      console.log('✅ Message added to local state');

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
        setLocalMessages(prev => prev.filter(msg => msg.id !== newMessageObj.id));
        return;
      }

      console.log('✅ Message saved to database successfully!');

      setLocalMessage('');
      console.log('✅ Input cleared');

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
        setUnreadCounts(prev => ({
          ...prev,
          [carId]: 0
        }));
      }
    } catch (error) {
      console.error('❌ Buyer: Error in markMessagesAsRead:', error);
    }
  };

  const getAllImages = (car) => {
    return getAllCarImages(car);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
      console.log('Buyer user:', user);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile);
      console.log('Buyer profile:', profile);

      if (profile?.user_type !== 'buyer') {
        router.push('/seller-dashboard');
        return;
      }

      const { data: buyerPurchases, error: purchasesError } = await supabase
        .from('purchases_with_details')
        .select('*')
        .eq('buyer_id', user.id);

      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError);
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

        const approvedCars = carsWithSellerDetails.filter(car => {
          console.log('Car:', car.title, 'Admin approvals:', car.admin_approvals);

          if (car.admin_approvals && car.admin_approvals.length > 0) {
            const latestApproval = car.admin_approvals[car.admin_approvals.length - 1];
            console.log('Latest approval for', car.title, ':', latestApproval);

            if (latestApproval.approval_status === 'approved') {
              console.log('Car approved:', car.title);
              return true;
            } else {
              console.log('Car not approved:', car.title);
              return false;
            }
          }

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

  useEffect(() => {
    if (user?.id) {
      console.log('🔍 Buyer: fetchUnreadCounts useEffect triggered, user.id:', user.id);
      fetchUnreadCounts();
    }
  }, [user?.id]);

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

  const fixSoldCars = async () => {
    try {
      console.log('Fixing sold cars in database...');

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

      if (allPurchases && allPurchases.length > 0) {
        const firstPurchase = allPurchases[0];
        console.log('First purchase record:', firstPurchase);
        console.log('Available columns:', Object.keys(firstPurchase));

        if (!firstPurchase.car_id) {
          console.log('car_id column does not exist in purchases table!');
          alert('❌ car_id column missing in purchases table. Please check database schema.');

          console.log('Trying alternative approach using buyer/seller relationship...');

          const buyerSellerPairs = allPurchases.map(p => ({
            buyer_id: p.buyer_id,
            seller_id: p.seller_id
          }));

          console.log('Buyer-seller pairs from purchases:', buyerSellerPairs);

          alert('Please check your database schema. Purchases table should have car_id column.');
          return;
        }
      }

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

  const handlePurchase = async (car) => {
    try {
      console.log('carToPurchase:', car);
      console.log('seller_id being sent:', car?.seller_id);
      if (!car) {
        alert('Car not found!');
        return;
      }
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
      if (!file.type.startsWith('image/')) {
        setProfileMsg('❌ Please select an image file (PNG, JPG, JPEG, GIF)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setProfileMsg('❌ File size must be less than 5MB');
        return;
      }

      try {
        setProfileMsg('📸 Uploading profile picture...');

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('user-avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          throw error;
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fdddzfnawuykljrdrlrp.supabase.co';
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'fdddzfnawuykljrdrlrp';
        const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/user-avatars/${filePath}`;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        setUserProfile(prev => ({
          ...prev,
          avatar_url: publicUrl
        }));

        setProfileMsg('✅ Profile picture updated successfully!');

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

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

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
    const { data: { user: refreshedUser } } = await supabase.auth.getUser();
    setUser(refreshedUser);
  };

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const { data, error } = await supabase
          .from('purchases_with_details')
          .select('*')
          .eq('buyer_id', user.id);

        if (error) {
          console.error('Error fetching from purchases_with_details:', error);

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
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', borderRadius: '50%' }}
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
              
              <div className={styles.overviewStats}>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={`${styles.statIcon} bg-indigo-50 border border-indigo-100/80 text-indigo-600 shadow-sm`}>
                      <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l1.5-5A2 2 0 016.42 4.5h11.16a2 2 0 011.92 1.5L21 11m-18 0h18m-18 0v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1m-11 0h6" />
                      </svg>
                    </div>
                    <h3>Available Cars</h3>
                    <p className={styles.statNumber}>{availableCars.length}</p>
                    <small>Cars ready for purchase</small>
                  </div>

                  <div className={styles.statCard}>
                    <div className={`${styles.statIcon} bg-emerald-50 border border-emerald-100/80 text-emerald-600 shadow-sm`}>
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h3>Total Purchases</h3>
                    <p className={styles.statNumber}>{purchases.length}</p>
                    <small>Cars you've bought</small>
                  </div>

                  <div className={styles.statCard}>
                    <div className={`${styles.statIcon} bg-violet-50 border border-violet-100/80 text-violet-600 shadow-sm`}>
                      <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
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

                    console.log('🚗 Car in map:', car.title, 'ID:', car.id);
                    console.log('🖼️ Car images:', carImages, 'Count:', carImages.length);
                    console.log('📍 Current image index:', currentImageIndex, 'Total images:', carImages.length);

                    return (
                      <div key={car.id} className={styles.carCard}>
                        
                        <div 
                          className={styles.carImageContainer}
                          onClick={() => handleOpenDetails(car)}
                          style={{ cursor: 'pointer' }}
                          title="Click to see details"
                        >
                          
                          <img
                            src={carImages[currentImageIndex] || '/carp2.webp'}
                            alt={car.title}
                            className={styles.mainImage}
                            onError={(e) => onImageErrorFallback(e, car.title)}
                          />
                          <div className={styles.imageOverlayTop}>
                            <span className={car.status === 'sold' ? styles.soldBadgeFloating : styles.availableBadgeFloating}>
                              {car.status === 'sold' ? 'Sold' : 'Available'}
                            </span>
                            {carImages.length > 1 && (
                              <span className={styles.photoCountBadge}>
                                📷 {carImages.length}
                              </span>
                            )}
                          </div>

                          <div className={styles.hoverDetailsOverlay}>
                            <span className={styles.hoverDetailsPill}>
                              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Click to see details
                            </span>
                          </div>
                        </div>
                        
                        <div className={styles.carDetails}>
                          
                          <div 
                            className={styles.carCardHeader}
                            onClick={() => handleOpenDetails(car)}
                            style={{ cursor: 'pointer' }}
                            title="Click to see details"
                          >
                            <h3 className={styles.carTitle}>
                              {car.title || `${car.make || 'Car'} ${car.model || ''} ${car.year || ''}`}
                            </h3>
                            <div className={styles.priceContainer}>
                              <span className={styles.price} style={{ color: '#4338ca', WebkitTextFillColor: '#4338ca' }}>
                                ${(() => {
                                  const p = car.price;
                                  if (p === null || p === undefined || p === '') return '0';
                                  const clean = String(p).replace(/^\$/, '').trim();
                                  const n = Number(clean.replace(/,/g, ''));
                                  return isNaN(n) ? clean : n.toLocaleString();
                                })()}
                              </span>
                            </div>
                          </div>

                          <div className={styles.actionButtons}>
                            {car.status === 'available' ? (
                              <button 
                                className={styles.buyBtn}
                                onClick={() => setCheckoutCar({ ...car, seller_id: car.seller_id })}
                              >
                                <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Buy Now
                              </button>
                            ) : (
                              <div className={styles.soldBadgeButton}>
                                Sold
                              </div>
                            )}

                            <button 
                              className={styles.messageBtn}
                              onClick={() => {
                                const sellerId = car.seller_id || car.seller?.id || car.seller_id;
                                if (!sellerId) {
                                  alert('Error: Seller information not available for this car.');
                                  return;
                                }
                                onOpenChat(car.id, sellerId, [], null, '', null, false, null);
                              }}
                              style={{ position: 'relative' }}
                            >
                              <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              Message Seller
                              {unreadCounts[car.id] > 0 && (
                                <span className={styles.unreadBadge}>
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
                        
                        <div 
                          className={styles.carImageContainer}
                          onClick={() => handleOpenDetails(purchase)}
                          style={{ cursor: 'pointer' }}
                          title="Click to see details"
                        >
                          
                          <img
                            src={purchaseImages[currentImageIndex] || '/carp2.webp'}
                            alt={purchase.title || purchase.cars?.title || "Car"}
                            className={styles.mainImage}
                            onError={(e) => onImageErrorFallback(e, purchase.title || purchase.cars?.title)}
                          />
                          <div className={styles.imageOverlayTop}>
                            <span className={styles.purchasedBadgeFloating}>
                              ✓ Purchased
                            </span>
                            {purchaseImages.length > 1 && (
                              <span className={styles.photoCountBadge}>
                                📷 {purchaseImages.length}
                              </span>
                            )}
                          </div>

                          <div className={styles.hoverDetailsOverlay}>
                            <span className={styles.hoverDetailsPill}>
                              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Click to see details
                            </span>
                          </div>
                        </div>
                        
                        <div className={styles.carDetails}>
                          <div 
                            className={styles.carCardHeader}
                            onClick={() => handleOpenDetails(purchase)}
                            style={{ cursor: 'pointer' }}
                            title="Click to see details"
                          >
                            <h3 className={styles.carTitle}>
                              {purchase.title || purchase.cars?.title || "Car"}
                            </h3>
                            <div className={styles.priceContainer}>
                              <span className={styles.price} style={{ color: '#4338ca', WebkitTextFillColor: '#4338ca' }}>
                                ${(() => {
                                  const p = purchase.price || purchase.cars?.price;
                                  if (p === null || p === undefined || p === '') return 'N/A';
                                  const clean = String(p).replace(/^\$/, '').trim();
                                  const n = Number(clean.replace(/,/g, ''));
                                  return isNaN(n) ? clean : n.toLocaleString();
                                })()}
                              </span>
                            </div>
                          </div>

                          <div className={styles.actionButtons} style={{ marginTop: 'auto' }}>
                            <div 
                              className={styles.soldBadgeButton}
                              onClick={() => handleOpenDetails(purchase)}
                              style={{ cursor: 'pointer', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              <span>Receipt & Full Details</span>
                            </div>
                          </div>
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
            overflow: 'hidden',
            color: '#0f172a'
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

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              background: '#f1f5f9',
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
                  No messages yet.<br />
                  <small style={{ fontSize: '12px', opacity: 0.7 }}>Start the conversation!</small>
                </div>
              )}
            </div>

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
                  padding: '12px 14px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  resize: 'none',
                  minHeight: '52px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  position: 'relative',
                  zIndex: 10,
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#cbd5e1';
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

      {selectedCarDetails && (() => {
        const item = selectedCarDetails;
        const carImages = getAllImages(item);
        const title = item.title || item.cars?.title || `${item.make || ''} ${item.model || ''} ${item.year || ''}`.trim() || 'Vehicle Details';
        const price = (() => {
          const p = item.price ?? item.cars?.price;
          if (p === null || p === undefined || p === '') return '0';
          const clean = String(p).replace(/^\$/, '').trim();
          const n = Number(clean.replace(/,/g, ''));
          return isNaN(n) ? clean : n.toLocaleString();
        })();
        const make = item.make || item.cars?.make;
        const model = item.model || item.cars?.model;
        const year = item.year || item.cars?.year;
        const description = item.description || item.cars?.description || 'No additional description provided.';
        const sellerObj = item.seller || {};
        const sellerName = item.seller_name || sellerObj.full_name || 'Verified Seller';
        const sellerEmail = item.seller_email || sellerObj.email;
        const sellerAvatar = sellerObj.avatar_url;
        const sellerId = item.seller_id || item.cars?.seller_id || sellerObj.id;
        const isAvailable = item.status === 'available' || (!item.status && !item.buyer_id);

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[9998] p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 text-slate-800 animate-in fade-in zoom-in-95 duration-200 my-8 flex flex-col max-h-[92vh]">
              
              <div className="relative px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    item.buyer_id ? 'bg-blue-100 text-blue-700' : isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {item.buyer_id ? 'Purchased' : isAvailable ? 'Available' : 'Sold'}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 m-0 truncate">
                    {title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-lg font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">
                    ${price}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCarDetails(null)}
                    className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-lg font-bold transition-colors cursor-pointer border-none"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                
                <div className="space-y-3">
                  <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-200">
                    <img
                      src={carImages[modalImageIndex] || '/carp2.webp'}
                      alt={title}
                      className="w-full h-full object-cover"
                      onError={(e) => onImageErrorFallback(e, title)}
                    />
                    {carImages.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                        Photo {modalImageIndex + 1} of {carImages.length}
                      </div>
                    )}
                  </div>

                  {carImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                      {carImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setModalImageIndex(idx)}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all p-0 flex-shrink-0 cursor-pointer ${
                            modalImageIndex === idx 
                              ? 'border-indigo-600 ring-2 ring-indigo-200 shadow-md scale-105' 
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                          style={{ width: '64px', height: '48px' }}
                        >
                          <img
                            src={img}
                            alt={`View ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => onImageErrorFallback(e, title)}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Make</span>
                    <span className="text-sm font-extrabold text-slate-800">{make || 'N/A'}</span>
                  </div>
                  <div className="border-x border-slate-200/80">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Model</span>
                    <span className="text-sm font-extrabold text-slate-800">{model || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Year</span>
                    <span className="text-sm font-extrabold text-slate-800">{year || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 m-0">
                    About This Vehicle
                  </h4>
                  <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                    {description}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 m-0">
                    Verified Seller Information
                  </h4>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md overflow-hidden flex-shrink-0">
                        {sellerAvatar ? (
                          <img src={sellerAvatar} alt={sellerName} className="w-full h-full object-cover" />
                        ) : (
                          sellerName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-100/60 px-1.5 py-0.5 rounded">
                            SELLER
                          </span>
                          <span className="text-xs text-slate-400 font-medium">Verified Merchant</span>
                        </div>
                        <h5 className="text-base font-bold text-slate-900 m-0 mt-0.5">
                          {sellerName}
                        </h5>
                        {sellerEmail && (
                          <p className="text-xs text-slate-500 m-0 font-medium">{sellerEmail}</p>
                        )}
                      </div>
                    </div>

                    {sellerId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCarDetails(null);
                          onOpenChat(item.id, sellerId, [], null, '', null, false, null);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCarDetails(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
                
                {sellerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCarDetails(null);
                      onOpenChat(item.id, sellerId, [], null, '', null, false, null);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message Seller
                  </button>
                )}

                {isAvailable && (
                  <button
                    type="button"
                    onClick={() => {
                      const checkoutPayload = { ...item, seller_id: item.seller_id || sellerId };
                      setSelectedCarDetails(null);
                      setCheckoutCar(checkoutPayload);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer border-none"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Buy Now (${price})
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {checkoutCar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 text-slate-800 animate-in fade-in zoom-in-95 duration-200 my-8">
            
            <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-lg shadow-sm">
                  💳
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 m-0">Secure Checkout</h3>
                  <p className="text-xs text-slate-500 m-0 font-medium">Encrypted & powered by Stripe</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutCar(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-base font-bold transition-colors cursor-pointer border-none"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="px-6 pt-4 pb-2">
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <img
                  src={checkoutCar.image_url || (checkoutCar.additional_images && checkoutCar.additional_images[0]) || '/carp2.webp'}
                  alt={checkoutCar.title}
                  className="w-16 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                  onError={(e) => { e.target.src = '/carp2.webp'; }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate m-0">
                    {checkoutCar.title}
                  </h4>
                  <p className="text-xs text-slate-500 m-0 truncate">
                    {checkoutCar.make || ''} {checkoutCar.model || ''} {checkoutCar.year ? `(${checkoutCar.year})` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs text-slate-400 block font-semibold">Total Price</span>
                  <span className="text-base font-black text-indigo-600">
                    ${Number(checkoutCar.price || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <StripeCheckoutModal
                car={checkoutCar}
                userId={user?.id}
                onSuccess={async (paymentIntent) => {
                  await handlePurchase(checkoutCar); // Insert purchase from frontend (old working way)
                  setCheckoutCar(null);
                  alert('Payment successful! Car marked as sold.');
                }}
                onCancel={() => setCheckoutCar(null)}
              />
            </div>
          </div>
        </div>
      )}

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
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 32px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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

            <div style={{ padding: '32px', overflowY: 'auto' }}>
              <form onSubmit={handleProfileUpdate} className={authStyles.authForm} style={{ margin: 0 }}>
                
                <div style={{
                  textAlign: 'center',
                  marginBottom: '24px',
                  padding: '20px',
                  background: '#f1f5f9',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
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
                          objectPosition: 'top center',
                          borderRadius: '50%',
                          border: '3px solid #6366f1'
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
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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
                      background: (editName !== originalName || editEmail !== originalEmail) ? '#6366f1' : '#ccc',
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
                      background: '#ef4444',
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
                      e.target.style.background = '#ef4444';
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