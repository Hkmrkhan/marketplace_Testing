import { useState } from 'react';
import styles from '../styles/ReviewForm.module.css';

export default function ReviewForm({ carId, onSubmit, onCancel, existingReview }) {
  const [formData, setFormData] = useState({
    rating: existingReview?.rating || 5,
    title: existingReview?.title || '',
    comment: existingReview?.comment || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.comment.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.title.length > 200) {
      setError('Title must be 200 characters or less');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSubmit(formData);
    } catch (error) {
      setError(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={`${styles.star} ${formData.rating >= i ? styles.starFilled : styles.starEmpty}`}
          onClick={() => handleRatingChange(i)}
          disabled={submitting}
        >
          ★
        </button>
      );
    }
    return stars;
  };

  return (
    <div className={styles.reviewFormContainer}>
      <h3 className={styles.formTitle}>
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.reviewForm}>
        {/* Rating Selection */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Rating:</label>
          <div className={styles.starsContainer}>
            {renderStars()}
            <span className={styles.ratingText}>
              {formData.rating} out of 5 stars
            </span>
          </div>
        </div>

        {/* Review Title */}
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Review Title:
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Summarize your experience..."
            className={styles.titleInput}
            maxLength={200}
            disabled={submitting}
            required
          />
          <small className={styles.charCount}>
            {formData.title.length}/200 characters
          </small>
        </div>

        {/* Review Comment */}
        <div className={styles.formGroup}>
          <label htmlFor="comment" className={styles.label}>
            Review Comment:
          </label>
          <textarea
            id="comment"
            name="comment"
            value={formData.comment}
            onChange={handleInputChange}
            placeholder="Share your detailed experience with this car..."
            className={styles.commentTextarea}
            rows={6}
            disabled={submitting}
            required
          />
        </div>

        {/* Form Actions */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelBtn}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
          </button>
        </div>
      </form>
    </div>
  );
}

