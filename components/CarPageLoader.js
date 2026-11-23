import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function CarPageLoader({ forceShow = false, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('IGNITING ENGINE...');
  const [isAccelerating, setIsAccelerating] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const router = useRouter();
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    let currentProgress = 0;
    const interval = setInterval(() => {
      if (!mountedRef.current) return;

      currentProgress += Math.floor(Math.random() * 12) + 6;
      if (currentProgress > 100) currentProgress = 100;
      setProgress(currentProgress);

      if (currentProgress < 30) {
        setStatusText('STARTING ENGINE...');
      } else if (currentProgress < 65) {
        setStatusText('CHARGING TWIN-TURBO...');
      } else if (currentProgress < 95) {
        setStatusText('ENGAGING LAUNCH CONTROL...');
      } else {
        setStatusText('MAXIMUM BOOST 🚀');
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsAccelerating(true);

        setTimeout(() => {
          if (!mountedRef.current) return;
          setFadeOut(true);

          setTimeout(() => {
            if (!mountedRef.current) return;
            setLoading(false);
            if (onComplete) onComplete();
          }, 450);
        }, 550);
      }
    }, 45);

    const handleStart = (url) => {
      if (url !== router.asPath) {
        setFadeOut(false);
        setIsAccelerating(false);
        setProgress(20);
        setStatusText('ACCELERATING...');
        setLoading(true);
      }
    };

    const handleComplete = () => {
      setProgress(100);
      setIsAccelerating(true);
      setTimeout(() => {
        if (!mountedRef.current) return;
        setFadeOut(true);
        setTimeout(() => {
          if (!mountedRef.current) return;
          setLoading(false);
        }, 400);
      }, 400);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router, onComplete]);

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(() => {
      setLoading(false);
      if (onComplete) onComplete();
    }, 250);
  };

  if (!loading && !forceShow) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl select-none transition-all duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
      onClick={handleSkip}
      title="Click anywhere to skip"
    >
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className={`relative w-full max-w-2xl px-6 flex flex-col items-center transition-transform duration-700 ease-in-out ${
        isAccelerating ? 'translate-x-[110vw] scale-105 opacity-80' : 'translate-x-0'
      }`}>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="speed-line line-1"></div>
          <div className="speed-line line-2"></div>
          <div className="speed-line line-3"></div>
          <div className="speed-line line-4"></div>
        </div>

        <div className="relative w-full max-w-[480px] drop-shadow-[0_20px_35px_rgba(99,102,241,0.35)]">
          <svg 
            viewBox="0 0 520 180" 
            className={`w-full h-auto overflow-visible ${isAccelerating ? 'car-launch' : 'car-idle'}`}
          >
            <defs>
              
              <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e1b4b" />
                <stop offset="35%" stopColor="#312e81" />
                <stop offset="70%" stopColor="#4338ca" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>

              <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>

              <linearGradient id="headlightBeam" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="30%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#0284c7" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="taillightGlow" x1="100%" y1="50%" x2="0%" y2="50%">
                <stop offset="0%" stopColor="#ff0055" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#e11d48" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#be123c" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="wheelRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              <radialGradient id="hubCapGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="60%" stopColor="#1e1b4b" />
                <stop offset="100%" stopColor="#090d16" />
              </radialGradient>

              <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <polygon 
              points="455,102 560,35 560,165 455,115" 
              fill="url(#headlightBeam)" 
              className="headlight-cone"
            />
            
            <ellipse cx="460" cy="108" rx="15" ry="8" fill="#38bdf8" filter="url(#neonBlur)" opacity="0.9" />
            <circle cx="462" cy="108" r="4" fill="#ffffff" />

            <polygon 
              points="55,108 0,95 0,125 55,114" 
              fill="url(#taillightGlow)" 
              className="taillight-trail"
            />
            
            <g className={`exhaust-flame ${isAccelerating ? 'flame-active' : ''}`}>
              <polygon points="42,126 12,123 24,127 10,131 42,129" fill="#38bdf8" filter="url(#neonBlur)" />
              <polygon points="42,127 20,125 28,127 18,129 42,128" fill="#ffffff" />
            </g>

            <ellipse cx="260" cy="154" rx="205" ry="12" fill="#000000" opacity="0.65" filter="url(#neonBlur)" />

            <g className="car-chassis">
              
              <path 
                d="M 45 125 L 85 136 L 155 136 L 175 130 L 335 130 L 355 136 L 425 136 L 475 122 L 485 112 L 465 106 L 420 102 L 345 88 L 265 64 L 170 65 L 105 84 L 60 100 L 45 110 Z" 
                fill="url(#carBodyGrad)" 
                stroke="#4f46e5" 
                strokeWidth="1.5"
              />

              <path 
                d="M 175 66 L 260 65 L 340 88 L 315 88 L 245 72 L 180 72 Z" 
                fill="#0f172a" 
                stroke="#6366f1" 
                strokeWidth="1"
              />
              <path 
                d="M 180 71 L 242 71 L 242 88 L 145 88 Z" 
                fill="#1e293b" 
                opacity="0.8"
              />
              
              <polygon points="200,71 230,71 185,88 165,88" fill="#38bdf8" opacity="0.35" />

              <path 
                d="M 65 104 Q 160 98 250 94 T 445 104" 
                fill="none" 
                stroke="url(#accentGlow)" 
                strokeWidth="2.5" 
                filter="url(#neonBlur)"
              />
              <path 
                d="M 95 120 L 140 120 M 360 120 L 415 120" 
                fill="none" 
                stroke="#818cf8" 
                strokeWidth="1.5" 
                opacity="0.7"
              />

              <polygon points="175,100 205,100 190,118 165,118" fill="#090d16" stroke="#4338ca" strokeWidth="1" />

              <path 
                d="M 40 92 L 68 92 L 62 97 L 42 97 Z" 
                fill="#4338ca" 
                stroke="#6366f1" 
                strokeWidth="1.5"
              />
              <line x1="48" y1="97" x2="48" y2="105" stroke="#312e81" strokeWidth="2.5" />
              <line x1="62" y1="97" x2="62" y2="105" stroke="#312e81" strokeWidth="2.5" />

              <path 
                d="M 45 108 L 60 108 L 58 114 L 45 114 Z" 
                fill="#f43f5e" 
                filter="url(#neonBlur)" 
              />
              <circle cx="50" cy="111" r="2.5" fill="#ffffff" />

              <polygon points="445,103 468,107 458,114 438,110" fill="#0284c7" />
              <path d="M 445 104 L 467 107" stroke="#38bdf8" strokeWidth="3" filter="url(#neonBlur)" />
              <circle cx="462" cy="107" r="3" fill="#ffffff" />
            </g>

            <g transform="translate(120, 136)">
              
              <circle cx="0" cy="0" r="28" fill="#0f172a" stroke="#334155" strokeWidth="5" />
              
              <circle cx="0" cy="0" r="20" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <path d="M -8 -16 A 18 18 0 0 1 8 -16 L 6 -10 A 12 12 0 0 0 -6 -10 Z" fill="#06b6d4" filter="url(#neonBlur)" />
              
              <g className="wheel-spin">
                <circle cx="0" cy="0" r="17" fill="none" stroke="url(#wheelRimGrad)" strokeWidth="2.5" />
                <line x1="0" y1="-17" x2="0" y2="17" stroke="#94a3b8" strokeWidth="2" />
                <line x1="-17" y1="0" x2="17" y2="0" stroke="#94a3b8" strokeWidth="2" />
                <line x1="-12" y1="-12" x2="12" y2="12" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="-12" y1="12" x2="12" y2="-12" stroke="#cbd5e1" strokeWidth="1.5" />
                
                <circle cx="0" cy="0" r="6" fill="url(#hubCapGrad)" stroke="#38bdf8" strokeWidth="1" />
              </g>
            </g>

            <g transform="translate(390, 136)">
              
              <circle cx="0" cy="0" r="28" fill="#0f172a" stroke="#334155" strokeWidth="5" />
              
              <circle cx="0" cy="0" r="20" fill="#1e293b" stroke="#475569" strokeWidth="1" />
              <path d="M -8 -16 A 18 18 0 0 1 8 -16 L 6 -10 A 12 12 0 0 0 -6 -10 Z" fill="#06b6d4" filter="url(#neonBlur)" />
              
              <g className="wheel-spin">
                <circle cx="0" cy="0" r="17" fill="none" stroke="url(#wheelRimGrad)" strokeWidth="2.5" />
                <line x1="0" y1="-17" x2="0" y2="17" stroke="#94a3b8" strokeWidth="2" />
                <line x1="-17" y1="0" x2="17" y2="0" stroke="#94a3b8" strokeWidth="2" />
                <line x1="-12" y1="-12" x2="12" y2="12" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="-12" y1="12" x2="12" y2="-12" stroke="#cbd5e1" strokeWidth="1.5" />
                
                <circle cx="0" cy="0" r="6" fill="url(#hubCapGrad)" stroke="#38bdf8" strokeWidth="1" />
              </g>
            </g>
          </svg>
        </div>

        <div className="relative w-full max-w-[440px] h-3 mt-1 overflow-hidden">
          <div className="road-dashes"></div>
        </div>

        <div className="w-full max-w-md mt-6 flex flex-col items-center">

          <div className="w-full flex items-center justify-between text-xs tracking-wider font-mono text-slate-400 mb-2 px-1">
            <span className="flex items-center gap-1.5 text-indigo-400 font-semibold uppercase animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
              {statusText}
            </span>
            <span className="text-cyan-300 font-bold text-sm">
              {progress}% <span className="text-slate-500 font-normal text-xs">READY</span>
            </span>
          </div>

          <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden p-[1px] border border-white/10 shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-all duration-150 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-3 bg-white rounded-full blur-[1px] opacity-80"></div>
            </div>
          </div>

          <p className="text-[11px] font-medium text-slate-500 mt-4 tracking-widest uppercase hover:text-slate-300 transition-colors cursor-pointer">
            Press anywhere or click to skip
          </p>
        </div>
      </div>

      <style jsx>{`
        /* Wheel rotation animation */
        .wheel-spin {
          animation: spin 0.4s linear infinite;
          transform-origin: 0 0;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Car suspension idle vibration */
        .car-idle {
          animation: suspension 0.6s ease-in-out infinite alternate;
        }
        @keyframes suspension {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-1.5px) rotate(-0.3deg); }
          100% { transform: translateY(0.5px) rotate(0.2deg); }
        }

        /* Launch control squat & forward thrust */
        .car-launch {
          animation: launchThrust 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes launchThrust {
          0% { transform: translateY(0px) rotate(0deg); }
          30% { transform: translateY(3px) rotate(0.8deg); }
          100% { transform: translateY(-2px) rotate(-1deg); }
        }

        /* Road lane dashes streaming backwards */
        .road-dashes {
          width: 200%;
          height: 2px;
          background: repeating-linear-gradient(
            90deg,
            rgba(6, 182, 212, 0.8) 0px,
            rgba(6, 182, 212, 0.8) 25px,
            transparent 25px,
            transparent 50px
          );
          animation: roadMove 0.35s linear infinite;
        }
        @keyframes roadMove {
          from { transform: translateX(0); }
          to { transform: translateX(-50px); }
        }

        /* Speed wind lines */
        .speed-line {
          position: absolute;
          height: 1.5px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.7), transparent);
          animation: windStreak 0.5s linear infinite;
        }
        .line-1 { top: 20%; left: 0; width: 140px; animation-delay: 0s; }
        .line-2 { top: 45%; left: 10%; width: 220px; animation-delay: 0.15s; }
        .line-3 { top: 75%; left: 5%; width: 180px; animation-delay: 0.25s; }
        .line-4 { top: 30%; left: 20%; width: 160px; animation-delay: 0.35s; }

        @keyframes windStreak {
          from { transform: translateX(200%); opacity: 0; }
          50% { opacity: 0.8; }
          to { transform: translateX(-150%); opacity: 0; }
        }

        /* Exhaust flame turbo burst */
        .exhaust-flame {
          opacity: 0.3;
          transform: scaleX(0.8);
          transform-origin: right center;
          transition: all 0.2s ease;
        }
        .flame-active {
          opacity: 1;
          transform: scaleX(1.6);
          animation: flameFlicker 0.1s infinite alternate;
        }
        @keyframes flameFlicker {
          from { transform: scaleX(1.4) scaleY(0.9); }
          to { transform: scaleX(1.9) scaleY(1.2); }
        }

        /* Headlight cone pulse */
        .headlight-cone {
          animation: beamGlow 1.2s ease-in-out infinite alternate;
        }
        @keyframes beamGlow {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
