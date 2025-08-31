import { useState } from 'react';
import styles from '../styles/ReviewList.module.css';

export default function ReviewList({ reviews, stats, currentUserId, currentUserType, onEditReview, onDeleteReview }) {
  const [expandedReviews, setExpandedReviews] = useState(new Set());

  const toggleReviewExpansion = (reviewId) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`${styles.star} ${rating >= i ? styles.starFilled : styles.starEmpty}`}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const renderRatingBar = (starCount, totalReviews, starNumber) => {
    const percentage = totalReviews > 0 ? (starCount / totalReviews) * 100 : 0;
    return (
      <div className={styles.ratingBarRow}>
        <span className={styles.starLabel}>{starNumber} stars</span>
        <div className={styles.ratingBar}>
          <div 
            className={styles.ratingBarFill} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className={styles.starCount}>{starCount}</span>
      </div>
    );
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className={styles.noReviews}>
        <h3>No Reviews Yet</h3>
        <p>Be the first to review this car!</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewListContainer}>
      {/* Review Statistics */}
      <div className={styles.reviewStats}>
        <div className={styles.overallRating}>
          <div className={styles.averageRating}>
            <span className={styles.ratingNumber}>
              {stats.average_rating ? stats.average_rating.toFixed(1) : '0.0'}
            </span>
            <div className={styles.starsContainer}>
              {renderStars(Math.round(stats.average_rating || 0))}
            </div>
          </div>
          <div className={styles.totalReviews}>
            {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className={styles.ratingBreakdown}>
          {renderRatingBar(stats.five_star_count, stats.total_reviews, 5)}
          {renderRatingBar(stats.four_star_count, stats.total_reviews, 4)}
          {renderRatingBar(stats.three_star_count, stats.total_reviews, 3)}
          {renderRatingBar(stats.two_star_count, stats.total_reviews, 2)}
          {renderRatingBar(stats.one_star_count, stats.total_reviews, 1)}
        </div>
      </div>

      {/* Reviews List */}
      <div className={styles.reviewsList}>
        <h3>Customer Reviews</h3>
        {reviews.map((review) => (
          <div key={review.id} className={styles.reviewItem}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewerInfo}>
                <div className={styles.avatarPlaceholder}>
                  {review.reviewer_name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.reviewerDetails}>
                  <div className={styles.reviewerName}>
                    {review.reviewer_name}
                    {review.verified_purchase && (
                      <span className={styles.verifiedBadge} title="Verified Purchase">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className={styles.reviewDate}>
                    {formatDate(review.created_at)}
                  </div>
                </div>
              </div>
              
              <div className={styles.reviewRating}>
                {renderStars(review.rating)}
              </div>
            </div>

            <div className={styles.reviewContent}>
              <h4 className={styles.reviewTitle}>{review.title}</h4>
              <div className={styles.reviewComment}>
                {review.comment.length > 200 && !expandedReviews.has(review.id) ? (
                  <>
                    {review.comment.substring(0, 200)}...
                    <button
                      className={styles.expandButton}
                      onClick={() => toggleReviewExpansion(review.id)}
                    >
                      Read more
                    </button>
                  </>
                ) : (
                  <>
                    {review.comment}
                    {review.comment.length > 200 && (
                      <button
                        className={styles.expandButton}
                        onClick={() => toggleReviewExpansion(review.id)}
                      >
                        Show less
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Review Actions for Review Owner or Admin */}
            {(currentUserId === review.reviewer_id || currentUserType === 'admin') && (
              <div className={styles.reviewActions}>
                {currentUserId === review.reviewer_id && (
                  <button
                    onClick={() => onEditReview(review)}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => onDeleteReview(review.id)}
                  className={`${styles.deleteButton} ${currentUserType === 'admin' ? styles.adminDeleteButton : ''}`}
                >
                  {currentUserType === 'admin' ? 'Remove' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
