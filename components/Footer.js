import Link from 'next/link';

export default function Footer({ userType }) {
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
    <footer className="relative mt-24 backdrop-blur-2xl bg-slate-950/90 border-t border-white/10 text-slate-300">
      
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          <div>
            <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
              Useful Links
            </h4>
            <ul className="space-y-2.5 list-none p-0 m-0 text-sm">
              <li>
                <Link href="/" className="hover:text-indigo-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-indigo-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-indigo-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              Follow Us
            </h4>
            <div className="flex flex-wrap gap-2.5">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener" 
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm"
              >
                Facebook
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener" 
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-600/20 border border-white/10 hover:border-cyan-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm"
              >
                Twitter
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener" 
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-pink-600/20 border border-white/10 hover:border-pink-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm"
              >
                Instagram
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
              Contact
            </h4>
            <div className="space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2 m-0">
                <span className="text-indigo-400">📧</span> hkmrkhan10@gmail.com
              </p>
              <p className="flex items-center gap-2 m-0">
                <span className="text-cyan-400">📞</span> +923208196396
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <h4 className="text-white font-semibold text-base mb-2">
              {infoTitle}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed m-0">
              {infoDesc}
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="m-0">
            Car Marketplace &copy; {new Date().getFullYear()} | All rights reserved
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
