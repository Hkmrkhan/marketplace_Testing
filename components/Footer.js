import Link from 'next/link';
import styles from '../styles/Footer.module.css';

export default function Footer({ userType }) {
  // Professional messages for buyer/seller/generic
  let infoTitle = 'Car Marketplace';
  let infoDesc = 'Buy & Sell Cars Easily. Secure, fast, and trusted by thousands.';
  if (userType === 'buyer') {
    infoTitle = 'Buyer Dashboard';
    infoDesc = 'Welcome, Buyer! Explore and purchase cars with confidence.';
  } else if (userType === 'seller') {
    infoTitle = 'Seller Dashboard';
    infoDesc = 'Welcome, Seller! Manage your listings and track your sales.';
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        {/* Useful Links */}
        <div className={styles.footerSection}>
          <h4>Useful Links</h4>
          <ul className={styles.footerLinks}>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/cars">Cars</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        {/* Social Links */}
        <div className={styles.footerSection}>
          <h4>Follow Us</h4>
          <div className={styles.socialLinks}>
            <a href="https://facebook.com" target="_blank" rel="noopener" className={styles.socialLink}>Facebook</a>
            <a href="https://twitter.com" target="_blank" rel="noopener" className={styles.socialLink}>Twitter</a>
            <a href="https://instagram.com" target="_blank" rel="noopener" className={styles.socialLink}>Instagram</a>
          </div>
        </div>
        {/* Contact Info */}
        <div className={styles.footerSection}>
          <h4>Contact</h4>
          <div className={styles.contactInfo}>
            <p>📧 hkmrkhan10@gmail.com</p>
            <p>📞 +923208196396</p>
          </div>
        </div>
        {/* Dynamic Info Section */}
        <div className={styles.footerSection}>
          <h4>{infoTitle}</h4>
          <p style={{ color: '#b0b0b0', margin: 0 }}>{infoDesc}</p>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <div className={styles.footerBottomContent}>
          <p>Car Marketplace &copy; {new Date().getFullYear()} | All rights reserved</p>
          <div className={styles.footerBottomLinks}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
