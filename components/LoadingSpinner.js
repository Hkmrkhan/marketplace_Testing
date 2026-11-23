import React from 'react';

export default function LoadingSpinner({ message = "Loading cars..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 my-4 select-none">
      {/* Mini Animated Sports Car */}
      <div className="relative w-44 h-16 flex items-center justify-center">
        <svg viewBox="0 0 320 120" className="w-full h-auto overflow-visible animate-pulse">
          <defs>
            <linearGradient id="miniCarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="miniBeam" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Headlight beam */}
          <polygon points="275,68 340,30 340,105 275,76" fill="url(#miniBeam)" />

          {/* Car Body */}
          <path 
            d="M 30 75 L 55 85 L 105 85 L 120 80 L 210 80 L 225 85 L 265 85 L 290 75 L 295 68 L 275 65 L 220 54 L 165 40 L 105 40 L 65 52 L 40 62 Z" 
            fill="url(#miniCarGrad)" 
            stroke="#818cf8" 
            strokeWidth="1.5"
          />

          {/* Windshield */}
          <polygon points="110,44 162,44 212,56 195,56 150,47 115,47" fill="#0f172a" opacity="0.9" />

          {/* Headlight & Taillight */}
          <circle cx="288" cy="69" r="3" fill="#ffffff" />
          <rect x="32" y="66" width="6" height="5" rx="1" fill="#f43f5e" />

          {/* Rear Wheel */}
          <g transform="translate(80, 85)" className="mini-spin">
            <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#334155" strokeWidth="3" />
            <circle cx="0" cy="0" r="10" fill="#1e293b" />
            <line x1="0" y1="-10" x2="0" y2="10" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" />
          </g>

          {/* Front Wheel */}
          <g transform="translate(245, 85)" className="mini-spin">
            <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#334155" strokeWidth="3" />
            <circle cx="0" cy="0" r="10" fill="#1e293b" />
            <line x1="0" y1="-10" x2="0" y2="10" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" />
          </g>
        </svg>

        {/* Speed Track */}
        <div className="absolute -bottom-1 left-4 right-4 h-[2px] overflow-hidden">
          <div className="mini-road"></div>
        </div>
      </div>

      {/* Loading message */}
      <p className="mt-3 text-xs tracking-wider font-medium text-slate-400 uppercase flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
        {message}
      </p>

      <style jsx>{`
        .mini-spin {
          animation: spinWheel 0.4s linear infinite;
          transform-origin: 0 0;
        }
        @keyframes spinWheel {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .mini-road {
          width: 200%;
          height: 100%;
          background: repeating-linear-gradient(
            90deg,
            rgba(6, 182, 212, 0.8) 0px,
            rgba(6, 182, 212, 0.8) 12px,
            transparent 12px,
            transparent 24px
          );
          animation: miniRoadMove 0.3s linear infinite;
        }
        @keyframes miniRoadMove {
          from { transform: translateX(0); }
          to { transform: translateX(-24px); }
        }
      `}</style>
    </div>
  );
}
