import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Contact.module.css';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const hasFormData = () => {
    return formData.name.trim() || formData.email.trim() || formData.message.trim();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can add the logic to send the message to hkmrkhan10@gmail.com
    console.log('Sending message:', formData);
    alert('Message sent successfully! We will get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className={styles.contactPage}>
      <Navbar />
      <main className={styles.mainContent}>
        <div className={styles.contactSection}>
          <h1 className={styles.contactTitle}>Contact</h1>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📧</span>
              <span className={styles.contactText}>hkmrkhan10@gmail.com</span>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactIcon}>📞</span>
              <span className={styles.contactText}>+92 300 1234567</span>
            </div>
          </div>
        </div>
        
        <div className={styles.formSection}>
          <h2>Send us a Message</h2>
          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Your Name</label>
              <input 
                type="text" 
                id="name"
                name="name"
                placeholder="Your Name" 
                value={formData.name}
                onChange={handleInputChange}
                required 
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Your Email</label>
              <input 
                type="email" 
                id="email"
                name="email"
                placeholder="Your Email" 
                value={formData.email}
                onChange={handleInputChange}
                required 
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="message">Your Message</label>
              <textarea 
                id="message"
                name="message"
                placeholder="Your Message" 
                value={formData.message}
                onChange={handleInputChange}
                required 
                rows="5"
                className={styles.textarea}
              />
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn}>Send Message</button>
              <div className={styles.buttonGroup}>
                {hasFormData() && (
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                )}
                {!hasFormData() && (
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => window.history.back()}
                  >
                    Back
                  </button>
                )}
              </div>
            </div>
        </form>
        </div>
      </main>

      {showCancelConfirm && (
        <div className={styles.confirmationDialog}>
          <div className={styles.confirmationContent}>
            <h3>Are you sure you want to cancel?</h3>
            <p>All your entered data will be lost.</p>
            <div className={styles.confirmationButtons}>
              <button
                type="button"
                className={styles.confirmBtn}
                onClick={confirmCancel}
              >
                Yes
              </button>
              <button
                type="button"
                className={styles.denyBtn}
                onClick={() => setShowCancelConfirm(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
