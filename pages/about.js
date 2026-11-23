import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-4">
            <span>About Us</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight mb-4">
            About <span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">Car Marketplace</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Your trusted platform for buying and selling cars with confidence
          </p>
        </div>

        <div className="rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 p-8 sm:p-12 mb-12 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            Our Mission
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            We're revolutionizing the way people buy and sell cars by providing a secure, 
            transparent, and user-friendly platform that connects car enthusiasts, sellers, 
            and buyers across Pakistan. Our goal is to make car transactions simple, 
            trustworthy, and accessible to everyone.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🚗', title: 'Car Listings', desc: 'Browse through thousands of cars with detailed information, high-quality images, and transparent pricing from verified sellers.' },
              { icon: '💬', title: 'Real-time Chat', desc: 'Built-in messaging system for direct communication between buyers and sellers with instant notifications.' },
              { icon: '🔐', title: 'User Authentication', desc: 'Secure login system with separate dashboards for buyers and sellers, including profile management.' },
              { icon: '📱', title: 'Responsive Design', desc: 'Mobile-friendly interface that works perfectly on all devices - desktop, tablet, and mobile phones.' },
              { icon: '🔍', title: 'Advanced Search', desc: 'Filter cars by price, year, miles, registration city, and other criteria to find your perfect match.' },
              { icon: '💳', title: 'Secure Payments', desc: 'Integrated Stripe payment system for safe and secure transactions between buyers and sellers.' },
            ].map((feat, idx) => (
              <div 
                key={idx} 
                className="p-6 rounded-3xl backdrop-blur-xl bg-slate-900/60 border border-white/10 hover:border-indigo-500/40 shadow-xl transition-all hover:-translate-y-1.5"
              >
                <div className="text-3xl mb-4">{feat.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 p-8 sm:p-12 mb-12 shadow-xl text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Platform Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { num: '1000+', label: 'Cars Listed' },
              { num: '500+', label: 'Active Users' },
              { num: '25+', label: 'Cities Covered' },
              { num: '24/7', label: 'Support Available' },
            ].map((stat, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent mb-1">
                  {stat.num}
                </div>
                <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 p-8 sm:p-12 mb-12 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2.5">
            <span className="w-2 h-6 bg-cyan-500 rounded-full"></span>
            Our Team
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Car Marketplace is built and maintained by a dedicated team of developers, 
            designers, and automotive enthusiasts who understand the importance of 
            reliable car trading platforms. We're committed to continuously improving 
            our service and providing the best experience for our users.
          </p>
        </div>

        <div className="rounded-3xl backdrop-blur-xl bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/30 p-8 sm:p-12 shadow-xl text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Get in Touch</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
            Have questions or suggestions? We'd love to hear from you! Reach out to our support team for assistance.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a 
              href="mailto:hkmrkhan10@gmail.com" 
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white transition-all flex items-center gap-2"
            >
              <span>📧</span> hkmrkhan10@gmail.com
            </a>
            <a 
              href="tel:+923208196396" 
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white transition-all flex items-center gap-2"
            >
              <span>📞</span> +923208196396
            </a>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
