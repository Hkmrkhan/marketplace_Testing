import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Home.module.css';

export default function HomePage() {
  const router = useRouter();

  // Removed automatic redirect logic - users can now view home page freely

  return (
    <div>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <img src="/hero.png" alt="Car Marketplace" className={styles.heroImage} />
          <div className={styles.heroText}>
            <h1>Welcome to Car Marketplace</h1>
            <p className={styles.heroDescription}>
              Discover the easiest way to buy and sell cars online. Our platform connects buyers and sellers with a seamless experience, offering the best deals and trusted transactions.
            </p>
            <p className={styles.heroSubtext}>Buy and sell cars easily!</p>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionContent}>
            <img src="/graphic1.webp" alt="Find Your Dream Car" className={styles.sectionImage} />
            <div>
              <h2>Find Your Dream Car</h2>
              <p>
                Explore a wide range of cars from trusted sellers. Whether you want a family car, a sports car, or your first ride, our marketplace connects you with the best options at the best prices.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionContent}>
            <img src="/graphic2.webp" alt="Sell Your Car Fast" className={styles.sectionImage} />
            <div>
              <h2>Sell Your Car Fast</h2>
              <p>
                List your car in minutes and reach thousands of potential buyers. Our platform makes it easy to upload details, photos, and connect with interested customers quickly and securely.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
