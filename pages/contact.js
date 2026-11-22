import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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
    const message = `*New Contact Form Message*%0A%0A*Name:* ${formData.name}%0A*Email:* ${formData.email}%0A%0A*Message:*%0A${formData.message}%0A%0A*Sent from:* Car Marketplace Website`;
    const whatsappUrl = `https://wa.me/923208196396?text=${message}`;
    window.open(whatsappUrl, '_blank');
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
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Contact Info Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Contact <span className="bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">Us</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
            Have questions or need assistance? Reach out directly or send us a message below.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 text-xs font-semibold text-white">
              <span>📧</span>
              <span>hkmrkhan10@gmail.com</span>
            </div>
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 text-xs font-semibold text-white">
              <span>📞</span>
              <span>+923208196396</span>
            </div>
          </div>
        </div>

        {/* Message Form Card */}
        <div className="rounded-3xl backdrop-blur-2xl bg-slate-900/80 border border-white/10 p-8 sm:p-10 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Send us a Message</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Your Name
              </label>
              <input 
                type="text" 
                id="name"
                name="name"
                placeholder="Your Name" 
                value={formData.name}
                onChange={handleInputChange}
                required 
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Your Email
              </label>
              <input 
                type="email" 
                id="email"
                name="email"
                placeholder="your.email@example.com" 
                value={formData.email}
                onChange={handleInputChange}
                required 
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Your Message
              </label>
              <textarea 
                id="message"
                name="message"
                placeholder="Write your message here..." 
                value={formData.message}
                onChange={handleInputChange}
                required 
                rows="5"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
              <button 
                type="submit" 
                className="px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all cursor-pointer text-sm"
              >
                Send Message via WhatsApp
              </button>

              <div>
                {hasFormData() ? (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 transition-all cursor-pointer"
                  >
                    Back
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

      </main>

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/20 p-6 shadow-2xl text-center">
            <h3 className="text-base font-bold text-white mb-2">Are you sure you want to cancel?</h3>
            <p className="text-xs text-slate-400 mb-6">All entered data will be cleared.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={confirmCancel}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer"
              >
                Yes, Clear
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              >
                No, Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
