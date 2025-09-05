import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../utils/supabaseClient';
import styles from '../../../styles/Forum.module.css';

export default function DiscussionDetail() {
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingToReply, setReplyingToReply] = useState(null);
  const [replyToReplyContent, setReplyToReplyContent] = useState('');
  const [submittingReplyToReply, setSubmittingReplyToReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [userLikes, setUserLikes] = useState(new Set());

  const router = useRouter();
  const { id } = router.query;

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Since Supabase now has Asia timezone, show relative time
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 30) return 'Just now';
    if (diffInMinutes < 1) return `${diffInSeconds}s ago`;
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    // For older dates, show full date
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    if (id) {
      console.log('🔍 Discussion ID from URL:', id, 'Type:', typeof id);
      const discussionId = parseInt(id);
      console.log('🔍 Parsed Discussion ID:', discussionId);
      
      if (!isNaN(discussionId)) {
        // First check if user is already authenticated
        const checkUser = async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              console.log('✅ User already authenticated:', session.user);
              setUser(session.user);
              
              // Fetch user profile
              const { data: profile } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('id', session.user.id)
                .single();
              setUserProfile(profile);
              
              await fetchDiscussion(discussionId);
              await fetchReplies(discussionId);
              await fetchUserLikes(discussionId);
            } else {
              console.log('❌ No authenticated session found');
              setUser(null);
              setUserProfile(null);
              await fetchDiscussion(discussionId);
              await fetchReplies(discussionId);
            }
          } catch (error) {
            console.error('❌ Error checking session:', error);
            setUser(null);
            await fetchDiscussion(discussionId);
            await fetchReplies(discussionId);
          }
        };
        
        checkUser();
      } else {
        console.error('❌ Invalid discussion ID:', id);
      }
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('❌ Error fetching user:', error);
        setUser(null);
      } else {
        console.log('✅ User fetched:', user);
        setUser(user);
      }
    } catch (error) {
      console.error('❌ Error in fetchUser:', error);
      setUser(null);
    }
  };

  const fetchDiscussion = async (discussionId) => {
    try {
      console.log('🔍 Fetching discussion with ID:', discussionId);
      
      // First get basic discussion without joins
      const { data: discussionData, error: discussionError } = await supabase
        .from('car_discussions')
        .select('*')
        .eq('id', discussionId)
        .single();

      console.log('🔍 Basic discussion response:', { data: discussionData, error: discussionError });
      
      if (discussionError) {
        console.error('❌ Supabase error:', discussionError);
        // Don't throw error, just log it and continue
        console.log('🔄 Will retry fetching discussion...');
        return;
      }
      
      if (discussionData) {
        console.log('✅ Basic discussion found:', discussionData);
        
        // Now get user profile separately
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', discussionData.user_id)
          .single();
        
        // Get car details separately
        const { data: carData } = await supabase
          .from('cars')
          .select('title, image_url, price, description')
          .eq('id', discussionData.car_id)
          .single();
        
        // Combine all data
        const fullDiscussion = {
          ...discussionData,
          profiles: profileData || { full_name: 'Anonymous', email: 'anonymous@example.com' },
          cars: carData || { title: 'Unknown Car', image_url: null, price: null, description: null }
        };
        
        console.log('✅ Full discussion with details:', fullDiscussion);
        
        // Get actual views count from discussion_views table
        const actualViews = await getViewsFromDiscussionViews(discussionId);
        
        // Update discussion with actual views count
        const discussionWithActualViews = {
          ...fullDiscussion,
          views: actualViews
        };
        
        console.log('✅ Discussion with actual views:', discussionWithActualViews);
        setDiscussion(discussionWithActualViews);
        
        // Increase view count for this user
        await increaseViewCount(discussionId);
      } else {
        console.log('❌ No discussion data found, but continuing to show loading...');
        // Don't set error, just keep loading state
      }
    } catch (error) {
      console.error('❌ Error fetching discussion:', error);
      // Don't set error state, just log it and continue loading
      // This prevents the "Discussion not found" error from showing
    }
  };

  const increaseViewCount = async (discussionId) => {
    try {
      if (!user) {
        console.log('👁️ No user logged in, skipping view count');
        return;
      }

      console.log('👁️ Increasing view count for discussion:', discussionId, 'User:', user.id);
      
      // Check if user already viewed this discussion
      const { data: existingView, error: viewCheckError } = await supabase
        .from('discussion_views')
        .select('id')
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id)
        .single();
      
      if (viewCheckError && viewCheckError.code !== 'PGRST116') {
        console.error('❌ Error checking existing view:', viewCheckError);
        return;
      }
      
      // If user already viewed, don't increment
      if (existingView) {
        console.log('👁️ User already viewed this discussion, skipping increment');
        return;
      }
      
      // Insert view record into discussion_views table
      const { error: insertError } = await supabase
        .from('discussion_views')
        .insert({
          discussion_id: discussionId,
          user_id: user.id,
          viewed_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('❌ Error inserting view record:', insertError);
        return;
      }
      
      // Get total views count from discussion_views table
      const { data: viewCountData, error: countError } = await supabase
        .from('discussion_views')
        .select('id', { count: 'exact' })
        .eq('discussion_id', discussionId);
      
      if (countError) {
        console.error('❌ Error counting views:', countError);
        return;
      }
      
      const totalViews = viewCountData?.length || 0;
      console.log('👁️ Total views from discussion_views table:', totalViews);
      
      // Update car_discussions table with new count
      const { error: updateError } = await supabase
        .from('car_discussions')
        .update({ 
          views: totalViews
        })
        .eq('id', discussionId);
      
      if (updateError) {
        console.error('❌ Error updating car_discussions views:', updateError);
      } else {
        console.log('✅ View count updated in car_discussions:', totalViews);
        
        // Update local discussion state
        setDiscussion(prev => prev ? { ...prev, views: totalViews } : null);
      }
    } catch (error) {
      console.error('❌ Error in increaseViewCount:', error);
    }
  };

  const getViewsFromDiscussionViews = async (discussionId) => {
    try {
      console.log('👁️ Getting views count from discussion_views table for discussion:', discussionId);
      
      const { data: viewCountData, error: countError } = await supabase
        .from('discussion_views')
        .select('id', { count: 'exact' })
        .eq('discussion_id', discussionId);
      
      if (countError) {
        console.error('❌ Error counting views from discussion_views:', countError);
        return 0;
      }
      
      const totalViews = viewCountData?.length || 0;
      console.log('👁️ Total views from discussion_views table:', totalViews);
      
      return totalViews;
    } catch (error) {
      console.error('❌ Error in getViewsFromDiscussionViews:', error);
      return 0;
    }
  };

  const fetchUserLikes = async (discussionId) => {
    try {
      if (!user) return;
      
      console.log('❤️ Fetching user likes for discussion:', discussionId);
      
      // Get discussion likes by this user
      const { data: discussionLikes } = await supabase
        .from('forum_likes')
        .select('id')
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id);
      
      // Get reply likes by this user
      const { data: replyLikes } = await supabase
        .from('reply_likes')
        .select('reply_id')
        .eq('user_id', user.id);
      
      const userLikesSet = new Set();
      
      // Add discussion like
      if (discussionLikes && discussionLikes.length > 0) {
        userLikesSet.add(`discussion_${discussionId}`);
      }
      
      // Add reply likes
      if (replyLikes) {
        replyLikes.forEach(like => {
          userLikesSet.add(`reply_${like.reply_id}`);
        });
      }
      
      console.log('❤️ User likes found:', userLikesSet);
      setUserLikes(userLikesSet);
      
    } catch (error) {
      console.error('❌ Error fetching user likes:', error);
    }
  };

  const fetchReplies = async (discussionId) => {
    try {
      console.log('🔍 Fetching replies for discussion ID:', discussionId);
      
      // First get basic replies without joins
      const { data: repliesData, error: repliesError } = await supabase
        .from('discussion_replies')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: false }); // Recent first (YouTube style)

      console.log('🔍 Basic replies response:', { data: repliesData, error: repliesError });
      
      if (repliesError) throw repliesError;
      
      if (repliesData && repliesData.length > 0) {
        // Now get user profiles separately
        const repliesWithProfiles = await Promise.all(
          repliesData.map(async (reply) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', reply.user_id)
              .single();
            
            return {
              ...reply,
              profiles: profileData || { full_name: 'Anonymous', email: 'anonymous@example.com' }
            };
          })
        );
        
        // Organize replies into nested structure
        const organizedReplies = organizeReplies(repliesWithProfiles);
        
        console.log('✅ Organized replies:', organizedReplies);
        console.log('🔍 Checking for nested replies:');
        organizedReplies.forEach((reply, index) => {
          if (reply.children && reply.children.length > 0) {
            console.log(`  Reply ${index + 1} (ID: ${reply.id}) has ${reply.children.length} nested replies:`, reply.children);
          }
        });
        setReplies(organizedReplies);
      } else {
        setReplies([]);
      }
    } catch (error) {
      console.error('❌ Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to organize replies into nested structure
  const organizeReplies = (replies) => {
    const replyMap = new Map();
    const topLevelReplies = [];

    // First pass: create a map of all replies
    replies.forEach(reply => {
      replyMap.set(reply.id, { ...reply, children: [] });
    });

    // Second pass: organize into nested structure
    replies.forEach(reply => {
      if (reply.parent_reply_id) {
        // This is a nested reply
        const parentReply = replyMap.get(reply.parent_reply_id);
        if (parentReply) {
          parentReply.children.push(replyMap.get(reply.id));
        }
      } else {
        // This is a top-level reply
        topLevelReplies.push(replyMap.get(reply.id));
      }
    });

    // Sort top-level replies by created_at (recent first)
    topLevelReplies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Sort nested replies by created_at (recent first)
    topLevelReplies.forEach(reply => {
      if (reply.children && reply.children.length > 0) {
        reply.children.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    });

    return topLevelReplies;
  };

  const handleToggleLike = async (type, targetId) => {
    try {
      console.log('❤️ handleToggleLike called with:', { type, targetId, user: user?.id });
      
      if (!user) {
        console.log('❌ No user logged in');
        return;
      }

      const likeKey = `${type}_${targetId}`;
      const isLiked = userLikes.has(likeKey);
      
      console.log('❤️ Toggling like:', { type, targetId, isLiked, likeKey, currentUserLikes: Array.from(userLikes) });
      
      if (type === 'discussion') {
        // Handle discussion like toggle
        if (isLiked) {
          // Unlike discussion - remove from likes table
          const { error: deleteError } = await supabase
            .from('forum_likes')
            .delete()
            .eq('discussion_id', targetId)
            .eq('user_id', user.id);
          
          if (deleteError) {
            console.error('❌ Error removing like:', deleteError);
            return;
          }
          
          // Update discussion likes count
          const newLikes = Math.max(0, (discussion.likes || 0) - 1);
          const { error: updateError } = await supabase
            .from('car_discussions')
            .update({ likes: newLikes })
            .eq('id', targetId);
          
          if (updateError) {
            console.error('❌ Error updating discussion likes:', updateError);
          } else {
            setDiscussion(prev => ({ ...prev, likes: newLikes }));
            setUserLikes(prev => {
              const newSet = new Set(prev);
              newSet.delete(likeKey);
              return newSet;
            });
            console.log('❤️ Discussion unliked successfully');
          }
        } else {
          // Like discussion - add to likes table
          const { error: insertError } = await supabase
            .from('forum_likes')
            .insert({
              discussion_id: targetId,
              user_id: user.id
            });
          
          if (insertError) {
            console.error('❌ Error adding like:', insertError);
            return;
          }
          
          // Update discussion likes count
          const newLikes = (discussion.likes || 0) + 1;
          const { error: updateError } = await supabase
            .from('car_discussions')
            .update({ likes: newLikes })
            .eq('id', targetId);
          
          if (updateError) {
            console.error('❌ Error updating discussion likes:', updateError);
          } else {
            setDiscussion(prev => ({ ...prev, likes: newLikes }));
            setUserLikes(prev => new Set([...prev, likeKey]));
            console.log('❤️ Discussion liked successfully');
          }
        }
      } else if (type === 'reply') {
        // Handle reply like toggle
        if (isLiked) {
          // Unlike reply
          const { error: deleteError } = await supabase
            .from('reply_likes')
            .delete()
            .eq('reply_id', targetId)
            .eq('user_id', user.id);
          
          if (deleteError) {
            console.error('❌ Error removing reply like:', deleteError);
            return;
          }
          
          // Update reply likes count
          setReplies(prev => prev.map(reply => {
            if (reply.id === targetId) {
              return { ...reply, likes: Math.max(0, (reply.likes || 0) - 1) };
            }
            return reply;
          }));
          
          setUserLikes(prev => {
            const newSet = new Set(prev);
            newSet.delete(likeKey);
            return newSet;
          });
          console.log('❤️ Reply unliked successfully');
        } else {
          // Like reply
          const { error: insertError } = await supabase
            .from('reply_likes')
            .insert({
              reply_id: targetId,
              user_id: user.id
            });
          
          if (insertError) {
            console.error('❌ Error adding reply like:', insertError);
            return;
          }
          
          // Update reply likes count
          setReplies(prev => prev.map(reply => {
            if (reply.id === targetId) {
              return { ...reply, likes: (reply.likes || 0) + 1 };
            }
            return reply;
          }));
          
          setUserLikes(prev => new Set([...prev, likeKey]));
          console.log('❤️ Reply liked successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error in handleToggleLike:', error);
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    
    // Better validation
    if (!newReply.trim()) {
      alert('Please enter a reply message');
      return;
    }
    
    if (!user) {
      alert('Please login to post a reply');
      return;
    }

    setSubmitting(true);
    try {
      const discussionId = parseInt(id);
      console.log('🔍 Adding reply to discussion ID:', discussionId);
      console.log('🔍 User ID:', user.id);
      console.log('🔍 Reply content:', newReply.trim());
      
      const { data, error } = await supabase
        .from('discussion_replies')
        .insert({
          discussion_id: discussionId,
          user_id: user.id,
          content: newReply.trim()
        })
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        alert(`Error posting reply: ${error.message}`);
        throw error;
      }

      console.log('✅ Reply posted successfully:', data);
      setNewReply('');
      await fetchReplies(discussionId); // Refresh replies
      alert('Reply posted successfully!');
    } catch (error) {
      console.error('❌ Error adding reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplyToReply = (replyId, replyAuthorName) => {
    setReplyingToReply({ id: replyId, authorName: replyAuthorName });
    setReplyToReplyContent('');
  };

  const handleSubmitReplyToReply = async (e) => {
    e.preventDefault();
    
    // Better validation
    if (!replyToReplyContent.trim()) {
      alert('Please enter a reply message');
      return;
    }
    
    if (!user) {
      alert('Please login to post a reply');
      return;
    }
    
    if (!replyingToReply) {
      alert('Reply context not found');
      return;
    }

    setSubmittingReplyToReply(true);
    try {
      const discussionId = parseInt(id);
      console.log('🔍 Adding reply to reply ID:', replyingToReply.id);
      console.log('🔍 User ID:', user.id);
      console.log('🔍 Reply content:', replyToReplyContent.trim());
      
      const { data, error } = await supabase
        .from('discussion_replies')
        .insert({
          discussion_id: discussionId,
          user_id: user.id,
          content: `@${replyingToReply.authorName} ${replyToReplyContent.trim()}`,
          parent_reply_id: replyingToReply.id
        })
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        alert(`Error posting reply: ${error.message}`);
        throw error;
      }

      console.log('✅ Reply to reply posted successfully:', data);
      setReplyToReplyContent('');
      setReplyingToReply(null);
      await fetchReplies(discussionId); // Refresh replies
      alert('Reply posted successfully!');
    } catch (error) {
      console.error('❌ Error adding reply to reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setSubmittingReplyToReply(false);
    }
  };

  const handleCancelReplyToReply = () => {
    setReplyingToReply(null);
    setReplyToReplyContent('');
  };

  const toggleNestedReplies = (replyId) => {
    console.log('🔄 Toggling nested replies for reply:', replyId);
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(replyId)) {
        newSet.delete(replyId);
        console.log('👁️ Hiding nested replies for reply:', replyId);
      } else {
        newSet.add(replyId);
        console.log('👁️ Showing nested replies for reply:', replyId);
      }
      return newSet;
    });
  };

  const handleReplyClick = async (replyId) => {
    // Update view count when reply is clicked
    if (user) {
      try {
        console.log('👁️ Reply clicked, updating view count for discussion:', id);
        
        // Check if user already viewed this discussion
        const { data: existingView, error: viewCheckError } = await supabase
          .from('discussion_views')
          .select('id')
          .eq('discussion_id', id)
          .eq('user_id', user.id)
          .single();
        
        if (viewCheckError && viewCheckError.code !== 'PGRST116') {
          console.error('❌ Error checking existing view:', viewCheckError);
        } else if (!existingView) {
          // Insert view record into discussion_views table
          const { error: insertError } = await supabase
            .from('discussion_views')
            .insert({
              discussion_id: id,
              user_id: user.id,
              viewed_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('❌ Error inserting view record:', insertError);
          } else {
            console.log('✅ View record inserted for discussion:', id);
            
            // Update local discussion views count
            setDiscussion(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
          }
        }
      } catch (error) {
        console.error('❌ Error updating view count:', error);
      }
    }
    
    // Navigate to discussion page when reply is clicked
    router.push(`/forum/discussion/${id}`);
  };

  const handleLike = async (type, itemId) => {
    if (!user) return;

    try {
      const discussionId = parseInt(id);
      
      if (type === 'discussion') {
        // Toggle like for discussion
        const { error } = await supabase
          .from('forum_likes')
          .upsert({
            user_id: user.id,
            discussion_id: itemId
          });
        
        if (error) throw error;
        await fetchDiscussion(discussionId); // Refresh discussion
      } else if (type === 'reply') {
        // Toggle like for reply
        const { error } = await supabase
          .from('forum_likes')
          .upsert({
            user_id: user.id,
            reply_id: itemId
          });
        
        if (error) throw error;
        await fetchReplies(discussionId); // Refresh replies
      }
    } catch (error) {
      console.error('❌ Error handling like:', error);
    }
  };



  const goBack = () => {
    router.push('/forum');
  };

  const goToDashboard = () => {
    if (user && userProfile) {
      // Redirect based on user type with force refresh
      if (userProfile.user_type === 'admin') {
        window.location.href = '/admin-dashboard';
      } else if (userProfile.user_type === 'seller') {
        window.location.href = '/seller-dashboard';
      } else if (userProfile.user_type === 'buyer') {
        window.location.href = '/buyer-dashboard';
      } else {
        window.location.href = '/buyer-dashboard'; // Default to buyer dashboard
      }
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading discussion...</p>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading discussion...</p>
      </div>
    );
  }

  return (
    <div className={styles.discussionContainer}>
      {/* Professional Header */}
      <div className={styles.professionalHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button onClick={goBack} className={styles.backBtn}>
              ← Back to Forum
            </button>
          </div>
          <div className={styles.headerCenter}>
            <h1 className={styles.discussionTitle}>{discussion.title}</h1>
          </div>
          <div className={styles.headerRight}>
            <button onClick={goToDashboard} className={styles.dashboardBtn}>
              🏠 Go to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Discussion - Bubble Forum Style */}
      <div className={styles.mainDiscussion}>
        <div className={styles.discussionHeader}>
          <div className={styles.discussionMeta}>
            <span className={styles.discussionTime}>
              📅 {formatTime(discussion.created_at)}
            </span>
          </div>
          
          <div className={styles.discussionMeta}>
            <div className={styles.authorInfo}>
              <div className={styles.authorAvatar}>
                {discussion.profiles?.full_name?.charAt(0) || 'A'}
              </div>
              <div className={styles.authorDetails}>
                <span className={styles.authorName}>
                  {discussion.profiles?.full_name || 'Anonymous'}
                </span>
                <span className={styles.authorRole}>Member</span>
              </div>
            </div>
            <div className={styles.discussionInfo}>
              <span className={styles.time}>
                {formatTime(discussion.created_at)}
              </span>
              <span className={styles.discussionId}>#{discussion.id}</span>
            </div>
          </div>
        </div>

        {/* Professional Discussion Content */}
        <div className={styles.discussionContent}>
          <p>{discussion.content}</p>
        </div>

        <div className={styles.discussionActions}>
          <div className={styles.actionRow}>
            <button 
              className={`${styles.actionBtn} ${userLikes.has(`discussion_${discussion.id}`) ? styles.liked : ''}`}
              onClick={() => handleToggleLike('discussion', discussion.id)}
            >
              👍 {discussion.likes || 0}
            </button>
            <span className={styles.viewCount}>
              👁️ {discussion.views || 0}
            </span>
            <span className={styles.replyCount}>
              💬 {replies.length}
            </span>
          </div>
        </div>
      </div>

      

       {/* YouTube-Style Replies Section */}
       <div className={styles.repliesSection}>
         <h3>💬 {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</h3>
         
         {/* Add Reply Form */}
         {user && (
           <div className={styles.addReplyForm}>
             <div className={styles.replyInputWrapper}>
               <div className={styles.userAvatar}>
                 {user.email?.charAt(0) || 'U'}
               </div>
               <input
                 type="text"
                 value={newReply}
                 onChange={(e) => setNewReply(e.target.value)}
                 placeholder="Add a reply..."
                 className={styles.replyInput}
                 onKeyPress={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     if (newReply.trim()) {
                       handleAddReply(e);
                     }
                   }
                 }}
               />
             </div>
             <div className={styles.replyActions}>
               <button 
                 onClick={handleAddReply}
                 className={styles.postReplyBtn}
                 disabled={submitting || !newReply.trim()}
               >
                 {submitting ? 'Posting...' : 'Post'}
               </button>
             </div>
           </div>
         )}
         
         {replies.length === 0 ? (
           <div className={styles.noReplies}>
             <p>No replies yet. Be the first to respond!</p>
           </div>
         ) : (
           <div className={styles.repliesList}>
                          {replies.map((reply, index) => (
                <div key={reply.id}>
                  <div className={styles.replyItem}>
                    {/* Reply Avatar */}
                    <div className={styles.replyAvatar}>
                      {reply.profiles?.full_name?.charAt(0) || 'A'}
                    </div>
                    
                    {/* Reply Content */}
                    <div className={styles.replyContent} onClick={() => handleReplyClick(reply.id)} style={{ cursor: 'pointer' }}>
                      <div className={styles.replyHeader}>
                        <span className={styles.replyAuthor}>
                          {reply.profiles?.full_name || 'Anonymous'}
                        </span>
                        <span className={styles.replyTime}>
                          {formatTime(reply.created_at)}
                        </span>
                      </div>
                      
                      <div className={styles.replyText}>
                        {reply.content}
                      </div>
                      
                      <div className={styles.replyActions}>
                        <button 
                          className={styles.actionBtn}
                          onClick={() => handleReplyToReply(reply.id, reply.profiles?.full_name || 'Anonymous')}
                        >
                          💬 Reply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reply to Reply Form */}
                  {replyingToReply && replyingToReply.id === reply.id && (
                    <div className={styles.replyToReplyForm}>
                      <div className={styles.replyToReplyHeader}>
                        <span>Replying to @{replyingToReply.authorName}</span>
                        <button 
                          onClick={handleCancelReplyToReply}
                          className={styles.cancelReplyBtn}
                        >
                          ✕
                        </button>
                      </div>
                      <form onSubmit={handleSubmitReplyToReply}>
                        <textarea
                          value={replyToReplyContent}
                          onChange={(e) => setReplyToReplyContent(e.target.value)}
                          placeholder={`Reply to @${replyingToReply.authorName}...`}
                          className={styles.replyToReplyTextarea}
                          rows={3}
                          required
                        />
                        <div className={styles.replyToReplyActions}>
                          <button 
                            type="button"
                            onClick={handleCancelReplyToReply}
                            className={styles.cancelReplyBtn}
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className={styles.submitReplyToReplyBtn}
                            disabled={submittingReplyToReply || !replyToReplyContent.trim()}
                          >
                            {submittingReplyToReply ? '📝 Posting...' : '📝 Post Reply'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  

                  {/* Nested Replies Count */}
                  {reply.children && reply.children.length > 0 && (
                    <div className={styles.nestedRepliesCount}>
                      <button 
                        className={styles.nestedCountButton}
                        onClick={() => toggleNestedReplies(reply.id)}
                      >
                        💬 {reply.children.length} {reply.children.length === 1 ? 'reply' : 'replies'}
                      </button>
                    </div>
                  )}

                  {/* Nested Replies (Toggle Visibility) */}
                  {reply.children && reply.children.length > 0 && expandedReplies.has(reply.id) && (
                    <div className={styles.nestedReplies}>
                      {reply.children.map((nestedReply) => (
                        <div key={nestedReply.id} className={styles.nestedReplyItem}>
                          <div className={styles.nestedReplyAvatar}>
                            {nestedReply.profiles?.full_name?.charAt(0) || 'A'}
                          </div>
                          <div className={styles.nestedReplyContent} onClick={() => handleReplyClick(nestedReply.id)} style={{ cursor: 'pointer' }}>
                            <div className={styles.nestedReplyHeader}>
                              <span className={styles.nestedReplyAuthor}>
                                {nestedReply.profiles?.full_name || 'Anonymous'}
                              </span>
                              <span className={styles.nestedReplyTime}>
                                {formatTime(nestedReply.created_at)}
                              </span>
                            </div>
                            <div className={styles.nestedReplyText}>
                              {nestedReply.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      {!user && (
        <div className={styles.loginPrompt}>
          <p>Please login to reply to this discussion.</p>
        </div>
      )}
    </div>
  );
}

