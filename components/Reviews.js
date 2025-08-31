import { useState, useEffect } from 'react';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import styles from '../styles/Reviews.module.css';
import { supabase } from '../utils/supabaseClient';

export default function Reviews({ carId, currentUserId, currentUserType, carSellerId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total_reviews: 0,
    average_rating: 0,
    five_star_count: 0,
    four_star_count: 0,
    three_star_count: 0,
    two_star_count: 0,
    one_star_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    if (carId) {
      fetchReviews();
    }
  }, [carId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 ===== REVIEWS API DEBUG START =====');
      console.log('🎯 Car ID:', carId);
      console.log('👤 Current User ID:', currentUserId);
      console.log('🌐 API URL:', `/api/reviews/get?car_id=${carId}`);
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
      
      console.log('📡 Making API request...');
      const response = await fetch(`/api/reviews/get?car_id=${carId}`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      console.log('📡 API Response received!');
      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Status Text:', response.statusText);
      console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error('❌ API Error - Status not OK');
        const errorText = await response.text();
        console.error('❌ Error Response Body:', errorText);
        
        // Try to parse error details
        let errorDetails = 'Unknown error';
        try {
          const errorData = JSON.parse(errorText);
          console.log('❌ Parsed Error Data:', errorData);
          errorDetails = errorData.details || errorData.error || 'Unknown error';
        } catch (e) {
          console.log('❌ Could not parse error as JSON, using raw text');
          errorDetails = errorText || `HTTP error! status: ${response.status}`;
        }
        
        console.error('❌ Final Error Details:', errorDetails);
        throw new Error(errorDetails);
      }
      
      console.log('✅ API Response OK, parsing JSON...');
      const data = await response.json();
      console.log('📊 Parsed Response Data:', data);
      
      if (data.success) {
        console.log('✅ API Success, updating state...');
        setReviews(data.reviews || []);
        setStats(data.stats || {});
        
        // Find if current user has already reviewed this car
        if (currentUserId) {
          const userReview = data.reviews?.find(review => review.reviewer_id === currentUserId);
          console.log('👤 User Review Found:', userReview);
          setUserReview(userReview);
        }
        
        console.log('✅ State updated successfully');
      } else {
        console.error('❌ API returned error in data:', data.error);
        setError(data.error || 'Failed to load reviews');
      }
      
      console.log('🔍 ===== REVIEWS API DEBUG END =====');
      
    } catch (error) {
      console.error('❌ ===== ERROR IN FETCH REVIEWS =====');
      console.error('❌ Error Type:', error.name);
      console.error('❌ Error Message:', error.message);
      console.error('❌ Error Stack:', error.stack);
      
      if (error.name === 'AbortError') {
        console.error('⏰ Request timed out');
        setError('Request timed out. Please try again.');
      } else {
        // Provide more helpful error messages
        let errorMessage = error.message;
        if (error.message.includes('Database connection failed')) {
          errorMessage = 'Database connection issue. Please try again later.';
        } else if (error.message.includes('Failed to fetch reviews')) {
          errorMessage = 'Unable to load reviews. Please refresh the page.';
        } else if (error.message.includes('Internal server error')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection.';
        }
        
        console.error('❌ Final Error Message for User:', errorMessage);
        setError(errorMessage);
      }
      
      console.error('❌ ===== ERROR DEBUG END =====');
    } finally {
      setLoading(false);
      console.log('🏁 fetchReviews function completed');
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please login again.');
      }

      // If editing existing review, use PUT method
      if (editingReview) {
        const response = await fetch('/api/reviews/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            review_id: editingReview.id,
            ...reviewData
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          await fetchReviews();
          setShowForm(false);
          setEditingReview(null);
          return data;
        } else {
          throw new Error(data.error || 'Failed to update review');
        }
      } else {
        // Create new review
        const response = await fetch('/api/reviews/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            car_id: carId,
            ...reviewData
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          await fetchReviews();
          setShowForm(false);
          setEditingReview(null);
          return data;
        } else {
          throw new Error(data.error || 'Failed to submit review');
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session. Please login again.');
      }

      // Debug logging
      console.log('Delete Review Frontend Debug:', {
        currentUserId,
        currentUserType,
        reviewId,
        session: !!session
      });

      const response = await fetch(`/api/reviews/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ review_id: reviewId }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchReviews();
        setEditingReview(null);
        setUserReview(null);
      } else {
        throw new Error(data.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingReview(null);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>⚠️ Error Loading Reviews</h3>
        <p>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            fetchReviews();
          }}
          className={styles.retryButton}
        >
          🔄 Retry
        </button>
        <details style={{ marginTop: '1rem', textAlign: 'left' }}>
          <summary>Technical Details</summary>
          <p><strong>Car ID:</strong> {carId}</p>
          <p><strong>Error:</strong> {error}</p>
          <p>This usually means the database tables haven't been created yet.</p>
        </details>
      </div>
    );
  }

  return (
    <div className={styles.reviewsContainer}>
      {/* Reviews Header */}
      <div className={styles.reviewsHeader}>
        <h2>Customer Reviews</h2>
        {/* Show Write Review button only for buyers who haven't reviewed and aren't the seller */}
        {currentUserId && 
         currentUserType === 'buyer' && 
         currentUserId !== carSellerId && 
         !userReview && (
          <button
            onClick={() => setShowForm(true)}
            className={styles.writeReviewBtn}
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <div className={styles.reviewFormWrapper}>
          <ReviewForm
            carId={carId}
            onSubmit={handleSubmitReview}
            onCancel={handleCancelForm}
            existingReview={editingReview}
          />
        </div>
      )}

      {/* Reviews List */}
      <ReviewList
        reviews={reviews}
        stats={stats}
        currentUserId={currentUserId}
        currentUserType={currentUserType}
        onEditReview={handleEditReview}
        onDeleteReview={handleDeleteReview}
      />

      {/* No Reviews Message */}
      {!loading && reviews.length === 0 && (
        <div className={styles.noReviewsMessage}>
          <p>No reviews yet for this car.</p>
          {/* Show button only for buyers who aren't the seller */}
          {currentUserId && 
           currentUserType === 'buyer' && 
           currentUserId !== carSellerId && (
            <button
              onClick={() => setShowForm(true)}
              className={styles.writeFirstReviewBtn}
            >
              Be the first to review!
            </button>
          )}
        </div>
      )}
    </div>
  );
}
