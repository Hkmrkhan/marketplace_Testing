import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import styles from '../../styles/Forum.module.css';

export default function ForumHome() {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchDiscussions();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible, refreshing discussions...');
        fetchDiscussions();
      }
    };

    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing discussions...');
      fetchDiscussions();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchUser = async () => {
    console.log('🔍 Fetching user...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔍 User fetched:', user);
    setUser(user);
    
    if (user) {
      console.log('🔍 Fetching user profile...');
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
      
      console.log('🔍 Profile fetched:', profile, 'Error:', error);
      setUserProfile(profile);
    } else {
      console.log('🔍 No user found');
      setUserProfile(null);
    }
  };

  const fetchDiscussions = async () => {
    try {
      console.log('🚀 Fetching discussions from Supabase...');
      
      const { data: discussionsData, error: discussionsError } = await supabase
        .from('car_discussions')
        .select('*')
        .order('created_at', { ascending: false });

      if (discussionsError) {
        console.error('❌ Error fetching discussions:', discussionsError);
        throw discussionsError;
      }

      console.log('✅ Basic discussions fetched:', discussionsData);

      if (discussionsData && discussionsData.length > 0) {
        const discussionsWithDetails = await Promise.all(
          discussionsData.map(async (discussion) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', discussion.user_id)
              .single();

            const { data: carData } = await supabase
              .from('cars')
              .select('title, image_url')
              .eq('id', discussion.car_id)
              .single();

            return {
              ...discussion,
              author_name: profileData?.full_name || 'Anonymous',
              car_title: carData?.title || 'Unknown Car'
            };
          })
        );

        console.log('✅ Discussions with details:', discussionsWithDetails);
        
        const discussionsWithReplies = await Promise.all(
          discussionsWithDetails.map(async (discussion) => {
            console.log('🔍 Processing discussion:', discussion.id, discussion.title);
            
            const { count: replyCount } = await supabase
              .from('discussion_replies')
              .select('*', { count: 'exact', head: true })
              .eq('discussion_id', discussion.id);
            
            const { data: viewData, error: viewError } = await supabase
              .from('discussion_views')
              .select('id')
              .eq('discussion_id', discussion.id);
            
            const viewCount = viewData ? viewData.length : 0;
            
            const processedDiscussion = {
              ...discussion,
              replies_count: replyCount || 0,
              views: viewCount || 0
            };
            
            console.log('✅ Processed discussion:', processedDiscussion);
            return processedDiscussion;
          })
        );

        console.log('🎯 Final discussions with replies:', discussionsWithReplies);
        setDiscussions(discussionsWithReplies);
      } else {
        console.log('❌ No discussions found in database');
        setDiscussions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching discussions:', error);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
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
    
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleNewDiscussion = () => {
    router.push('/forum/create');
  };

  const handleDiscussionClick = async (discussionId) => {
    if (user) {
      try {
        console.log('👁️ Title clicked, updating view count for discussion:', discussionId);
        
        const { data: existingView, error: viewCheckError } = await supabase
          .from('discussion_views')
          .select('id')
          .eq('discussion_id', discussionId)
          .eq('user_id', user.id)
          .single();
        
        if (viewCheckError && viewCheckError.code !== 'PGRST116') {
          console.error('❌ Error checking existing view:', viewCheckError);
        } else if (!existingView) {
          const { error: insertError } = await supabase
            .from('discussion_views')
            .insert({
              discussion_id: discussionId,
              user_id: user.id,
              viewed_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('❌ Error inserting view record:', insertError);
          } else {
            console.log('✅ View record inserted for discussion:', discussionId);
            
            setDiscussions(prev => prev.map(discussion => {
              if (discussion.id === discussionId) {
                return { ...discussion, views: (discussion.views || 0) + 1 };
              }
              return discussion;
            }));
          }
        }
      } catch (error) {
        console.error('❌ Error updating view count:', error);
      }
    }
    
    router.push(`/forum/discussion/${discussionId}`);
  };

  const handleBackToDashboard = async () => {
    console.log('🔍 Back to Dashboard clicked');
    console.log('🔍 User:', user);
    console.log('🔍 UserProfile:', userProfile);
    
    if (user && !userProfile) {
      console.log('🔍 UserProfile not loaded, fetching...');
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        
        console.log('🔍 Profile fetched on demand:', profile, 'Error:', error);
        
        if (profile) {
          if (profile.user_type === 'admin') {
            console.log('🔍 Redirecting to admin dashboard');
            window.location.href = '/admin-dashboard';
          } else if (profile.user_type === 'seller') {
            console.log('🔍 Redirecting to seller dashboard');
            window.location.href = '/seller-dashboard';
          } else if (profile.user_type === 'buyer') {
            console.log('🔍 Redirecting to buyer dashboard');
            window.location.href = '/buyer-dashboard';
          } else {
            console.log('🔍 Default redirect to buyer dashboard');
            window.location.href = '/buyer-dashboard';
          }
          return;
        }
      } catch (error) {
        console.error('🔍 Error fetching profile:', error);
      }
    }
    
    if (user && userProfile) {
      console.log('🔍 User type:', userProfile.user_type);
      if (userProfile.user_type === 'admin') {
        console.log('🔍 Redirecting to admin dashboard');
        window.location.href = '/admin-dashboard';
      } else if (userProfile.user_type === 'seller') {
        console.log('🔍 Redirecting to seller dashboard');
        window.location.href = '/seller-dashboard';
      } else if (userProfile.user_type === 'buyer') {
        console.log('🔍 Redirecting to buyer dashboard');
        window.location.href = '/buyer-dashboard';
      } else {
        console.log('🔍 Default redirect to buyer dashboard');
        window.location.href = '/buyer-dashboard'; // Default to buyer dashboard
      }
    } else {
      console.log('🔍 No user or profile, redirecting to home');
      router.push('/');
    }
  };

  const handleLikeDiscussion = async (discussionId) => {
    if (!user) {
      alert('Please login to like discussions');
      return;
    }

    try {
      const { data: existingLike } = await supabase
        .from('forum_likes')
        .select('*')
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        await supabase
          .from('forum_likes')
          .delete()
          .eq('id', existingLike.id);

        await supabase
          .from('car_discussions')
          .update({ likes: Math.max((existingLike.likes || 1) - 1, 0) })
          .eq('id', discussionId);

        alert('Discussion unliked!');
      } else {
        await supabase
          .from('forum_likes')
          .insert({
            discussion_id: discussionId,
            user_id: user.id
          });

        await supabase
          .from('car_discussions')
          .update({ likes: (existingLike?.likes || 0) + 1 })
          .eq('id', discussionId);

        alert('Discussion liked!');
      }

      fetchDiscussions();
    } catch (error) {
      console.error('Error handling like:', error);
      alert('Error processing like. Please try again.');
    }
  };

  const handleReplyToDiscussion = (discussionId) => {
    const discussion = discussions.find(d => d.id === discussionId);
    setSelectedDiscussion(discussion);
    setShowReplyForm(true);
    setReplyContent('');
  };

  const handleSubmitReply = async () => {
    if (!user) {
      alert('Please login to reply to discussions');
      return;
    }

    if (!replyContent.trim()) {
      alert('Please enter a reply');
      return;
    }

    setSubmittingReply(true);

    try {
      const { data, error } = await supabase
        .from('discussion_replies')
        .insert({
          discussion_id: selectedDiscussion.id,
          user_id: user.id,
          content: replyContent.trim()
        });

      if (error) {
        throw error;
      }

      alert('Reply submitted successfully!');
      setShowReplyForm(false);
      setReplyContent('');
      setSelectedDiscussion(null);
      
      fetchDiscussions();
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Error submitting reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCloseReplyForm = () => {
    setShowReplyForm(false);
    setReplyContent('');
    setSelectedDiscussion(null);
  };

  const handleViewReplies = async (discussionId) => {
    router.push(`/forum/discussion/${discussionId}`);
  };

  const organizeReplies = (replies) => {
    const replyMap = new Map();
    const topLevelReplies = [];

    replies.forEach(reply => {
      replyMap.set(reply.id, { ...reply, children: [] });
    });

    replies.forEach(reply => {
      if (reply.parent_reply_id) {
        const parentReply = replyMap.get(reply.parent_reply_id);
        if (parentReply) {
          parentReply.children.push(replyMap.get(reply.id));
        }
      } else {
        topLevelReplies.push(replyMap.get(reply.id));
      }
    });

    topLevelReplies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    topLevelReplies.forEach(reply => {
      if (reply.children && reply.children.length > 0) {
        reply.children.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    });

    return topLevelReplies;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading discussions...</p>
      </div>
    );
  }

  return (
    <div className={styles.forumContainer}>
      <div className={styles.forumHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button 
            onClick={handleBackToDashboard}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontWeight: '500',
              marginLeft: '20px'
            }}
          >
            ← Back to {userProfile?.user_type === 'admin' ? 'Admin' : userProfile?.user_type === 'seller' ? 'Seller' : userProfile?.user_type === 'buyer' ? 'Buyer' : ''} Dashboard
          </button>
          
                     <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginRight: '20px' }}>
             {user && (
               <button 
                 className={styles.newDiscussionBtn}
                 onClick={handleNewDiscussion}
               >
                 + New Discussion
               </button>
             )}
           </div>
        </div>
        
        <h1> Car Discussions Forum</h1>
        <p>Discuss cars, ask questions, share experiences</p>
        <p style={{ marginTop: '10px', opacity: '0.8' }}>
          Total Discussions: <strong>{discussions.length}</strong>
        </p>
      </div>
      
      {discussions.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No discussions yet</h3>
          <p>Be the first to start a discussion about cars!</p>
          {user && (
            <button 
              className={styles.newDiscussionBtn}
              onClick={handleNewDiscussion}
            >
              Start First Discussion
            </button>
          )}
        </div>
      ) : (
        <div className={styles.forumTable}>
                     <div className={styles.tableHeader}>
             <div className={styles.topicCol}>Topic</div>
             <div className={styles.carCol}>Car</div>
             <div className={styles.repliesCol}>Replies</div>
             <div className={styles.activityCol}>Activity</div>
           </div>
          
                     {discussions.map(discussion => (
             <div 
               className={styles.tableRow} 
               key={discussion.id}
             >
               <div className={styles.topicCol} onClick={() => handleDiscussionClick(discussion.id)}>
                 <h3 className={styles.discussionTitle}>{discussion.title}</h3>
                 <span className={styles.author}>by {discussion.author_name}</span>
               </div>
               <div className={styles.carCol} onClick={() => handleDiscussionClick(discussion.id)}>
                 <span className={styles.carTitle}>{discussion.car_title}</span>
               </div>
               <div className={styles.repliesCol}>
                 <span 
                   className={styles.repliesCount}
                   onClick={() => handleViewReplies(discussion.id)}
                   style={{ cursor: 'pointer', color: '#666' }}
                   title="Click to view replies"
                 >
                   {discussion.replies_count} {discussion.replies_count === 1 ? 'reply' : 'replies'}
                 </span>
               </div>
               <div className={styles.activityCol} onClick={() => handleDiscussionClick(discussion.id)}>
                 <span className={styles.activityTime}>
                   {formatTime(discussion.updated_at || discussion.created_at)}
                 </span>
               </div>

             </div>
           ))}
                 </div>
       )}

       {showReplyForm && selectedDiscussion && (
         <div className={styles.replyPopup}>
           <div className={styles.replyPopupContent}>
             <div className={styles.replyPopupHeader}>
               <h3>Reply to: {selectedDiscussion.title}</h3>
               <button 
                 onClick={handleCloseReplyForm}
                 className={styles.closeBtn}
               >
                 ✕
               </button>
             </div>
             
             <div className={styles.replyForm}>
               <textarea
                 value={replyContent}
                 onChange={(e) => setReplyContent(e.target.value)}
                 placeholder="Write your reply here..."
                 className={styles.replyTextarea}
                 rows={4}
               />
               
               <div className={styles.replyFormActions}>
                 <button 
                   onClick={handleCloseReplyForm}
                   className={styles.cancelBtn}
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleSubmitReply}
                   disabled={submittingReply || !replyContent.trim()}
                   className={styles.submitReplyBtn}
                 >
                   {submittingReply ? 'Submitting...' : 'Submit Reply'}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

     </div>
   );
 }

