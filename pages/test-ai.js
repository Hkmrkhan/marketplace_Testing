import { useState } from 'react';
import AIChat from '../components/AIChat';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TestAIPage() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold text-white mb-2">AI Chatbot Test Page</h1>
        <p className="text-slate-400 text-sm">Testing AI chatbot assistant functionality</p>
        
        <button 
          onClick={() => setShowChat(!showChat)}
          className="my-8 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer text-sm"
        >
          {showChat ? 'Hide Chat' : 'Show Chat'}
        </button>
        
        {showChat && (
          <div className="my-6 mx-auto max-w-md h-96 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <AIChat context="test" isFloating={false} />
          </div>
        )}
        
        <div className="p-8 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 max-w-lg mx-auto text-left shadow-xl">
          <h3 className="text-lg font-bold text-white mb-2">🎉 AI Chatbot is Global!</h3>
          <p className="text-xs text-slate-300 mb-4">The AI chatbot floating button appears on all pages of the website!</p>
          <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
            <li>Home page</li>
            <li>Cars page</li>
            <li>Buyer dashboard</li>
            <li>Seller dashboard</li>
            <li>All other pages</li>
          </ul>
          <p className="mt-4 text-xs font-semibold text-indigo-400">
            🤖 Look for the floating button at the bottom right of any page!
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
