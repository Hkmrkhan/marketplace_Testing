import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from '../styles/Home.module.css';

export default function HomePage() {
  const router = useRouter();

  // Carousel scroll function
  const scrollCarousel = (direction) => {
    const carousel = document.querySelector(`.${styles.carCarousel}`);
    if (carousel) {
      const scrollAmount = 300;
      if (direction === 'left') {
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll(`.${styles.parallaxLayer1}, .${styles.parallaxLayer2}, .${styles.parallaxLayer3}`);
      
      parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.2);
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Counting animation for stats
  useEffect(() => {
    const animateCount = (element, target, duration = 2000) => {
      let start = 0;
      const increment = target / (duration / 16);
      
      // Add counting class for animation
      element.classList.add('counting');
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          element.textContent = target + (target === 500 ? '+' : target === 98 ? '%' : '');
          element.classList.remove('counting');
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(start) + (target === 500 ? '+' : target === 98 ? '%' : '');
        }
      }, 16);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const statNumbers = entry.target.querySelectorAll(`.${styles.statNumber}`);
          statNumbers.forEach((stat, index) => {
            const targets = [500, 98, 24];
            if (targets[index]) {
              stat.textContent = '0' + (targets[index] === 500 ? '+' : targets[index] === 98 ? '%' : '');
              setTimeout(() => {
                animateCount(stat, targets[index]);
              }, index * 200);
            }
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    // Separate observer for parallax section
    const parallaxObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const parallaxStats = entry.target.querySelectorAll(`.${styles.parallaxStat} .${styles.statNumber}`);
          parallaxStats.forEach((stat, index) => {
            const targets = [500, 98, 24];
            if (targets[index]) {
              stat.textContent = '0' + (targets[index] === 500 ? '+' : targets[index] === 98 ? '%' : '');
              setTimeout(() => {
                animateCount(stat, targets[index]);
              }, index * 300);
            }
          });
          parallaxObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector(`.${styles.statsSection}`);
    const parallaxSection = document.querySelector(`.${styles.parallaxSection}`);
    
    if (statsSection) {
      observer.observe(statsSection);
    }
    
    if (parallaxSection) {
      parallaxObserver.observe(parallaxSection);
    }

    return () => {
      if (statsSection) {
        observer.unobserve(statsSection);
      }
      if (parallaxSection) {
        parallaxObserver.unobserve(parallaxSection);
      }
    };
  }, []);

  // Removed automatic redirect logic - users can now view home page freely

  return (
    <div>
      <Navbar />
      <main className={styles.main}>
        {/* Hero Section with Video Background */}
        <div className={styles.heroSection}>
          <div className={styles.heroBackground}>
            <img src="/hero.png" alt="Car Marketplace" className={styles.heroBackgroundImage} />
            <div className={styles.heroOverlay}></div>
          </div>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>Welcome to Car Marketplace</h1>
              <p className={styles.heroDescription}>
                Discover the easiest way to buy and sell cars online. Our platform connects buyers and sellers with a seamless experience, offering the best deals and trusted transactions.
              </p>
              <p className={styles.heroSubtext}>Buy and sell cars easily!</p>
              <div className={styles.heroButtons}>
                <button className={styles.heroButtonPrimary}>Explore Cars</button>
                <button className={styles.heroButtonSecondary}>Learn More</button>
              </div>
            </div>
            <div className={styles.heroCarShowcase}>
              <div className={styles.carModel}>
                <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop&crop=center" alt="Lamborghini" className={styles.carImage} />
                <div className={styles.carInfo}>
                  <h3>Premium Selection</h3>
                  <p>Luxury & Performance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted by Millions Section */}
        <section className={styles.trustedSection}>
          <div className={styles.trustedContent}>
            {/* Browser Logos */}
            <div className={styles.browserLogos}>
              <div className={styles.browserLogo}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#4285F4"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/>
                </svg>
                <span>Chrome</span>
              </div>
              <div className={styles.browserLogo}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#007AFF"/>
                  <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="white"/>
                </svg>
                <span>Safari</span>
              </div>
              <div className={styles.browserLogo}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#FF1B2D"/>
                  <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">O</text>
                </svg>
                <span>Opera</span>
              </div>
              <div className={styles.browserLogo}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#FF7139"/>
                  <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="white"/>
                </svg>
                <span>Firefox</span>
              </div>
              <div className={styles.browserLogo}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#0078D4"/>
                  <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="white"/>
                </svg>
                <span>Edge</span>
              </div>
            </div>
            
            {/* Trusted by Millions Heading */}
            <h2 className={styles.trustedHeading}>Trusted by Millions</h2>
            
            {/* Testimonial Cards Carousel */}
            <div className={styles.testimonialsCarousel}>
              <div className={styles.testimonialsTrack}>
                <div className={styles.testimonialCard}>
                  <h3 className={styles.testimonialTitle}>Best Car Marketplace</h3>
                  <div className={styles.stars}>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                  </div>
                  <p className={styles.testimonialText}>
                    "This marketplace has been a lifesaver for my car buying needs. The platform connects me with trusted sellers and the AI assistant helps me find the perfect car - it's cut my search time in half."
                  </p>
                  <div className={styles.reviewer}>
                    <div className={styles.reviewerAvatar}>S</div>
                    <div className={styles.reviewerInfo}>
                      <div className={styles.reviewerName}>Sara Williams</div>
                      <div className={styles.reviewerTitle}>Car Buyer</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.testimonialCard}>
                  <h3 className={styles.testimonialTitle}>Find of the year</h3>
                  <div className={styles.stars}>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                  </div>
                  <p className={styles.testimonialText}>
                    "It has simplified my car selling process with its amazing features and secure transactions. Plus it offers industry standard AI models for car recommendations. That's totally amazing!"
                  </p>
                  <div className={styles.reviewer}>
                    <div className={styles.reviewerAvatar}>A</div>
                    <div className={styles.reviewerInfo}>
                      <div className={styles.reviewerName}>Andrew Roberts</div>
                      <div className={styles.reviewerTitle}>Car Seller</div>
                    </div>
                  </div>
                </div>

                <div className={styles.testimonialCard}>
                  <h3 className={styles.testimonialTitle}>Amazing Experience</h3>
                  <div className={styles.stars}>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                  </div>
                  <p className={styles.testimonialText}>
                    "The AI chat feature is incredible! It helped me find exactly what I was looking for. The whole process was smooth and secure. Highly recommended for anyone buying or selling cars."
                  </p>
                  <div className={styles.reviewer}>
                    <div className={styles.reviewerAvatar}>M</div>
                    <div className={styles.reviewerInfo}>
                      <div className={styles.reviewerName}>Mike Johnson</div>
                      <div className={styles.reviewerTitle}>Car Enthusiast</div>
                    </div>
                  </div>
                </div>

                <div className={styles.testimonialCard}>
                  <h3 className={styles.testimonialTitle}>Perfect Platform</h3>
                  <div className={styles.stars}>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                  </div>
                  <p className={styles.testimonialText}>
                    "Sold my car in just 3 days! The verification process is thorough and the payment system is super secure. This platform has revolutionized car trading in Pakistan."
                  </p>
                  <div className={styles.reviewer}>
                    <div className={styles.reviewerAvatar}>R</div>
                    <div className={styles.reviewerInfo}>
                      <div className={styles.reviewerName}>Rahul Kumar</div>
                      <div className={styles.reviewerTitle}>Car Dealer</div>
                    </div>
                  </div>
                </div>

                <div className={styles.testimonialCard}>
                  <h3 className={styles.testimonialTitle}>Game Changer</h3>
                  <div className={styles.stars}>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                  </div>
                  <p className={styles.testimonialText}>
                    "The comparison feature is brilliant! I could compare multiple cars side by side and make an informed decision. The customer support is also top-notch."
                  </p>
                  <div className={styles.reviewer}>
                    <div className={styles.reviewerAvatar}>L</div>
                    <div className={styles.reviewerInfo}>
                      <div className={styles.reviewerName}>Lisa Chen</div>
                      <div className={styles.reviewerTitle}>First-time Buyer</div>
                    </div>
                  </div>
                </div>

                <div className={styles.testimonialCard}>
                  <h3 className={styles.testimonialTitle}>Trusted & Reliable</h3>
                  <div className={styles.stars}>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                  </div>
                  <p className={styles.testimonialText}>
                    "Been using this platform for 2 years now. The quality of cars and the transparency in transactions is unmatched. It's become my go-to place for all car-related needs."
                  </p>
                  <div className={styles.reviewer}>
                    <div className={styles.reviewerAvatar}>D</div>
                    <div className={styles.reviewerInfo}>
                      <div className={styles.reviewerName}>David Park</div>
                      <div className={styles.reviewerTitle}>Regular User</div>
                    </div>
                  </div>
                </div>

                {/* Duplicate cards for seamless loop */}
                <div className={styles.testimonialCard}>
                  <h3 className={styles.testimonialTitle}>Best Car Marketplace</h3>
                  <div className={styles.stars}>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                  </div>
                  <p className={styles.testimonialText}>
                    "This marketplace has been a lifesaver for my car buying needs. The platform connects me with trusted sellers and the AI assistant helps me find the perfect car - it's cut my search time in half."
                  </p>
                  <div className={styles.reviewer}>
                    <div className={styles.reviewerAvatar}>S</div>
                    <div className={styles.reviewerInfo}>
                      <div className={styles.reviewerName}>Sara Williams</div>
                      <div className={styles.reviewerTitle}>Car Buyer</div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.testimonialCard}>
                  <h3 className={styles.testimonialTitle}>Find of the year</h3>
                  <div className={styles.stars}>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                    <span className={styles.star}>★</span>
                  </div>
                  <p className={styles.testimonialText}>
                    "It has simplified my car selling process with its amazing features and secure transactions. Plus it offers industry standard AI models for car recommendations. That's totally amazing!"
                  </p>
                  <div className={styles.reviewer}>
                    <div className={styles.reviewerAvatar}>A</div>
                    <div className={styles.reviewerInfo}>
                      <div className={styles.reviewerName}>Andrew Roberts</div>
                      <div className={styles.reviewerTitle}>Car Seller</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Car Showcase Carousel */}
        <section className={styles.carShowcaseSection}>
          <div className={styles.carShowcaseContent}>
            <h2 className={styles.carShowcaseHeading}>Featured Cars</h2>
            <div className={styles.carCarousel}>
              <div className={styles.carCarouselTrack}>
                <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop&crop=center" alt="Sports Car" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Sports Car</h3>
                    <p>Performance & Speed</p>
                    <span className={styles.carPrice}>$45,000</span>
                  </div>
                </div>
              </div>
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=300&fit=crop&crop=center" alt="SUV" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>SUV</h3>
                    <p>Family & Adventure</p>
                    <span className={styles.carPrice}>$35,000</span>
                  </div>
                </div>
              </div>
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop&crop=center" alt="Electric Car" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Electric Car</h3>
                    <p>Eco-Friendly</p>
                    <span className={styles.carPrice}>$55,000</span>
                  </div>
                </div>
              </div>
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop&crop=center" alt="Luxury Sedan" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Luxury Sedan</h3>
                    <p>Comfort & Style</p>
                    <span className={styles.carPrice}>$65,000</span>
                  </div>
                </div>
              </div>
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop&crop=center" alt="Convertible" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Convertible</h3>
                    <p>Open Air Freedom</p>
                    <span className={styles.carPrice}>$75,000</span>
                  </div>
                </div>
              </div>
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop&crop=center" alt="Hatchback" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Hatchback</h3>
                    <p>Compact & Efficient</p>
                    <span className={styles.carPrice}>$25,000</span>
                  </div>
                </div>
              </div>

              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop&crop=center" alt="Coupe" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Coupe</h3>
                    <p>Sporty & Elegant</p>
                    <span className={styles.carPrice}>$50,000</span>
                  </div>
                </div>
              </div>

              {/* Duplicate cars for seamless loop */}
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop&crop=center" alt="Sports Car" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Sports Car</h3>
                    <p>Performance & Speed</p>
                    <span className={styles.carPrice}>$45,000</span>
                  </div>
                </div>
              </div>
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=400&h=300&fit=crop&crop=center" alt="SUV" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>SUV</h3>
                    <p>Family & Adventure</p>
                    <span className={styles.carPrice}>$35,000</span>
                  </div>
                </div>
              </div>
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&h=300&fit=crop&crop=center" alt="Electric Car" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Electric Car</h3>
                    <p>Eco-Friendly</p>
                    <span className={styles.carPrice}>$55,000</span>
                  </div>
                </div>
              </div>
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop&crop=center" alt="Luxury Sedan" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Luxury Sedan</h3>
                    <p>Comfort & Style</p>
                    <span className={styles.carPrice}>$65,000</span>
                  </div>
                </div>
              </div>
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop&crop=center" alt="Convertible" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Convertible</h3>
                    <p>Open Air Freedom</p>
                    <span className={styles.carPrice}>$75,000</span>
                  </div>
                </div>
              </div>
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop&crop=center" alt="Hatchback" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Hatchback</h3>
                    <p>Compact & Efficient</p>
                    <span className={styles.carPrice}>$25,000</span>
                  </div>
                </div>
              </div>
              <div className={styles.carSlide}>
                <div className={styles.carCard}>
                  <img src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop&crop=center" alt="Coupe" className={styles.carSlideImage} />
                  <div className={styles.carSlideInfo}>
                    <h3>Coupe</h3>
                    <p>Sporty & Elegant</p>
                    <span className={styles.carPrice}>$50,000</span>
                  </div>
                </div>
              </div>
              </div>
            </div>
            <div className={styles.carouselControls}>
              <button className={styles.carouselBtn} onClick={() => scrollCarousel('left')}>‹</button>
              <button className={styles.carouselBtn} onClick={() => scrollCarousel('right')}>›</button>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className={styles.videoSection}>
          <div className={styles.videoContent}>
            <h2 className={styles.videoHeading}>How Our Marketplace Works</h2>
            <p className={styles.videoDescription}>
              Watch how buyers and sellers connect on our platform - from initial greeting to successful car handover, experience the seamless trading process.
            </p>
            <div className={styles.videoContainer}>
              <div className={styles.videoWrapper}>
                <video 
                  key="marketplace-video"
                  className={styles.videoPlayer}
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  poster="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=600&fit=crop&crop=center"
                >
                  <source src="/for marketplace.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <div className={styles.featuresContent}>
            <h2 className={styles.featuresHeading}>Why Choose Our Marketplace?</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🚗</div>
                <h3>Verified Cars</h3>
                <p>All cars go through our strict verification process to ensure quality and authenticity.</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🔒</div>
                <h3>Secure Payments</h3>
                <p>Safe and secure transactions with our integrated payment system and buyer protection.</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🤖</div>
                <h3>AI Assistant</h3>
                <p>Get instant help with our AI-powered assistant for car recommendations and market insights.</p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>⚡</div>
                <h3>Fast Transactions</h3>
                <p>Quick and easy buying process with instant notifications and real-time updates.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className={styles.statsSection}>
          <div className={styles.statsContent}>
            <h2 className={styles.statsHeading}>Our Impact</h2>
            <div className={styles.statsCarousel}>
              <div className={styles.statsTrack}>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>10,000+</div>
                  <div className={styles.statLabel}>Cars Sold</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>50,000+</div>
                  <div className={styles.statLabel}>Happy Customers</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>99.9%</div>
                  <div className={styles.statLabel}>Success Rate</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>24/7</div>
                  <div className={styles.statLabel}>Support</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>500+</div>
                  <div className={styles.statLabel}>Cities Covered</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>15+</div>
                  <div className={styles.statLabel}>Car Brands</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>98%</div>
                  <div className={styles.statLabel}>Customer Satisfaction</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>5★</div>
                  <div className={styles.statLabel}>Average Rating</div>
                </div>
                {/* Duplicate cards for seamless loop */}
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>10,000+</div>
                  <div className={styles.statLabel}>Cars Sold</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>50,000+</div>
                  <div className={styles.statLabel}>Happy Customers</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>99.9%</div>
                  <div className={styles.statLabel}>Success Rate</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>24/7</div>
                  <div className={styles.statLabel}>Support</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className={styles.processSection}>
          <div className={styles.processContent}>
            <h2 className={styles.processHeading}>How It Works</h2>
            <div className={styles.processSteps}>
              <div className={styles.processStep}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3>Browse Cars</h3>
                  <p>Explore our extensive collection of verified cars with detailed information and photos.</p>
                </div>
              </div>
              <div className={styles.processStep}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3>Compare & Choose</h3>
                  <p>Use our comparison tool to find the perfect car that matches your needs and budget.</p>
                </div>
              </div>
              <div className={styles.processStep}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3>Secure Payment</h3>
                  <p>Complete your purchase with our secure payment system and get instant confirmation.</p>
                </div>
              </div>
              <div className={styles.processStep}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <h3>Drive Away</h3>
                  <p>Pick up your new car and enjoy the ride with our comprehensive warranty coverage.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Parallax Section */}
        <section className={styles.parallaxSection}>
          <div className={styles.parallaxBackground}>
            <div className={styles.parallaxLayer1}></div>
            <div className={styles.parallaxLayer2}></div>
            <div className={styles.parallaxLayer3}></div>
          </div>
          <div className={styles.parallaxContent}>
            <h2 className={styles.parallaxHeading}>Experience Luxury</h2>
            <p className={styles.parallaxText}>
              Discover premium cars with cutting-edge technology and unmatched performance
            </p>
            <div className={styles.parallaxStats}>
              <div className={styles.parallaxStat}>
                <span className={styles.statNumber}>500+</span>
                <span className={styles.statLabel}>Premium Cars</span>
              </div>
              <div className={styles.parallaxStat}>
                <span className={styles.statNumber}>98%</span>
                <span className={styles.statLabel}>Satisfaction</span>
              </div>
              <div className={styles.parallaxStat}>
                <span className={styles.statNumber}>24/7</span>
                <span className={styles.statLabel}>Support</span>
              </div>
            </div>
          </div>
        </section>

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

        <section className={styles.sellCarSection}>
          <div className={styles.sellCarContent}>
            <div className={styles.sellCarImage}>
              <img src="/graphic2.webp" alt="Sell Your Car Fast" className={styles.sectionImage} />
            </div>
            <div className={styles.sellCarText}>
              <h2 className={styles.sellCarHeading}>Sell Your Car Fast</h2>
              <p className={styles.sellCarDescription}>
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
