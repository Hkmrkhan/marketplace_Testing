import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function HomePage() {
  const router = useRouter();
  const carCarouselRef = useRef(null);

  // Carousel scroll function
  const scrollCarousel = (direction) => {
    if (carCarouselRef.current) {
      const scrollAmount = 320;
      if (direction === 'left') {
        carCarouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        carCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.parallax-layer');
      
      parallaxElements.forEach((element, index) => {
        const speed = 0.3 + (index * 0.15);
        const yPos = -(scrolled * speed * 0.1);
        element.style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Counting animation for stats
  useEffect(() => {
    const animateCount = (element, target, duration = 2000) => {
      let start = 0;
      const increment = target / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          element.textContent = target + (target === 500 ? '+' : target === 98 ? '%' : '');
          clearInterval(timer);
        } else {
          element.textContent = Math.floor(start) + (target === 500 ? '+' : target === 98 ? '%' : '');
        }
      }, 16);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const statNumbers = entry.target.querySelectorAll('.stat-animated-num');
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
    }, { threshold: 0.3 });

    const statsSection = document.querySelector('#stats-section');
    const parallaxSection = document.querySelector('#parallax-section');
    
    if (statsSection) observer.observe(statsSection);
    if (parallaxSection) observer.observe(parallaxSection);

    return () => {
      if (statsSection) observer.unobserve(statsSection);
      if (parallaxSection) observer.unobserve(parallaxSection);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 w-full overflow-x-hidden">
        
        {/* Hero Section */}
        <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
          {/* Hero Background with Glow Gradients */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/hero.png" 
              alt="Car Marketplace" 
              className="w-full h-full object-cover object-center filter brightness-40 contrast-125 scale-105 transform motion-safe:animate-pulse-glow" 
            />
            {/* Dark & Aurora Radial Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-[#070b14]"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
                Welcome to <br />
                <span className="bg-gradient-to-r from-white via-indigo-200 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
                  Car Marketplace
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Discover the easiest way to buy and sell cars online. Our platform connects buyers and sellers with a seamless experience, offering the best deals and trusted transactions.
              </p>

              <p className="text-sm font-semibold tracking-wide text-indigo-400 uppercase">
                Buy and sell cars easily!
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button 
                  onClick={() => router.push('/cars')}
                  className="px-8 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
                >
                  Explore Cars
                </button>
                <button 
                  onClick={() => router.push('/about')}
                  className="px-8 py-4 rounded-2xl font-semibold text-slate-200 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Column: Hero Car Showcase Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group w-full max-w-md">
                {/* Ambient glow behind card */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-600 to-cyan-500 opacity-40 blur-xl group-hover:opacity-75 transition-opacity duration-500"></div>
                
                {/* Glass card container */}
                <div className="relative backdrop-blur-2xl bg-slate-900/85 border border-white/15 rounded-3xl overflow-hidden p-3.5 shadow-2xl transition-all duration-500 group-hover:border-indigo-500/50">
                  {/* Clean, unobstructed car image */}
                  <div className="relative h-60 sm:h-64 w-full rounded-2xl overflow-hidden bg-slate-950">
                    <img 
                      src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop&crop=center" 
                      alt="Premium Selection" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-slate-950/70 text-slate-200 backdrop-blur-md border border-white/10">
                        Featured
                      </span>
                    </div>
                  </div>

                  {/* Minimalist text below image - clean and non-overlapping */}
                  <div className="pt-3.5 pb-1 px-1.5 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">Premium Selection</h3>
                      <p className="text-xs text-slate-400">Luxury & Performance</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Trusted by Millions Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 backdrop-blur-md bg-slate-950/50">
          <div className="max-w-7xl mx-auto text-center">
            
            {/* Browser Logos */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-12">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md bg-white/[0.04] border border-white/10 text-slate-300 text-sm font-medium">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#4285F4"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/>
                </svg>
                <span>Chrome</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md bg-white/[0.04] border border-white/10 text-slate-300 text-sm font-medium">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#007AFF"/>
                  <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="white"/>
                </svg>
                <span>Safari</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md bg-white/[0.04] border border-white/10 text-slate-300 text-sm font-medium">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#FF1B2D"/>
                  <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">O</text>
                </svg>
                <span>Opera</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md bg-white/[0.04] border border-white/10 text-slate-300 text-sm font-medium">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#FF7139"/>
                  <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="white"/>
                </svg>
                <span>Firefox</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md bg-white/[0.04] border border-white/10 text-slate-300 text-sm font-medium">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#0078D4"/>
                  <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="white"/>
                </svg>
                <span>Edge</span>
              </div>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-12 bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
              Trusted by Millions
            </h2>
            
            {/* Testimonials Carousel */}
            <div className="relative overflow-hidden w-full py-4 [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
              <div className="flex gap-6 animate-[scrollLeft_35s_linear_infinite] w-max hover:[animation-play-state:paused]">
                
                {/* Testimonial Card 1 */}
                <div className="w-[340px] sm:w-[380px] p-6 rounded-2xl backdrop-blur-xl bg-slate-900/70 border border-white/10 text-left shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 text-lg mb-2">★★★★★</div>
                    <h3 className="text-lg font-bold text-white mb-2">Best Car Marketplace</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      "This marketplace has been a lifesaver for my car buying needs. The platform connects me with trusted sellers and the AI assistant helps me find the perfect car - it's cut my search time in half."
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">S</div>
                    <div>
                      <div className="text-sm font-semibold text-white">Sara Williams</div>
                      <div className="text-xs text-indigo-300">Car Buyer</div>
                    </div>
                  </div>
                </div>

                {/* Testimonial Card 2 */}
                <div className="w-[340px] sm:w-[380px] p-6 rounded-2xl backdrop-blur-xl bg-slate-900/70 border border-white/10 text-left shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 text-lg mb-2">★★★★★</div>
                    <h3 className="text-lg font-bold text-white mb-2">Find of the year</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      "It has simplified my car selling process with its amazing features and secure transactions. Plus it offers industry standard AI models for car recommendations. That's totally amazing!"
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white shadow-md">A</div>
                    <div>
                      <div className="text-sm font-semibold text-white">Andrew Roberts</div>
                      <div className="text-xs text-violet-300">Car Seller</div>
                    </div>
                  </div>
                </div>

                {/* Testimonial Card 3 */}
                <div className="w-[340px] sm:w-[380px] p-6 rounded-2xl backdrop-blur-xl bg-slate-900/70 border border-white/10 text-left shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 text-lg mb-2">★★★★★</div>
                    <h3 className="text-lg font-bold text-white mb-2">Amazing Experience</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      "The AI chat feature is incredible! It helped me find exactly what I was looking for. The whole process was smooth and secure. Highly recommended for anyone buying or selling cars."
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white shadow-md">M</div>
                    <div>
                      <div className="text-sm font-semibold text-white">Mike Johnson</div>
                      <div className="text-xs text-cyan-300">Car Enthusiast</div>
                    </div>
                  </div>
                </div>

                {/* Testimonial Card 4 */}
                <div className="w-[340px] sm:w-[380px] p-6 rounded-2xl backdrop-blur-xl bg-slate-900/70 border border-white/10 text-left shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 text-lg mb-2">★★★★★</div>
                    <h3 className="text-lg font-bold text-white mb-2">Perfect Platform</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      "Sold my car in just 3 days! The verification process is thorough and the payment system is super secure. This platform has revolutionized car trading in Pakistan."
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md">R</div>
                    <div>
                      <div className="text-sm font-semibold text-white">Rahul Kumar</div>
                      <div className="text-xs text-emerald-300">Car Dealer</div>
                    </div>
                  </div>
                </div>

                {/* Testimonial Card 5 */}
                <div className="w-[340px] sm:w-[380px] p-6 rounded-2xl backdrop-blur-xl bg-slate-900/70 border border-white/10 text-left shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 text-lg mb-2">★★★★★</div>
                    <h3 className="text-lg font-bold text-white mb-2">Game Changer</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      "The comparison feature is brilliant! I could compare multiple cars side by side and make an informed decision. The customer support is also top-notch."
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center font-bold text-white shadow-md">L</div>
                    <div>
                      <div className="text-sm font-semibold text-white">Lisa Chen</div>
                      <div className="text-xs text-pink-300">First-time Buyer</div>
                    </div>
                  </div>
                </div>

                {/* Testimonial Card 6 */}
                <div className="w-[340px] sm:w-[380px] p-6 rounded-2xl backdrop-blur-xl bg-slate-900/70 border border-white/10 text-left shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 text-lg mb-2">★★★★★</div>
                    <h3 className="text-lg font-bold text-white mb-2">Trusted & Reliable</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      "Been using this platform for 2 years now. The quality of cars and the transparency in transactions is unmatched. It's become my go-to place for all car-related needs."
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-white shadow-md">D</div>
                    <div>
                      <div className="text-sm font-semibold text-white">David Park</div>
                      <div className="text-xs text-indigo-300">Regular User</div>
                    </div>
                  </div>
                </div>

                {/* Duplicate cards for seamless infinite animation */}
                <div className="w-[340px] sm:w-[380px] p-6 rounded-2xl backdrop-blur-xl bg-slate-900/70 border border-white/10 text-left shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 text-lg mb-2">★★★★★</div>
                    <h3 className="text-lg font-bold text-white mb-2">Best Car Marketplace</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      "This marketplace has been a lifesaver for my car buying needs. The platform connects me with trusted sellers and the AI assistant helps me find the perfect car - it's cut my search time in half."
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">S</div>
                    <div>
                      <div className="text-sm font-semibold text-white">Sara Williams</div>
                      <div className="text-xs text-indigo-300">Car Buyer</div>
                    </div>
                  </div>
                </div>

                <div className="w-[340px] sm:w-[380px] p-6 rounded-2xl backdrop-blur-xl bg-slate-900/70 border border-white/10 text-left shadow-xl hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 text-lg mb-2">★★★★★</div>
                    <h3 className="text-lg font-bold text-white mb-2">Find of the year</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      "It has simplified my car selling process with its amazing features and secure transactions. Plus it offers industry standard AI models for car recommendations. That's totally amazing!"
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white shadow-md">A</div>
                    <div>
                      <div className="text-sm font-semibold text-white">Andrew Roberts</div>
                      <div className="text-xs text-violet-300">Car Seller</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Interactive Car Showcase Carousel */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">Inventory</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Featured Cars</h2>
              </div>
              
              {/* Carousel Controls */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => scrollCarousel('left')}
                  className="w-12 h-12 rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/15 border border-white/15 hover:border-indigo-500/40 text-white text-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                  aria-label="Previous"
                >
                  ‹
                </button>
                <button 
                  onClick={() => scrollCarousel('right')}
                  className="w-12 h-12 rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/15 border border-white/15 hover:border-indigo-500/40 text-white text-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                  aria-label="Next"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Scrollable Cars Container */}
            <div 
              ref={carCarouselRef}
              className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {[
                { title: 'Sports Car', desc: 'Performance & Speed', price: '$45,000', img: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=450&fit=crop&crop=center' },
                { title: 'SUV', desc: 'Family & Adventure', price: '$35,000', img: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&h=450&fit=crop&crop=center' },
                { title: 'Electric Car', desc: 'Eco-Friendly', price: '$55,000', img: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&h=450&fit=crop&crop=center' },
                { title: 'Luxury Sedan', desc: 'Comfort & Style', price: '$65,000', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=450&fit=crop&crop=center' },
                { title: 'Convertible', desc: 'Open Air Freedom', price: '$75,000', img: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=450&fit=crop&crop=center' },
                { title: 'Hatchback', desc: 'Compact & Efficient', price: '$25,000', img: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=450&fit=crop&crop=center' },
                { title: 'Coupe', desc: 'Sporty & Elegant', price: '$50,000', img: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&h=450&fit=crop&crop=center' },
              ].map((car, idx) => (
                <div key={idx} className="min-w-[280px] sm:min-w-[320px] snap-start">
                  <div className="group rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/50 p-3 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20">
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-3">
                      <img 
                        src={car.img} 
                        alt={car.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-indigo-600/80 backdrop-blur-md shadow-md">
                        {car.price}
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {car.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {car.desc}
                      </p>
                      <button 
                        onClick={() => router.push('/cars')}
                        className="mt-4 w-full py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-indigo-600/30 border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Video Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 border-t border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
          <div className="max-w-5xl mx-auto text-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">Overview</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 mb-4">
              How Our Marketplace Works
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-10 leading-relaxed">
              Watch how buyers and sellers connect on our platform - from initial greeting to successful car handover, experience the seamless trading process.
            </p>
            
            <div className="relative rounded-3xl p-2 bg-gradient-to-tr from-indigo-500/30 via-transparent to-cyan-500/30 border border-white/15 shadow-2xl overflow-hidden">
              <video 
                key="marketplace-video"
                className="w-full rounded-2xl shadow-inner max-h-[500px] object-cover"
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
        </section>

        {/* Features Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">Platform Benefits</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 mb-14">
              Why Choose Our Marketplace?
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: '🚗', title: 'Verified Cars', desc: 'All cars go through our strict verification process to ensure quality and authenticity.' },
                { icon: '🔒', title: 'Secure Payments', desc: 'Safe and secure transactions with our integrated payment system and buyer protection.' },
                { icon: '🤖', title: 'AI Assistant', desc: 'Get instant help with our AI-powered assistant for car recommendations and market insights.' },
                { icon: '⚡', title: 'Fast Transactions', desc: 'Quick and easy buying process with instant notifications and real-time updates.' },
              ].map((feat, idx) => (
                <div 
                  key={idx} 
                  className="p-8 rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Stats Section */}
        <section id="stats-section" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-slate-950/80 border-t border-b border-white/10 backdrop-blur-md">
          <div className="max-w-7xl mx-auto text-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">Metrics</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 mb-12">
              Our Impact
            </h2>

            {/* Marquee stats track */}
            <div className="relative overflow-hidden w-full py-4 [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]">
              <div className="flex gap-6 animate-[scrollLeft_30s_linear_infinite] w-max hover:[animation-play-state:paused]">
                {[
                  { num: '10,000+', label: 'Cars Sold' },
                  { num: '50,000+', label: 'Happy Customers' },
                  { num: '99.9%', label: 'Success Rate' },
                  { num: '24/7', label: 'Support' },
                  { num: '500+', label: 'Cities Covered' },
                  { num: '15+', label: 'Car Brands' },
                  { num: '98%', label: 'Customer Satisfaction' },
                  { num: '5★', label: 'Average Rating' },
                  // Duplicates for seamless infinite marquee
                  { num: '10,000+', label: 'Cars Sold' },
                  { num: '50,000+', label: 'Happy Customers' },
                  { num: '99.9%', label: 'Success Rate' },
                  { num: '24/7', label: 'Support' },
                ].map((stat, idx) => (
                  <div key={idx} className="min-w-[200px] p-6 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/10 text-center">
                    <div className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent mb-1">
                      {stat.num}
                    </div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Process Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">Simple Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 mb-14">
              How It Works
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {[
                { step: '1', title: 'Browse Cars', desc: 'Explore our extensive collection of verified cars with detailed information and photos.' },
                { step: '2', title: 'Compare & Choose', desc: 'Use our comparison tool to find the perfect car that matches your needs and budget.' },
                { step: '3', stepNum: '3', title: 'Secure Payment', desc: 'Complete your purchase with our secure payment system and get instant confirmation.' },
                { step: '4', stepNum: '4', title: 'Drive Away', desc: 'Pick up your new car and enjoy the ride with our comprehensive warranty coverage.' },
              ].map((step, idx) => (
                <div key={idx} className="relative p-6 rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-white/10 text-left flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 font-extrabold text-white text-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Parallax Section */}
        <section id="parallax-section" className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-slate-950/80 border-t border-b border-white/10">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="parallax-layer absolute top-0 left-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
            <div className="parallax-layer absolute bottom-0 right-10 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
              Experience Luxury
            </h2>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto mb-12">
              Discover premium cars with cutting-edge technology and unmatched performance
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-8 rounded-3xl backdrop-blur-2xl bg-white/[0.04] border border-white/10 shadow-xl">
                <span className="stat-animated-num text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent block">
                  500+
                </span>
                <span className="text-sm font-medium text-slate-400 mt-2 block">Premium Cars</span>
              </div>
              <div className="p-8 rounded-3xl backdrop-blur-2xl bg-white/[0.04] border border-white/10 shadow-xl">
                <span className="stat-animated-num text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent block">
                  98%
                </span>
                <span className="text-sm font-medium text-slate-400 mt-2 block">Satisfaction</span>
              </div>
              <div className="p-8 rounded-3xl backdrop-blur-2xl bg-white/[0.04] border border-white/10 shadow-xl">
                <span className="stat-animated-num text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent block">
                  24/7
                </span>
                <span className="text-sm font-medium text-slate-400 mt-2 block">Support</span>
              </div>
            </div>
          </div>
        </section>

        {/* Find Your Dream Car Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 p-4 shadow-2xl">
              <img 
                src="/graphic1.webp" 
                alt="Find Your Dream Car" 
                className="w-full h-auto rounded-2xl object-cover transform hover:scale-102 transition-transform duration-500" 
              />
            </div>
            <div className="space-y-6">
              <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">Buyer Hub</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Find Your Dream Car
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                Explore a wide range of cars from trusted sellers. Whether you want a family car, a sports car, or your first ride, our marketplace connects you with the best options at the best prices.
              </p>
              <button 
                onClick={() => router.push('/cars')}
                className="px-6 py-3 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Browse Inventory
              </button>
            </div>
          </div>
        </section>

        {/* Sell Your Car Fast Section */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-slate-950/60 backdrop-blur-md">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 space-y-6">
              <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">Seller Hub</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Sell Your Car Fast
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                List your car in minutes and reach thousands of potential buyers. Our platform makes it easy to upload details, photos, and connect with interested customers quickly and securely.
              </p>
              <button 
                onClick={() => router.push('/auth/signup')}
                className="px-6 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
              >
                Start Selling Today
              </button>
            </div>
            <div className="order-1 lg:order-2 relative rounded-3xl overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 p-4 shadow-2xl">
              <img 
                src="/graphic2.webp" 
                alt="Sell Your Car Fast" 
                className="w-full h-auto rounded-2xl object-cover transform hover:scale-102 transition-transform duration-500" 
              />
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
