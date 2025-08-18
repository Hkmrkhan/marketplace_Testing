import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/About.module.css';

export default function AboutPage() {
  return (
    <div className={styles.aboutPage}>
      <Navbar />
      <main className={styles.mainContent}>
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>About Car Marketplace</h1>
          <p className={styles.heroSubtitle}>
            Your trusted platform for buying and selling cars with confidence
          </p>
        </div>

        <div className={styles.contentSection}>
          <div className={styles.missionSection}>
            <h2>Our Mission</h2>
            <p>
              We're revolutionizing the way people buy and sell cars by providing a secure, 
              transparent, and user-friendly platform that connects car enthusiasts, sellers, 
              and buyers across Pakistan. Our goal is to make car transactions simple, 
              trustworthy, and accessible to everyone.
            </p>
          </div>

          <div className={styles.featuresSection}>
            <h2>Platform Features</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🚗</div>
                <h3>Car Listings</h3>
                <p>Browse through thousands of cars with detailed information, high-quality images, and transparent pricing from verified sellers.</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>💬</div>
                <h3>Real-time Chat</h3>
                <p>Built-in messaging system for direct communication between buyers and sellers with instant notifications.</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔐</div>
                <h3>User Authentication</h3>
                <p>Secure login system with separate dashboards for buyers and sellers, including profile management.</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📱</div>
                <h3>Responsive Design</h3>
                <p>Mobile-friendly interface that works perfectly on all devices - desktop, tablet, and mobile phones.</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔍</div>
                <h3>Advanced Search</h3>
                <p>Filter cars by price, year, miles, registration city, and other criteria to find your perfect match.</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>💳</div>
                <h3>Secure Payments</h3>
                <p>Integrated Stripe payment system for safe and secure transactions between buyers and sellers.</p>
              </div>
            </div>
          </div>

          <div className={styles.statsSection}>
            <h2>Platform Statistics</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>1000+</div>
                <div className={styles.statLabel}>Cars Listed</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>500+</div>
                <div className={styles.statLabel}>Active Users</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>25+</div>
                <div className={styles.statLabel}>Cities Covered</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>24/7</div>
                <div className={styles.statLabel}>Support Available</div>
              </div>
            </div>
          </div>

          <div className={styles.teamSection}>
            <h2>Our Team</h2>
            <p>
              Car Marketplace is built and maintained by a dedicated team of developers, 
              designers, and automotive enthusiasts who understand the importance of 
              reliable car trading platforms. We're committed to continuously improving 
              our service and providing the best experience for our users.
            </p>
          </div>

          <div className={styles.contactSection}>
            <h2>Get in Touch</h2>
            <p>
              Have questions or suggestions? We'd love to hear from you! 
              Reach out to our support team for assistance.
            </p>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📧</span>
                <span>hkmrkhan10@gmail.com</span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📞</span>
                <span>+92 300 1234567</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
