import { useState } from 'react';
import styles from '../styles/CarForm.module.css';

export default function CarForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setImage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, description, price, image }, resetForm);
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>Add Your Car Details</h2>
        <p>Fill in the information below to list your car</p>
      </div>
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Car Title</label>
          <input
            type="text"
            placeholder="e.g., Toyota Corolla 2020"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Description</label>
          <textarea
            placeholder="Describe your car's features, condition, and any special details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            rows="4"
            required
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Price ($)</label>
            <input
              type="number"
              placeholder="15000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={styles.input}
              min="0"
              step="100"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Image URL</label>
            <input
              type="url"
              placeholder="https://example.com/car-image.jpg"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className={styles.input}
              required
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn}>
            Add Car to Marketplace
          </button>
        </div>
      </form>
    </div>
  );
}
